(() => {
  const D=window.ResponsibilityData;
  const pad=n=>String(n).padStart(2,'0');
  const day=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const stamp=d=>day(d)+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  const time=v=>new Date(String(v||'').replace(' ','T')).getTime();
  const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
  const percent=(a,b)=>b?Math.round(a/b*1000)/10:null;
  const fmt=v=>v===null||v===undefined?'—':v+'%';
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const demo=()=>{
    const result=[],types=['货架区未佩戴安全帽','违规吸烟','消防通道堵塞','人员入侵','车辆逆行','未佩戴安全带'];
    const zones=['1#仓库 / 1层 / 货架区','1#仓库 / 2层 / 装卸作业区','2#仓库 / 1层 / 货架区','园区配套区域 / 地面区域 / 配电房','园区配套区域 / 地面区域 / 1号交通环','3#仓库 / 2层 / 货架区'];
    for(let offset=0;offset<95;offset++)for(let i=0;i<5+(offset%6);i++){
      const d=new Date();d.setDate(d.getDate()-offset);d.setHours(7+i,3+(offset*7+i)%50,0,0);
      if(d.getTime()>Date.now())continue;
      const n=offset*13+i,k=n%12,confirmed=k<7,mis=k>=7&&k<9,planned=k===9;
      const review=confirmed||mis||planned,accepted=confirmed&&n%7!==0,done=accepted&&n%4!==0;
      const reviewerTime=new Date(+d+(2+n%10)*60000),receiptTime=new Date(+reviewerTime+(1+n%14)*60000),doneTime=new Date(+receiptTime+(8+n%75)*60000);
      const p=D.people[n%D.people.length];
      result.push({id:'STAT-DEMO-'+day(d).replaceAll('-','')+'-'+i,type:types[n%6],area:zones[(n+offset)%6],device:'视频监控 '+pad(n%24+1),time:stamp(d),level:['一级','二级','三级','四级'][n%4],owner:p.name,department:D.departments.find(t=>t.id===p.departmentId).name,status:review?'已复核':'待复核',result:confirmed?'确认违规':mis?'误报':planned?'计划内事件':'—',reviewTime:review?stamp(reviewerTime):'',receipt:accepted?{time:stamp(receiptTime),person:p.name}:null,disposal:done?{time:stamp(doneTime),person:p.name,violator:D.people[(n+3)%9].name}:null,demo:true});
    }
    return result;
  };
  const isFire=r=>!!(r.isFire||window.AlarmSourceRules?.isFire(r));
  const caseEligible=r=>r.confirmed||isFire(r);
  const load=source=>{
    if(source==='demo')return [...demo(),...(window.ALARM_DEMO_RECORDS||[]).filter(isFire)];
    const extra=read('global-alarm-center-v1').extra||[],map=new Map((window.ALARM_DEMO_RECORDS||[]).map(r=>[r.id,{...r}]));
    extra.forEach(r=>map.set(r.id,{...r}));const receipts=read('alarm-case-receipts-v1'),disposals=read('alarm-case-disposals-v1');
    return [...map.values()].map(r=>{const p=D.people.find(p=>p.name===r.owner);return {...r,department:p?D.departments.find(d=>d.id===p.departmentId).name:'未分配部门',receipt:receipts[r.id]||null,disposal:disposals[r.id]||null};});
  };
  const normalize=(r,now=Date.now())=>{
    if(isFire(r)){
      const end=r.resolvedAt||r.completedAt||r.disposal?.time;
      const completed=['已处置','已恢复','完成处理','已闭环'].includes(r.alarmStatus||r.fireStatus||r.processingStatus||r.caseStatus);
      const elapsed=completed?(time(end)-time(r.time))/60000:null;
      const duration=Number.isFinite(elapsed)&&elapsed>=0?elapsed:null;
      const late=r.disposalLate===true||r.disposalOverdue===true||r.disposalOverdue==='是'||/^超期/.test(String(r.disposalOverdue||''));
      return {...r,isFire:true,confirmed:false,received:false,completed,duration,caseStatus:completed?'已闭环':'待处置',reviewLate:false,disposalLate:late};
    }
    if(r.demo&&time(r.reviewTime)>now)r={...r,status:'待复核',result:'—',reviewTime:'',receipt:null,disposal:null};
    const confirmed=r.status==='已复核'&&r.result==='确认违规',settings=window.AlarmBasicSettings?.get()||{reviewSeconds:300,disposalSeconds:1800};
    const reviewEnd=r.status==='已复核'?time(r.reviewTime):now;
    const receipt=r.receipt,disposal=r.disposal;
    const completed=confirmed&&!!disposal&&Number.isFinite(time(disposal.time))&&time(disposal.time)<=now;
    const received=confirmed&&!!receipt&&Number.isFinite(time(receipt.time))&&time(receipt.time)<=now;
    const duration=completed?Math.max(0,(time(disposal.time)-time(r.time))/60000):null;
    return {...r,confirmed,completed,received,duration,caseStatus:!confirmed?'无需查处':completed?'已闭环':received?'待处置':'待接收',reviewLate:Number.isFinite(reviewEnd)&&reviewEnd-time(r.time)>settings.reviewSeconds*1000,disposalLate:confirmed&&received&&(completed?time(disposal.time):now)-time(receipt.time)>settings.disposalSeconds*1000};
  };
  const period=(kind='month',at=new Date())=>{
    const end=+at,start=new Date(at);start.setHours(0,0,0,0);
    if(kind==='week')start.setDate(start.getDate()-((start.getDay()+6)%7));
    if(kind==='month')start.setDate(1);
    if(kind==='quarter'){start.setDate(1);start.setMonth(Math.floor(start.getMonth()/3)*3);}
    return [+start,end];
  };
  const completedPeriod=(kind,at=new Date())=>{
    const end=new Date(at);end.setHours(0,0,0,0);
    if(kind==='weekly')end.setDate(end.getDate()-((end.getDay()+6)%7));
    if(kind==='monthly')end.setDate(1);
    const start=new Date(end);if(kind==='daily')start.setDate(start.getDate()-1);if(kind==='weekly')start.setDate(start.getDate()-7);if(kind==='monthly')start.setMonth(start.getMonth()-1);
    return [+start,+end-1];
  };
  const matchesArea=(area,value)=>{
    if(window.AreaCascade)return window.AreaCascade.matches(area,value);
    const selected=(Array.isArray(area)?area:area?[area]:[]).filter(Boolean);
    const path=v=>String(v||'').split(/\s*\/\s*|-/).join(' / ');
    return !selected.length||selected.some(item=>path(value)===path(item)||path(value).startsWith(path(item)+' / '));
  };
  const filter=(rows,{range,area,type,level,department}={})=>rows.filter(r=>(!range||(time(r.time)>=range[0]&&time(r.time)<=range[1]))&&matchesArea(area,r.area)&&(!type||r.type===type)&&(!level||r.level===level)&&(!department||r.department===department));
  const stats=rows=>{
    const ai=rows.filter(r=>!isFire(r));
    const confirmed=rows.filter(r=>r.confirmed),done=rows.filter(r=>caseEligible(r)&&r.completed),mis=rows.filter(r=>r.status==='已复核'&&r.result==='误报');
    const planned=rows.filter(r=>r.status==='已复核'&&r.result==='计划内事件'),pending=rows.filter(r=>!isFire(r)&&r.status!=='已复核');
    return {total:rows.length,confirmed:confirmed.length,mis:mis.length,planned:planned.length,suspected:rows.filter(r=>r.status==='已复核'&&r.result==='疑似').length,pending:pending.length,reviewed:ai.length-pending.length,accuracy:percent(confirmed.length,confirmed.length+mis.length),reviewRate:percent(ai.length-pending.length,ai.length),closed:done.length,closeRate:percent(done.length,rows.filter(caseEligible).length),waiting:confirmed.filter(r=>!r.received&&!r.completed).length,processing:rows.filter(r=>caseEligible(r)&&!r.completed&&(isFire(r)||r.received)).length,reviewLate:rows.filter(r=>r.reviewLate).length,disposalLate:rows.filter(r=>caseEligible(r)&&r.disposalLate).length,avgMinutes:done.some(r=>Number.isFinite(r.duration))?Math.round(done.filter(r=>Number.isFinite(r.duration)).reduce((s,r)=>s+r.duration,0)/done.filter(r=>Number.isFinite(r.duration)).length):null};
  };
  const groups=(rows,key)=>{
    const map=new Map();rows.forEach(r=>{const value=key==='date'?r.time.slice(0,10):key==='person'?r.disposal?.violator?.replace(/（.*$/,'')||'未登记违规人员':r[key]||'未分配';if(!map.has(value))map.set(value,[]);map.get(value).push(r);});
    return [...map].map(([name,items])=>({name,rows:items,...stats(items)}));
  };
  const trend=(rows,range)=>{
    const grouped=new Map(groups(rows,'date').map(g=>[g.name,g]));const result=[],d=new Date(range[0]);d.setHours(0,0,0,0);
    while(+d<=range[1]&&result.length<366){const name=day(d);result.push(grouped.get(name)||{name,...stats([]),rows:[]});d.setDate(d.getDate()+1);}return result;
  };
  const csv=(name,headers,rows)=>{
    const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    const safeCell=v=>/^[=+@\-\t\r]/.test(String(v??''))?"'"+v:v;
    const blob=new Blob(['\uFEFF'+[headers,...rows].map(r=>r.map(v=>quote(safeCell(v))).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});download(name,blob);
  };
  const download=(name,blob)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const insights=rows=>{
    const s=stats(rows),top=groups(rows.filter(r=>r.confirmed),'area').sort((a,b)=>b.confirmed-a.confirmed)[0];
    const notes=[s.total?'期间共触发 '+s.total+' 条报警，确认违规 '+s.confirmed+' 条，误报 '+s.mis+' 条，计划内事件 '+s.planned+' 条，疑似 '+s.suspected+' 条。':'期间没有报警记录，暂无可分析数据。'];
    if(s.confirmed)notes.push('确认违规已闭环 '+s.closed+' 条，闭环率 '+fmt(s.closeRate)+'；仍有 '+(s.waiting+s.processing)+' 条待闭环。');
    if(top)notes.push('确认违规最多的区域为 '+top.name+'，共 '+top.confirmed+' 条，建议优先核查现场作业与防护措施。');
    if(s.pending)notes.push('待复核 '+s.pending+' 条，请优先完成复核，再评估准确率。');
    if(s.disposalLate)notes.push('处置超期 '+s.disposalLate+' 条，建议逐条核实责任人及整改进度。');
    if(s.mis)notes.push('存在 '+s.mis+' 条误报，建议按违规事件类型与场景复查样本、调整识别策略。');
    return notes;
  };
  window.StatsEngine={isFire,caseEligible,D,day,stamp,time,read,percent,fmt,safe,demo,load,normalize,period,completedPeriod,filter,stats,groups,trend,csv,download,insights};
})();
