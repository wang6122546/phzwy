(() => {
 const {createApp,ref,computed,watch,onMounted,onBeforeUnmount} = Vue;
 const S=window.AlarmSourceRules,isFire=S.isFire;
 const areaPath=r=>{
  const d=window.ResponsibilityData;
  if(!d)return r.area||'—';
  const asset=[...d.videos,...d.devices].find(item=>item.id===r.deviceId);
  // Match the warehouse fire-host placement used by the monitoring map.
  const buildingId=String(r.deviceId||'').startsWith('fire-')?r.deviceId.slice(5):null;
  const floor=d.floors.find(item=>item.buildingId===buildingId);
  const areaId=r.areaId||asset?.areaId||(floor&&d.areas.find(item=>item.floorId===floor.id)?.id);
  return (areaId&&d.path(areaId))||[r.buildingName,r.floorName,r.area].filter(Boolean).join(' / ')||'—';
 };
 const key='alarm-case-disposals-v1';
 const callKey='alarm-case-phone-interventions-v1';
 const readCalls=()=>{try{return JSON.parse(localStorage.getItem(callKey))||{};}catch{return {};}};
 const receiptKey='alarm-case-receipts-v1';
 const readReceipts=()=>{if(window.StatsDrill?.demo)return Object.fromEntries(window.StatsDrill.rows.filter(r=>r.receipt&&r.received).map(r=>[r.id,r.receipt]));try{return JSON.parse(localStorage.getItem(receiptKey))||{};}catch{return {};}};
 const read=()=>{if(window.StatsDrill?.demo)return Object.fromEntries(window.StatsDrill.rows.filter(r=>r.disposal&&r.completed).map(r=>[r.id,r.disposal]));try{return JSON.parse(localStorage.getItem(key))||{};}catch{return {};}};
 const theme={common:{primaryColor:'#0879ff',primaryColorHover:'#3d8fff',primaryColorPressed:'#065fd4',fontSize:'14px',fontWeightStrong:'400',borderRadius:'8px',textColor2:'#24344d'},Input:{heightMedium:'36px',border:'1px solid #d8e2ef'},Select:{peers:{InternalSelection:{heightMedium:'36px',border:'1px solid #d8e2ef'}}},Button:{heightMedium:'36px',fontWeight:'400'}};
 window.CaseManagementRules={eligible:r=>isFire(r)||r.status==='已复核'&&r.result==='确认违规',validate:f=>f.violatorType==='external'&&!f.externalName?.trim()?'请填写外来人员姓名':f.violatorType==='external'&&!/^1[3-9]\d{9}$/.test(f.externalPhone||'')?'请填写正确的11位手机号码':!f.violator?'请选择违规人员':!f.description.trim()?'请填写处理经过描述':!f.measures.trim()?'请填写整改措施':''};
 createApp({setup(){
  const calls=ref(readCalls()),currentRole=ref('值守人员'),callShow=ref(false),callView=ref(false),callTarget=ref(null),callError=ref(''),callForm=ref({contact:'',content:'',result:'已联系'});
  const clockNow=ref(Date.now());let overdueTimer;
  const disposalLimitSeconds=1800;
  const disposalOverdue=r=>{const start=receipts.value[r.id]?.time;if(!start)return '否';const end=disposals.value[r.id]?.time;const elapsed=((end?new Date(end.replace(' ','T')).getTime():clockNow.value)-new Date(start.replace(' ','T')).getTime())/1000;const excess=elapsed-(window.AlarmBasicSettings?.get().disposalSeconds||disposalLimitSeconds);return excess>0?'超期'+Math.ceil(excess/60)+'分钟':'否';};
  const receipts=ref(readReceipts()),detailTab=ref('details');
  const source=ref(window.StatsDrill?.rows?.length&&window.StatsDrill.rows.every(isFire)?'fire':'ai');
  const F=window.FireEventTable,fireCategory=ref('火警'),fireFilters=ref({});
  const records=ref([]),disposals=ref(read()),expanded=ref(false),keyword=ref(''),type=ref(null),level=ref(null),status=ref(null),area=ref([]),disposalOverdueFilter=ref(null),range=ref(null),page=ref(1),pageSize=ref(10),drawer=ref(false),mode=ref('detail'),active=ref(null),error=ref(''),notice=ref(''),preview=ref(null),videoUnavailable=ref(false);
  const form=ref({violator:null,violatorType:'internal',externalName:'',externalPhone:'',description:'',measures:'',person:'张安全',evidence:[]});
  const handlingExamples=list=>{
   const base=list.find(r=>!isFire(r)&&window.CaseManagementRules.eligible(r));if(!base)return list;
   const today=new Date().toLocaleDateString('sv-SE');
   const examples=[
    ['UNHANDLED','未处理','09:40:00','等待华南单位核查处理。',''],
    ['COMPLETED','完成处理','09:35:00','已完成现场核查及安全教育，现场违规行为已纠正。','已完成现场整改并复查。'],
    ['NOT-REQUIRED','无需处理','09:30:00','华南单位核查确认该事件无需采取进一步处理措施，结束跟进。','无需采取处理措施。'],
    ['PRELIMINARY','先期处理','09:25:00','已采取现场提醒和临时隔离措施，等待进一步核查处理。','已落实临时防护措施，后续处理待反馈。']
   ].map(([suffix,processingStatus,time,description,measures])=>{
    const id='CASE-HANDLING-DEMO-'+suffix;
    if(processingStatus!=='未处理'&&!disposals.value[id]?.localCompleted)disposals.value[id]={status:processingStatus,person:'华南单位处理人员',description,measures,time:today+' 10:00:00',evidence:processingStatus==='先期处理'?[{id:'preliminary-photo',name:'先期处理现场照片',url:'sample-normal-scene.jpg'}]:[]};
    const preliminaryUpdates=processingStatus==='完成处理'?[
     {id:id+'-update-1',time:today+' 09:50:00',person:'华南单位处理人员',description:'已到场核查，提醒相关人员停止违规行为。',measures:'设置临时隔离和现场警示。',evidence:[{id:'completed-preliminary-1',name:'首次先期处理照片',url:'sample-normal-scene.jpg'}]},
     {id:id+'-update-2',time:today+' 09:55:00',person:'华南单位处理人员',description:'再次核查现场，已落实人员安全教育，继续跟进整改。',measures:'补充现场防护措施，等待最终复查。',evidence:[{id:'completed-preliminary-2',name:'第二次先期处理照片',url:'sample-normal-scene.jpg'}]}
    ]:[];
    return {...base,id,eventJudgment:{UNHANDLED:'违规或异常',COMPLETED:'穿戴不规范','NOT-REQUIRED':'算法误报',PRELIMINARY:'画面异常'}[suffix],preliminaryUpdates,processingStatus,time:today+' '+time,reviewTime:today+' 09:45:00',status:'已复核',result:'确认违规',reviewer:'张安全',remark:'处理状态展示示例',responsiblePeople:undefined,assignees:undefined,teamMembers:undefined};
   });
   return [...examples,...list.filter(r=>!String(r.id).startsWith('CASE-HANDLING-DEMO-'))];
  };
  const load=()=>{if(window.StatsDrill){records.value=window.ALARM_DEMO_RECORDS.filter(window.CaseManagementRules.eligible).sort((a,b)=>b.time.localeCompare(a.time));return;}let extra=[];try{extra=JSON.parse(localStorage.getItem('global-alarm-center-v1'))?.extra||[];}catch{} const map=new Map((window.ALARM_DEMO_RECORDS||[]).map(r=>[r.id,r]));extra.forEach(r=>map.set(r.id,r));records.value=handlingExamples([...map.values()].filter(window.CaseManagementRules.eligible).sort((a,b)=>b.time.localeCompare(a.time)));};
  load();
  const demoAssignees=[{name:'张安全'},{name:'李强'},{name:'王敏'},{name:'王值守'},{name:'张三'}];
  const addAssigneeDemo=()=>{records.value.filter(r=>String(r.id).startsWith('OFFICE-DEMO-')&&String(r.id).endsWith('-02')).forEach(r=>{if(!r.responsiblePeople&&!r.assignees&&!r.teamMembers)r.responsiblePeople=demoAssignees;});};
  if(!window.StatsDrill)addAssigneeDemo();
  if(!window.StatsDrill){
  // Retain a completed example without changing the source alarm or review result.
  const example=records.value.find(r=>r.id==='BJ2024051800003');
  if(example){
   if(!disposals.value[example.id])disposals.value[example.id]={violator:'刘刚',person:'张安全',description:'现场核查人员入侵报警，联系责任人到场，对违规人员开展安全教育。',measures:'人员已撤离限制区域，重新确认通行边界并完成现场警示。',time:'2024-05-18 11:15:00',evidence:[{id:'demo-evidence',name:'现场处理照片',url:'sample-normal-scene.jpg'}]};
   if(!receipts.value[example.id])receipts.value[example.id]={person:'张安全',time:'2024-05-18 10:40:00'};
   // Complete older built-in demo data without replacing user-entered disposal results.
   const demo=disposals.value[example.id];
   if(demo.time==='2024-05-18 11:15:00'&&!demo.description){demo.description=demo.note||'已完成现场核查及安全教育。';demo.measures='人员已撤离限制区域，完成现场整改。';if(!demo.evidence?.length)demo.evidence=[{id:'demo-evidence',name:'现场处理照片',url:'sample-normal-scene.jpg'}];}
  }
  // One accepted but unfinished case to demonstrate the middle workflow state.
  const acceptedSource=records.value.find(r=>r.id.includes('D0006'))||records.value.find(r=>!isFire(r));
  if(acceptedSource){
   const id='CASE-DEMO-ACCEPTED';
   const reviewDate=new Date(acceptedSource.reviewTime.replace(' ','T'));
   reviewDate.setMinutes(reviewDate.getMinutes()+2);
   const stamp=reviewDate.getFullYear()+'-'+String(reviewDate.getMonth()+1).padStart(2,'0')+'-'+String(reviewDate.getDate()).padStart(2,'0')+' '+reviewDate.toTimeString().slice(0,8);
   records.value.push({...acceptedSource,id,responsiblePeople:[{name:'李强'},{name:'王敏'},{name:'王值守'}]});
   if(!receipts.value[id]){const received=new Date(Date.now()-42*60*1000);receipts.value[id]={person:'李强',time:received.getFullYear()+'-'+String(received.getMonth()+1).padStart(2,'0')+'-'+String(received.getDate()).padStart(2,'0')+' '+received.toTimeString().slice(0,8)};}
  }
  const demoStamp=(time,minutes)=>{const date=new Date(time.replace(' ','T'));date.setMinutes(date.getMinutes()+minutes);return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')+' '+date.toTimeString().slice(0,8);};
  records.value.filter(r=>!isFire(r)).forEach(r=>{
   if(calls.value[r.id])return;
   if(r.id==='BJ2024051800003')calls.value[r.id]=[
    {id:'demo-call-receipt',stage:'催接收',person:'王值守',contact:'张安全',time:'2024-05-18 10:37:00',content:'已线下电话联系张安全，提醒接收该条报警处理任务。',result:'已联系，对方确认立即接收'},
    {id:'demo-call-complete',stage:'催处理',person:'王值守',contact:'张安全',time:'2024-05-18 10:55:00',content:'已线下电话了解现场处理进度，提醒落实人员撤离和安全教育后提交处理结果。',result:'已联系，对方反馈正在现场处理'}
   ];
   else if(r.id==='CASE-DEMO-ACCEPTED')calls.value[r.id]=[];
   else if(!receipts.value[r.id]&&!disposals.value[r.id])calls.value[r.id]=[{id:'demo-call-wait',stage:'催接收',person:'王值守',contact:r.owner,time:demoStamp(r.reviewTime,1),content:'电话通知责任人接收报警处理任务。',result:'已联系，待接收任务'}];
  });
  // Reset the first demonstration once; retain subsequently recorded interventions.
  try{if(!localStorage.getItem('case-first-call-demo-reset-v1')){calls.value['CASE-DEMO-ACCEPTED']=[];localStorage.setItem(callKey,JSON.stringify(calls.value));localStorage.setItem('case-first-call-demo-reset-v1','1');}}catch{calls.value['CASE-DEMO-ACCEPTED']=[];}
  }
  const isStatsDemo=!!window.StatsDrill?.demo;
  if(window.StatsDrill){const q=window.StatsDrill;range.value=q.range;type.value=q.filters.type||null;area.value=AreaCascade.selection(q.filters.area);level.value=q.filters.level||null;keyword.value=q.filters.keyword||q.filters.violator||'';disposalOverdueFilter.value=q.filters.disposalOverdue||null;status.value=q.filters.caseStatus||null;expanded.value=true;}
  if(source.value==='ai'&&status.value==='未处理')status.value=null;
  const options=field=>[...new Set(records.value.filter(r=>!source.value||(isFire(r)?'fire':'ai')===source.value).map(r=>field==='type'&&isFire(r)?S.fireName(r):r[field]).filter(Boolean))].map(v=>({label:v,value:v}));
  const typeOptions=computed(()=>options('type')),areaOptions=computed(()=>AreaCascade.options(records.value.map(areaPath)));
  const fireAreaOptions=computed(()=>areaOptions.value.map(({children,...building})=>({...building,...(children?.length?{children:children.map(({children,...floor})=>floor)}:{})}))); 
  const levelOptions=['一级','二级','三级','四级'].map(v=>({label:v,value:v}));
  const handlingStates=['未处理','完成处理','无需处理','先期处理'];
  const handlingStatus=r=>{if(!r)return '未处理';if(isFire(r))return S.fireStatus(r);const raw=(disposals.value[r.id]?.localCompleted?disposals.value[r.id].status:null)||r.processingStatus||r.handleStatus||r.caseStatus||r.disposal?.status||disposals.value[r.id]?.status||r.alarmStatus||r.fireStatus;const aliases={'待接收':'未处理','待处置':'未处理','待处理':'未处理','已处置':'完成处理','已处理':'完成处理'};if(handlingStates.includes(raw))return raw;if(aliases[raw])return aliases[raw];return isFire(r)?(S.fireStatus(r)==='已处置'?'完成处理':'未处理'):disposals.value[r.id]?'完成处理':'未处理';};
  const handlingClosed=r=>['完成处理','无需处理','已处置'].includes(handlingStatus(r));
  const statusOptions=computed(()=>(source.value==='fire'?['～','待处置','处置中','已处置']:handlingStates.filter(v=>v!=='未处理')).map(v=>({label:v,value:v})));
  const fireDone=r=>handlingClosed(r);
  const rows=computed(()=>records.value.map(r=>isFire(r)?({...r,kind:'fire',time:F.alarmTime(r),type:S.fireName(r),level:r.level,confidence:null,reviewer:null,reviewTime:null,overdue:'—',receipt:null,disposal:null,disposalOverdue:'—',caseStatus:F.category(r)==='离线'?'～':handlingStatus(r)}):({...r,level:window.StatsDrill?r.level:window.AlarmEventLevels?.level(r.type,r.level,r)||r.level,disposal:disposals.value[r.id],receipt:receipts.value[r.id],disposalOverdue:disposalOverdue(r),...(clockNow.value&&window.AlarmBasicSettings?window.AlarmBasicSettings.review(r):{}),caseStatus:handlingStatus(r)})).filter(r=>(isFire(r)||['完成处理','无需处理','先期处理'].includes(r.caseStatus))&&(!source.value||(isFire(r)?'fire':'ai')===source.value)&&(!isFire(r)||(F.category(r)===fireCategory.value&&Object.entries(fireFilters.value).every(([key,selected])=>{if(selected===null||selected===undefined||selected===''||Array.isArray(selected)&&!selected.length)return true;const value=fireCell(r,key);if(key==='deviceType')return F.matchesDevice(r,selected,fireCell(r,'systemType'));if(key==='offlineDuration')return F.matchesDuration(r,selected);if(key==='area')return AreaCascade.matches(selected,value);if(Array.isArray(selected)){const t=new Date(String(value).replace(' ','T')).getTime();return t>=selected[0]&&t<=selected[1];}return String(value).includes(String(selected));})))&&(!keyword.value||[r.id,r.device,areaPath(r),r.owner,r.reviewer,processor(r),r.disposal?.person||r.receipt?.person,r.disposal?.violator||r.violator||'未登记违规人员'].some(v=>String(v||'').includes(keyword.value.trim())))&&(!type.value||r.type===type.value)&&(!level.value||r.level===level.value)&&(!status.value||(status.value==='未闭环'?!handlingClosed(r):r.caseStatus===status.value))&&AreaCascade.matches(area.value,areaPath(r))&&(!disposalOverdueFilter.value||!isFire(r)&&(r.disposalOverdue!=='否')===(disposalOverdueFilter.value==='是'))&&(!range.value||(new Date(r.time.replace(' ','T')).getTime()>=range.value[0]&&new Date(r.time.replace(' ','T')).getTime()<=range.value[1]))));
  const visible=computed(()=>rows.value.slice((page.value-1)*pageSize.value,page.value*pageSize.value));
  const stats=computed(()=>{const list=rows.value,done=list.filter(r=>handlingClosed(r));if(source.value==='fire')return [{label:'查处总数',value:list.length,unit:'条',color:'#0879ff'},{label:'待处置',value:list.filter(r=>r.caseStatus==='待处置').length,unit:'条',color:'#d98600'},{label:'处置中',value:list.filter(r=>r.caseStatus==='处置中').length,unit:'条',color:'#0879ff'},{label:'已处置',value:done.length,unit:'条',color:'#12a36a'},{label:'处置完成率',value:list.length?(done.length/list.length*100).toFixed(1):'—',unit:'%',color:'#12a36a'}];return [{label:'查处总数',value:list.length,unit:'条',color:'#0879ff'},{label:'完成处理',value:list.filter(r=>r.caseStatus==='完成处理').length,unit:'条',color:'#12a36a'},{label:'无需处理',value:list.filter(r=>r.caseStatus==='无需处理').length,unit:'条',color:'#8190a5'},{label:'先期处理',value:list.filter(r=>r.caseStatus==='先期处理').length,unit:'条',color:'#0879ff'},{label:'一级报警',value:list.filter(r=>r.level==='一级').length,unit:'条',color:'#ef2f4f'},{label:'未处理',value:list.filter(r=>r.caseStatus==='未处理').length,unit:'条',color:'#0879ff'},{label:'处理完成率',value:list.length?(done.length/list.length*100).toFixed(1):'—',unit:'%',color:'#12a36a'}].filter(item=>source.value==='ai'?item.label!=='未处理':source.value!=='fire'||['查处总数','完成处理','未处理','无需处理','先期处理','处理完成率'].includes(item.label));});
  watch([source,keyword,type,level,status,area,disposalOverdueFilter,range,pageSize],()=>page.value=1);
  watch(source,()=>{type.value=level.value=status.value=disposalOverdueFilter.value=null;});
  const reset=()=>{keyword.value='';type.value=level.value=status.value=area.value=disposalOverdueFilter.value=range.value=null;page.value=1;};
  const pill=(value)=>{const tones={'处置中':['#0879ff','#eef6ff'],'～':['#8190a5','#fafbfd'],'待处置':['#d98600','#fff3d9'],'已处置':['#12a36a','#e8fbf4'],'一级':['#ef2f4f','#fff4f5'],'二级':['#d98600','#fff3d9'],'三级':['#d98600','#fff3d9'],'四级':['#0879ff','#eef6ff'],'待接收':['#0879ff','#eef6ff'],'未处理':['#d98600','#fff3d9'],'完成处理':['#12a36a','#e8fbf4'],'无需处理':['#8190a5','#fafbfd'],'先期处理':['#0879ff','#eef6ff']};const [color,background]=tones[value]||['#0879ff','#eef6ff'];return {color,background};};
  const canProcess=r=>!!r&&!isFire(r)&&!isStatsDemo&&!handlingClosed(r);
  const canAccept=r=>canProcess(r)&&!receipts.value[r.id]&&!disposals.value[r.id];
  const open=(r,next)=>{if(next==='process'&&!canProcess(r))return;next=next==='process'?'process':'detail';detailTab.value='details';firePrivate.value=false;active.value=r;mode.value=next;drawer.value=true;error.value='';videoUnavailable.value=false;form.value={violator:null,violatorType:'internal',externalName:'',externalPhone:'',description:'',measures:'',person:receipts.value[r.id]?.person||'张安全',evidence:[]};};
  const info=computed(()=>active.value?[['报警ID',active.value.id],['违规事件类型',active.value.type],['报警时间',active.value.time],['设备名称',active.value.device],['设备位置',active.value.deviceLocation||active.value.installationPosition||active.value.location||areaPath(active.value)],['置信度',active.value.confidence],['报警等级',active.value.level],['责任区域',areaPath(active.value)],['处理人（责任人）',active.value.owner]]:[]);
  const fireDetail=computed(()=>{
   const r=active.value;if(!r||!isFire(r))return {};
   const device=window.ResponsibilityData?.devices.find(d=>d.id===r.deviceId)||{};
   const result=r.fireDisposal||disposals.value[r.id]||{};
   return {first:r.firstReceivedAt||r.time,last:r.lastReceivedAt||r.time,
    building:r.buildingName||areaPath(r).split(' / ')[0],imei:r.imei||device.imei||'—',
    system:r.systemType||device.systemType||'—',deviceType:r.deviceType||device.deviceType||'—',
    model:r.brandModel||device.brandModel||'—',installed:r.installedAt||device.installedAt||'—',
    result:result.verificationResult||r.verificationResult||'—',description:result.description||result.note||'—',
    person:result.person||'—',phone:result.phone||r.disposalPhone||'—',completed:result.time||r.statusUpdatedAt||r.updatedAt||'—',photos:result.evidence||[]};
  });
  const fireInterventions=computed(()=>(calls.value[active.value?.id]||[]).slice().sort((a,b)=>(b.time||'').localeCompare(a.time||'')));
  const firePrivate=ref(false);
  const review=computed(()=>active.value?[['复核结果',active.value.result],['事件判定',active.value.eventJudgment||'—'],['违规事件类型',active.value.type],['报警等级',active.value.level],['备注说明',active.value.remark||'—'],['复核人',active.value.reviewer],['复核时间',active.value.reviewTime]]:[]);
  // Dedicated person-linked history fixtures; never add them to the alarm ledger.
  const historyDemo = [];
  [['未佩戴安全帽',8],['违规吸烟',5],['人员入侵',4],['行人未走人行通道',3],['仓库人员未穿反光衣',2],['翻越围栏',2],['未佩戴护目镜',1],['未佩戴安全带',1]].forEach(([type,count],group)=>{
   for(let index=0;index<count;index++){
    const date=new Date();date.setDate(date.getDate()-1-group*4-index);date.setHours(9+index%7,10+group,0,0);
    const time=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')+' '+date.toTimeString().slice(0,8);
    historyDemo.push({id:'PERSON-HISTORY-'+group+'-'+index,violator:'刘刚',type,time,area:['仓库作业区','装卸作业区','货架通道'][group%3],status:'已复核',result:'确认违规'});
   }
  });
  const demoPeople=[...new Set((window.ALARM_DEMO_RECORDS||[]).map(r=>r.owner).filter(Boolean))].map((name,index)=>({name,phone:'1380000'+String(1001+index).padStart(4,'0')}));
  demoPeople.push({name:'刘刚',phone:'13800002001'});
  const personKey=value=>{
   const text=String(value||'').trim(),match=text.match(/^(.+?)[（(]([^）)]+)[）)]$/);
   const name=match?match[1].trim():text,phone=match?match[2].trim():'';
   const people=window.ResponsibilityData?.people||[],matches=people.filter(p=>p.name===name);
   const legacy=demoPeople.some(p=>p.name===name&&p.phone===phone);
   const person=matches.find(p=>p.phone===phone)||((!phone||legacy)&&matches.length===1?matches[0]:null);
   if(person)return person.id;
   const demo=demoPeople.find(p=>p.name===name&&(!phone||p.phone===phone));
   return demo?demo.name+'（'+demo.phone+'）':text;
  };
  const processorPeople=r=>{
   if(isFire(r))return [];
   // Completion identifies the actual operator; pending cases retain all assignees.
   if(r.disposal)return r.disposal.person?[{name:r.disposal.person,phone:r.disposal.phone}]:[];
   const assigned=r.responsiblePeople||r.assignees||r.teamMembers;
   if(Array.isArray(assigned)&&assigned.length)return assigned;
   if(r.teamId||r.teamName){const members=(window.ResponsibilityData?.people||[]).filter(p=>r.teamId?p.teamId===r.teamId:p.team===r.teamName);if(members.length)return members;}
   const name=r.assignee||r.receipt?.person||r.owner;
   return Array.isArray(name)?name:name?[{name,phone:r.assigneePhone||r.receipt?.phone}]:[];
  };
  const processorIdentity=person=>{
   const item=typeof person==='string'?{name:person}:person;
   const name=item.name||item.person||'',match=name.match(/^(.+?)[（(]([^）)]+)[）)]$/);
   const plain=match?match[1]:name;
   const known=(window.ResponsibilityData?.people||[]).find(p=>item.id?p.id===item.id:p.name===plain)||demoPeople.find(p=>p.name===plain);
   return {name:plain,phone:item.phone||item.mobile||match?.[2]||known?.phone||'—'};
  };
  const processor=r=>[...new Set(processorPeople(r).map(p=>{const item=processorIdentity(p);return item.name?item.name+'（'+item.phone+'）':'';}).filter(Boolean))].join('、')||'—';
  const processorPhone=r=>processorPeople(r).map(p=>processorIdentity(p).phone).join('、')||'—';
  const availablePeople=r=>[...new Map(processorPeople(r).map(p=>{const item=processorIdentity(p);return [item.name+'|'+item.phone,item];})).values()].filter(p=>p.name);
  const responsibleShow=ref(false),responsibleTarget=ref(null);
  const responsibleList=computed(()=>responsibleTarget.value?availablePeople(rows.value.find(r=>r.id===responsibleTarget.value.id)||responsibleTarget.value):[]);
  const showResponsible=r=>{responsibleTarget.value=r;responsibleShow.value=true;};

  const changeViolatorType=type=>{form.value.violatorType=type;form.value.violator=null;form.value.externalName='';form.value.externalPhone='';error.value='';};
  watch(()=>[form.value.externalName,form.value.externalPhone],()=>{if(form.value.violatorType==='external'){const name=form.value.externalName.trim(),phone=form.value.externalPhone.trim();form.value.violator=name&&/^1[3-9]\d{9}$/.test(phone)?name+'（'+phone+'）':null;}});
  const personPickerShow=ref(false),personDraft=ref(null),personSearch=ref(''),orgSearch=ref(''),personOrg=ref('company'),personPage=ref(1);
  const pickerPeople=computed(()=>{
   const d=window.ResponsibilityData;
   const list=(d?.people||[]).map(p=>({...p,value:p.name+'（'+p.phone+'）',department:d.departments.find(x=>x.id===p.departmentId)?.name||'—',team:p.team||'—',account:p.account||'未录入'}));
   demoPeople.forEach(p=>{if(!list.some(x=>x.name===p.name))list.push({...p,id:'extra-'+p.name,value:p.name+'（'+p.phone+'）',departmentId:'safety',department:'安全环保部',post:'现场处理',team:'—',account:'未录入'});});
   return list;
  });
  const pickerOrgs=computed(()=>{
   const d=window.ResponsibilityData,items=d?.departments||[];
   const build=parent=>items.filter(x=>x.parentId===parent).map(x=>({key:x.id,label:x.name,children:build(x.id)}));
   return items.filter(x=>!x.parentId).map(x=>({key:x.id,label:x.name,children:build(x.id)}));
  });
  const pickerRows=computed(()=>{
   const ids=new Set([personOrg.value]);
   const add=id=>(window.ResponsibilityData?.departments||[]).filter(x=>x.parentId===id).forEach(x=>{ids.add(x.id);add(x.id);});add(personOrg.value);
   return pickerPeople.value.filter(p=>(!personOrg.value||ids.has(p.departmentId))&&p.name.includes(personSearch.value.trim()));
  });
  const pickerVisible=computed(()=>pickerRows.value.slice((personPage.value-1)*10,personPage.value*10));
  const pickedPerson=computed(()=>pickerPeople.value.find(p=>p.value===personDraft.value));
  const openPersonPicker=()=>{personDraft.value=form.value.violator;personSearch.value='';orgSearch.value='';personOrg.value='company';personPage.value=1;personPickerShow.value=true;};
  const confirmPerson=()=>{if(!personDraft.value)return;form.value.violator=personDraft.value;personPickerShow.value=false;};
  watch([personOrg,personSearch],()=>personPage.value=1);
  const personnelOptions=computed(()=>demoPeople.map(person=>({label:person.name+'（'+person.phone+'）',value:person.name+'（'+person.phone+'）'})));
  const history=computed(()=>{
   if(!form.value.violator)return {count:0,distribution:[],maxCount:1,latest:'—',latestType:'',records:[]};
   const list=[...records.value,...historyDemo].filter(r=>r.id!==active.value?.id && (form.value.violatorType==='external'?(disposals.value[r.id]?.violatorType==='external'&&disposals.value[r.id]?.violator===form.value.violator):(disposals.value[r.id]?.violatorType!=='external'&&personKey(disposals.value[r.id]?.violator || r.violator)===personKey(form.value.violator)))).sort((a,b)=>b.time.localeCompare(a.time));
   const counts={};list.forEach(r=>counts[r.type]=(counts[r.type]||0)+1);
   const distribution=Object.entries(counts).map(([type,count])=>({type,count})).sort((a,b)=>b.count-a.count||a.type.localeCompare(b.type,'zh-CN'));
   return {count:list.length,distribution,maxCount:Math.max(1,...distribution.map(item=>item.count)),latest:list[0]?.time||'—',latestType:list[0]?.type||'',records:list};
  });
  const disposal=computed(()=>{const d=active.value?.disposal;if(!d||!handlingClosed(active.value))return [];return [['违规人员',d.violator||active.value.owner||'—'],['处理经过描述',d.description||d.note||'—'],['整改措施',d.measures||'—'],['处理人（责任人）',d.person],['处理时间',d.time],['处理周期',duration(active.value.time,d.time)],['处理超期',disposalOverdue(active.value)]];});
  const format=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+d.toTimeString().slice(0,8);
  const duration=(start,end)=>{
   if(!start||!end)return '—';
   const seconds=Math.floor((new Date(end.replace(' ','T'))-new Date(start.replace(' ','T')))/1000);
   if(!Number.isFinite(seconds)||seconds<0)return '—';
   if(seconds<60)return seconds+'秒';
   const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60);
   return (days?days+'天':'')+(hours?hours+'小时':'')+minutes+'分钟'+(seconds%60?seconds%60+'秒':'');
  };
  const accept=r=>{
   if(!canAccept(r))return;
   if(!window.confirm('确认接收该报警的处理任务？'))return;
   const next={...receipts.value,[r.id]:{person:'张安全',time:format(new Date())}};
   try{localStorage.setItem(receiptKey,JSON.stringify(next));}catch{notice.value='接收保存失败，请重试';return;}
   receipts.value=next;
   if(active.value?.id===r.id)active.value={...r,receipt:next[r.id],caseStatus:'未处理'};
   notice.value='已接收，可继续处置';
  };
  const stageCalls=r=>(calls.value[r.id]||[]).filter(call=>isFire(r)?call.stage==='消防电话介入':String(call.stage||'').replace('处'+'置','处理')===(receipts.value[r.id]?'催处理':'催接收')).slice().sort((a,b)=>b.time.localeCompare(a.time));
  const openCall=r=>{
   if(currentRole.value!=='值守人员'||handlingClosed(r))return;
   callTarget.value=r;callView.value=stageCalls(r).length>0;callForm.value={contact:receipts.value[r.id]?.person||r.owner,content:'',result:'已联系'};callError.value='';callShow.value=true;
  };
  const saveCall=()=>{
   const r=callTarget.value;
   if(currentRole.value!=='值守人员'){callError.value='仅值守人员可记录电话介入';return;}
   const latest=records.value.find(x=>x.id===r?.id)||r;
   if(!r||handlingClosed(latest)){callError.value='该记录已处理，不能继续催促';return;}
   if(!callForm.value.contact.trim()||!callForm.value.content.trim()||!callForm.value.result.trim()){callError.value='请填写联系对象、催促内容和联系结果';return;}
   const entry={...callForm.value,id:'call-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),stage:isFire(r)?'消防电话介入':receipts.value[r.id]?'催处理':'催接收',person:'张安全',time:format(new Date())};
   const next={...calls.value,[r.id]:[...(calls.value[r.id]||[]),entry]};
   try{localStorage.setItem(callKey,JSON.stringify(next));}catch{callError.value='记录保存失败，请重试';return;}
   calls.value=next;callShow.value=false;notice.value='电话介入记录已保存';
  };
  const timeline=computed(()=>{
   const r=active.value;if(!r)return [];
   const received=receipts.value[r.id],done=disposals.value[r.id];
   const nodes = [
    {title:'AI触发报警',time:r.time,fields:[['报警ID',r.id],['违规事件类型',r.type],['报警等级',r.level],['设备名称',r.device],['责任区域',areaPath(r)]],photos:[{url:r.photo,name:'报警现场照片'}]},
    {title:'人工复核完成',time:r.reviewTime,fields:[['复核人',r.reviewer],['复核结果',r.result],['备注说明',r.remark||'经人工核实，确认现场存在违规行为。'],['复核耗时',duration(r.time,r.reviewTime)]]},
    {title:r.caseStatus==='完成处理'?'处理完成':r.caseStatus,time:done?.time,fields:done?[['违规人员',done.violator||r.owner],['处理经过描述',done.description||done.note||'—'],['整改措施',done.measures||'—'],['处理人（责任人）',done.person],['处理完成时间',done.time],['处理周期',duration(r.time,done.time)]].filter(([label])=>r.caseStatus!=='先期处理'||!['处理完成时间','处理周期'].includes(label)):[['状态',r.caseStatus]],photos:done?.evidence||[]}
   ];
   const updates=Array.isArray(r.preliminaryUpdates)?r.preliminaryUpdates:Array.isArray(done?.preliminaryUpdates)?done.preliminaryUpdates:[];
   const preliminaryNodes=updates.map((update,index)=>({
    id:update.id||r.id+'-preliminary-'+index,title:'先期处理',time:update.time,
    fields:[['处理经过描述',update.description||update.note||'—'],['整改措施',update.measures||'—'],['处理人（责任人）',update.person||'—']],
    photos:update.evidence||[]
   }));
   const interventions=(calls.value[r.id]||[]).map(call=>({id:call.id,title:'电话介入 · '+String(call.stage||'').replace('处'+'置','处理'),time:call.time,fields:[['介入阶段',String(call.stage||'').replace('处'+'置','处理')],['值守人员',call.person],['联系对象',call.contact],['催促内容',call.content],['联系结果',call.result]]}));
   return [...nodes,...preliminaryNodes,...interventions].sort((a,b)=>(a.time||'9999').localeCompare(b.time||'9999'));
  });
  const submit=()=>{if(isFire(active.value)){error.value='消防报警状态由外部同步，不支持本平台处理';return;}if(!canProcess(active.value)){error.value='该记录已处理，请勿重复提交';return;}error.value=window.CaseManagementRules.validate(form.value);if(error.value)return;if(!window.confirm('确认提交本次处理结果？'))return;const next={...disposals.value,[active.value.id]:{...form.value,status:'完成处理',localCompleted:true,time:format(new Date())}};try{localStorage.setItem(key,JSON.stringify(next));}catch{error.value='保存失败，请检查浏览器存储空间后重试。';return;}disposals.value=next;drawer.value=false;notice.value='处理结果已保存';setTimeout(()=>notice.value='',4000);};
  const upload=async({file,onFinish,onError})=>{if(!file.file||!file.file.type.startsWith('image/')||file.file.size>2*1024*1024){error.value='请选择不超过2MB的图片';onError();return;}const reader=new FileReader();reader.onload=()=>{form.value.evidence.push({id:file.id,name:file.name,url:reader.result});onFinish();};reader.onerror=onError;reader.readAsDataURL(file.file);};
  const remove=({file})=>{form.value.evidence=form.value.evidence.filter(item=>item.id!==file.id);return true;};
  const fireCell=(r,key)=>F.value(r,key,areaPath(r),window.CaseEventDetailModel.build(r,{area:areaPath(r)}));
  const fireFilterFields=computed(()=>F.filters[fireCategory.value]);
  const fireFilterOptions=key=>[...new Set([...(F.options(fireCategory.value,key)||[]),...records.value.filter(r=>isFire(r)&&F.category(r)===fireCategory.value).map(r=>fireCell(r,key)).filter(v=>v!=='～')])].map(value=>({label:String(value),value}));
  watch(fireCategory,()=>{fireFilters.value={};type.value=level.value=status.value=null;range.value=null;area.value=[];page.value=1;});
  const columns=computed(()=>source.value==='fire'?F.columns[fireCategory.value]:[
 ['source','报警来源'],['caseStatus',source.value==='fire'?'处置状态':'处理状态'],['processor','处理人（责任人）',true],['disposalOverdue','处理超期',true],['id','报警ID'],['type','报警名称'],['eventJudgment','事件判定'],['time','报警时间'],['device','设备名称'],['confidence','置信度',true],['level','报警等级',true],['area','责任区域'],['photo','报警照片',true],['reviewer','复核人',true],['reviewTime','复核时间',true],['violator','违规人员',true],['completed','处理时间',true],['duration','处理周期',true]
 ].filter(c=>source.value!=='fire'||!c[2]));
 const cell=(r,k)=>{if(isFire(r))return fireCell(r,k);if(isFire(r)){const model=window.CaseEventDetailModel.build(r,{area:areaPath(r)});if(k==='systemType')return model.device.find(p=>p[0]==='系统类型')?.[1]||'—';if(k==='imei')return r.imei||'—';if(k==='deviceCurrentStatus')return r.deviceCurrentStatus||r.currentDeviceStatus||'—';if(k==='offlineDuration')return r.offlineDuration||'—';}if(k==='disposalOverdue'&&r.disposalOverdue==='否')return '--';if(k==='area')return areaPath(r);if(k==='source')return isFire(r)?'消防设备':'AI识别';if(isFire(r)&&columns.value.find(c=>c[0]===k)?.[2])return '—';return ({processor:processor(r),phone:processorPhone(r),violator:r.disposal?.violator,received:r.receipt?.time,completed:r.disposal?.time,duration:duration(r.time,r.disposal?.time),description:r.disposal?.description||r.disposal?.note,measures:r.disposal?.measures})[k]||r[k]||'—';};
 const exportRows=()=>{const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';const exportColumns=[...columns.value,...(source.value==='fire'?[]:[['description','处理经过描述',true],['measures','整改措施',true]])];const lines=[exportColumns.map(c=>c[1]),...rows.value.map(r=>exportColumns.map(c=>isFire(r)&&c[2]?'—':cell(r,c[0])))];const url=URL.createObjectURL(new Blob(['\ufeff'+lines.map(line=>line.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='查处管理.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 watch(rows,()=>{if(active.value){const latest=rows.value.find(r=>r.id===active.value.id);if(latest)active.value=latest;}});
 const focusRefresh=()=>{receipts.value=readReceipts();disposals.value=read();calls.value=readCalls();load();if(!window.StatsDrill)addAssigneeDemo();};
 onMounted(()=>window.addEventListener('focus',focusRefresh));onBeforeUnmount(()=>window.removeEventListener('focus',focusRefresh));
  const storage=event=>{if(event.key===callKey)calls.value=readCalls();if(event.key===key)disposals.value=read();if(event.key===receiptKey)receipts.value=readReceipts();if(event.key==='global-alarm-center-v1')load();};onMounted(()=>{const mapParams=new URLSearchParams(location.search);if(mapParams.get('fromMap')==='1'){const target=records.value.find(r=>r.id===mapParams.get('alarmId'));if(target){keyword.value=target.id;open(target,mapParams.get('mapAction')==='process'&&receipts.value[target.id]&&!disposals.value[target.id]?'process':'detail');}else{notice.value='该报警已更新或不存在，请返回监测一张图重新选择';}}window.addEventListener('storage',storage);overdueTimer=setInterval(()=>clockNow.value=Date.now(),1000);});onBeforeUnmount(()=>{window.removeEventListener('storage',storage);clearInterval(overdueTimer);});
  return {F,fireCategory,fireFilters,fireFilterFields,fireFilterOptions,CaseEventDetailModel:window.CaseEventDetailModel,canAccept,canProcess,handlingStatus,handlingClosed,availablePeople,responsibleShow,responsibleList,showResponsible,changeViolatorType,personPickerShow,personDraft,personSearch,orgSearch,personOrg,personPage,pickerOrgs,pickerRows,pickerVisible,pickedPerson,openPersonPicker,confirmPerson,fireInterventions,fireDetail,firePrivate,areaPath,source,isFire,columns,cell,disposalOverdueFilter,isStatsDemo,processor,processorPhone,stageCalls,callView,disposalOverdue,calls,currentRole,callShow,callTarget,callError,callForm,openCall,saveCall,receipts,detailTab,timeline,accept,duration,theme,expanded,keyword,type,level,status,area,range,page,pageSize,drawer,mode,active,error,notice,preview,videoUnavailable,form,personnelOptions,history,typeOptions,areaOptions,fireAreaOptions,levelOptions,statusOptions,visible,rows,stats,reset,pill,open,info,review,disposal,submit,upload,remove,exportRows,zhCN:naive.zhCN,dateZhCN:naive.dateZhCN};
 },template:`
 <n-config-provider :theme-overrides="theme" :locale="zhCN" :date-locale="dateZhCN"><div class="case-stack">
 <n-alert v-if="notice" type="success" :show-icon="true">{{notice}}</n-alert>
 <div class="case-source-tabs" role="tablist" aria-label="查处报警来源"><button type="button" role="tab" :aria-selected="source==='ai'" :class="{active:source==='ai'}" @click="source='ai'">AI视频</button><button type="button" role="tab" :aria-selected="source==='fire'" :class="{active:source==='fire'}" @click="source='fire'">消防设备</button></div>
 <div v-if="source!=='fire'" class="case-surface case-filters" :class="{'case-filters-collapsed':!expanded,'case-filters--fire':source==='fire'}">
 <div><label>报警时间</label><n-date-picker v-model:value="range" type="datetimerange" clearable to="body" start-placeholder="开始时间" end-placeholder="结束时间" format="yyyy-MM-dd HH:mm" /></div>
 <div><label>报警名称</label><n-select v-model:value="type" :options="typeOptions" clearable placeholder="全部" to="body" consistent-menu-width /></div>
 <div v-if="source!=='fire'"><label>报警等级</label><n-select v-model:value="level" :options="levelOptions" clearable placeholder="全部" to="body" consistent-menu-width /></div>
 <div><label>{{source==='fire'?'处置状态':'处理状态'}}</label><n-select v-model:value="status" :options="statusOptions" clearable placeholder="全部" to="body" consistent-menu-width /></div>
 <template v-if="expanded"><div v-if="source!=='fire'"><label>处理是否超期</label><n-select v-model:value="disposalOverdueFilter" :options="[{label:'是',value:'是'},{label:'否',value:'否'}]" clearable placeholder="全部" to="body" consistent-menu-width /></div><div><label>责任区域</label><area-cascader v-model:value="area" :options="areaOptions" multiple cascade check-strategy="parent" clearable filterable placeholder="请选择责任区域（可多选）" to="body" /></div></template>
 <div v-show="expanded" style="grid-column:span 2"><label>关键词</label><n-input v-model:value="keyword" clearable placeholder="搜索报警ID、设备名称、责任区域、处理人（责任人）、复核人或违规人员姓名" /></div>
 <div class="case-filter-footer"><n-button @click="reset">重置</n-button><n-button text type="primary" @click="expanded=!expanded">{{expanded?'收起':'展开'}} {{expanded?'⌃':'⌄'}}</n-button></div>
 </div>
 <template v-if="source==='fire'"><div class="case-source-tabs case-fire-tabs" role="tablist" aria-label="消防事件分类"><button v-for="name in F.categories" :key="name" role="tab" :aria-selected="fireCategory===name" :class="{active:fireCategory===name}" @click="fireCategory=name">{{name}}</button></div><div class="case-surface case-fire-filters"><div v-for="field in fireFilterFields" :key="field.key"><label>{{field.label}}</label><n-date-picker v-if="field.kind==='date'" v-model:value="fireFilters[field.key]" type="datetimerange" clearable to="body" start-placeholder="开始时间" end-placeholder="结束时间" /><area-cascader v-else-if="field.kind==='area'" v-model:value="fireFilters[field.key]" :options="fireAreaOptions" multiple cascade check-strategy="parent" clearable placeholder="全部" to="body" /><n-input v-else-if="field.kind==='text'" v-model:value="fireFilters[field.key]" clearable placeholder="请输入" /><n-cascader v-else-if="field.key==='deviceType'" v-model:value="fireFilters[field.key]" :options="F.deviceOptions" check-strategy="all" clearable filterable placeholder="全部" to="body" /><n-select v-else v-model:value="fireFilters[field.key]" :options="fireFilterOptions(field.key)" clearable placeholder="全部" to="body" /></div></div></template>
 <div v-if="source!=='fire'" class="case-metrics" :class="{'case-metrics--fire':source==='fire'}"><div v-for="item in stats" :key="item.label" class="case-metric" :style="{'--metric-accent':item.color}"><span>{{item.label}}</span><strong>{{item.value}}</strong> {{item.unit}}</div></div>
 <div class="case-surface"><div class="case-table-top"><span class="case-title">查处记录</span><n-button @click="exportRows">导出</n-button></div><div class="case-table-scroll"><table class="case-table"><thead><tr><th v-for="c in columns" :key="c[0]">{{c[1]}}</th><th>操作</th></tr></thead><tbody><tr v-for="r in visible" :key="r.id"><td v-for="c in columns" :key="c[0]"><span v-if="c[0]==='caseStatus'||c[0]==='level'&&!isFire(r)" class="case-pill" :style="pill(cell(r,c[0]))">{{cell(r,c[0])}}</span><span v-else-if="c[0]==='processor'&&!r.disposal&&availablePeople(r).length>1" class="case-responsible-summary">可处理人有 {{availablePeople(r).length}} 人 <n-button text type="primary" @click="showResponsible(r)">更多</n-button></span><img v-else-if="c[0]==='photo'&&!isFire(r)&&r.photo" :src="r.photo" alt="报警照片" class="case-thumb" @click="preview=r.photo"><template v-else>{{cell(r,c[0])}}</template></td><td><n-space :size="8" :wrap="false"><n-button size="small" secondary type="primary" @click="open(r,'detail')">详情</n-button><n-button v-if="!isFire(r)&&canAccept(r)" size="small" secondary type="primary" @click="accept(r)">接收处置</n-button><n-button v-if="!isFire(r)&&canProcess(r)" size="small" secondary type="primary" data-annotation-action="process" @click="open(r,'process')">处置</n-button><n-button v-if="(isFire(r)?['待处置','处置中'].includes(r.caseStatus):!isStatsDemo&&!handlingClosed(r))&&currentRole==='值守人员'" size="small" secondary type="primary" @click="openCall(r)">{{stageCalls(r).length?'已电话介入':'电话介入'}}</n-button></n-space></td></tr></tbody></table><n-empty v-if="!rows.length" description="暂无符合条件的查处记录" style="padding:48px" /></div><div class="case-pagination"><span>共 {{rows.length}} 条</span><n-pagination v-model:page="page" v-model:page-size="pageSize" :item-count="rows.length" :page-sizes="[10,20,50]" show-size-picker /></div></div>
 </div>
 <n-drawer v-model:show="drawer" :width="active&&isFire(active)&&mode==='detail'?560:600" placement="right" :class="['case-drawer',{'case-event-drawer':mode==='detail'&&active&&isFire(active)}]"><n-drawer-content :title="mode==='detail'&&active?(isFire(active)?CaseEventDetailModel.build(active).title:'查处详情'):'报警处理'" closable :native-scrollbar="false"><case-event-detail v-if="mode==='detail'&&active&&isFire(active)" :record="active" :disposal="active.fireDisposal||active.disposal" :receipt="receipts[active.id]" :calls="stageCalls(active)" :area="areaPath(active)" /><template v-else-if="active&&isFire(active)">
 <div class="fire-detail">
 <div class="fire-detail-tabs" role="tablist" aria-label="消防报警详情"><button role="tab" :aria-selected="detailTab==='details'" :class="{active:detailTab==='details'}" @click="detailTab='details'">预警信息</button><button role="tab" :aria-selected="detailTab==='records'" :class="{active:detailTab==='records'}" @click="detailTab='records'">处理记录</button></div>
 <div v-if="detailTab==='details'" role="tabpanel">
 <details class="fire-detail-card" open><summary>预警信息 | 处理等级：{{active.level||'—'}}</summary><div class="fire-warning"><div class="fire-warning-name">{{active.type}}</div><dl class="fire-fields"><dt>事件判定：</dt><dd>{{active.eventJudgment||'—'}}</dd><dt>首次接收时间：</dt><dd>{{fireDetail.first}}</dd><dt>末次接收时间：</dt><dd>{{fireDetail.last}}</dd></dl></div></details>
 <details class="fire-detail-card" open><summary>设备信息</summary><dl class="fire-fields"><dt>楼宇名称：</dt><dd>{{fireDetail.building}}</dd><dt>IMEI：</dt><dd>{{fireDetail.imei}}</dd><dt>系统类型：</dt><dd>{{fireDetail.system}}</dd><dt>设备类型：</dt><dd>{{fireDetail.deviceType}}</dd><dt>设备位置：</dt><dd>{{areaPath(active)}}</dd><dt>品牌型号：</dt><dd>{{fireDetail.model}}</dd><dt>安装日期：</dt><dd>{{fireDetail.installed}}</dd></dl></details>
 <details class="fire-detail-card" open><summary>催促记录</summary><n-timeline v-if="stageCalls(active).length"><n-timeline-item v-for="call in stageCalls(active)" :key="call.id" :title="call.stage" :time="call.time"><dl class="fire-fields"><dt>值守人员：</dt><dd>{{call.person}}</dd><dt>联系对象：</dt><dd>{{call.contact}}</dd><dt>联系内容：</dt><dd>{{call.content}}</dd><dt>联系结果：</dt><dd>{{call.result}}</dd></dl></n-timeline-item></n-timeline><n-empty v-else description="暂无催促记录" size="large" class="fire-empty" /></details>
 </div>
 <div v-else class="fire-records" role="tabpanel"><n-timeline>
 <n-timeline-item v-if="active.caseStatus==='已处置'" type="info" title="事件已完成处置"><dl class="fire-fields"><dt>核警结果：</dt><dd>{{fireDetail.result}}</dd><dt>处理描述：</dt><dd>{{fireDetail.description}}</dd><dt>处理人员：</dt><dd>{{firePrivate?fireDetail.person:fireDetail.person==='—'?'—':fireDetail.person.slice(0,1)+'**'}} <button v-if="fireDetail.person!=='—'" class="fire-privacy" @click="firePrivate=!firePrivate" :aria-label="firePrivate?'隐藏个人信息':'显示个人信息'">{{firePrivate?'◉':'◎'}}</button></dd><dt>联系方式：</dt><dd>{{firePrivate?fireDetail.phone:fireDetail.phone.replace(/(\\d{3})\\d{4}(\\d{4})/,'$1****$2')}} <button v-if="fireDetail.phone!=='—'" class="fire-privacy" @click="firePrivate=!firePrivate" :aria-label="firePrivate?'隐藏个人信息':'显示个人信息'">{{firePrivate?'◉':'◎'}}</button></dd><dt>处理完成时间：</dt><dd>{{fireDetail.completed}}</dd><dt>现场照片：</dt><dd><div v-if="fireDetail.photos.length" class="fire-photos"><img v-for="photo in fireDetail.photos" :key="photo.url" :src="photo.url" :alt="photo.name||'现场照片'" @click="preview=photo.url"></div><span v-else>—</span></dd></dl></n-timeline-item>
 <n-timeline-item v-for="call in fireInterventions" :key="call.id" type="success" :title="'电话介入 · '+(call.stage==='消防电话介入'?'催处理':(call.stage||'催处理').replace('处'+'置','处理'))" :time="call.time"><dl class="fire-fields fire-intervention-fields"><dt>介入阶段</dt><dd>{{call.stage==='消防电话介入'?'催处理':(call.stage||'催处理').replace('处'+'置','处理')}}</dd><dt>值守人员</dt><dd>{{call.person||'—'}}</dd><dt>联系对象</dt><dd>{{call.contact||'—'}}</dd><dt>催促内容</dt><dd>{{call.content||'—'}}</dd><dt>联系结果</dt><dd>{{call.result||'—'}}</dd></dl></n-timeline-item>
 <n-timeline-item type="info" title="预警接收"><dl class="fire-fields"><dt>预警描述：</dt><dd>{{active.type}}</dd><dt>平台首次接收时间：</dt><dd>{{fireDetail.first}}</dd></dl></n-timeline-item>
 </n-timeline></div></div></template><template v-else-if="active"><n-tabs v-if="mode==='detail'" v-model:value="detailTab" type="line" style="margin-bottom:20px"><n-tab name="details">查处详情</n-tab><n-tab name="records">处理记录</n-tab></n-tabs>
<section v-if="mode==='detail'&&detailTab==='records'"><div class="case-note" style="margin-bottom:20px"><dl class="case-kv"><dt>当前状态</dt><dd>{{active.caseStatus}}</dd><template v-if="active.caseStatus!=='先期处理'"><dt>处理周期</dt><dd>{{duration(active.time,active.disposal?.time)}}</dd></template></dl></div><n-timeline><n-timeline-item v-for="node in timeline" :key="node.id||node.title" :type="node.time?'success':'default'" :title="node.title" :time="node.time||'—'"><dl class="case-kv case-timeline-fields"><template v-for="[label,value] in node.fields" :key="label"><dt>{{label}}</dt><dd>{{value||'—'}}</dd></template></dl><div v-if="node.photos?.length" class="case-timeline-photos"><div class="case-help">{{node.title==='AI触发报警'?'报警照片':'处理照片'}}</div><div class="case-evidence"><img v-for="photo in node.photos" :key="photo.url" :src="photo.url" :alt="photo.name||'现场照片'" @click="preview=photo.url"></div></div></n-timeline-item></n-timeline></section>
<div v-show="mode!=='detail'||detailTab==='details'">

 <section v-if="mode==='detail'" class="case-section"><h3 class="case-section-title">报警基本信息</h3><dl class="case-kv"><template v-for="[label,value] in info"><dt>{{label}}</dt><dd>{{value||'—'}}</dd></template></dl></section>
 <section v-if="mode==='detail'" class="case-section"><h3 class="case-section-title">复核结果</h3><div class="case-note"><dl class="case-kv"><template v-for="[label,value] in review"><dt>{{label}}</dt><dd>{{value||'—'}}</dd></template></dl></div></section>
 <template v-if="mode==='detail'"><section class="case-section"><h3 class="case-section-title">报警照片</h3><img :src="active.photo" alt="报警照片" style="width:100%;border-radius:8px;cursor:zoom-in" @click="preview=active.photo"></section><section class="case-section"><h3 class="case-section-title">报警视频</h3><video v-if="active.video" :src="active.video" :poster="active.photo" controls style="width:100%"></video><div v-else class="case-video"><img :src="active.photo" alt="报警视频封面"><button aria-label="播放报警视频" @click="videoUnavailable=true">▶</button></div><p v-if="videoUnavailable" class="case-help">暂无可播放的报警视频</p></section>
 </template>
 <div v-else class="case-form">
 <section><h3 class="case-section-title">选择违规人员</h3><div class="case-person-inline"><n-radio-group class="case-person-type" :value="form.violatorType" @update:value="changeViolatorType"><n-space><n-radio value="internal">内部人员</n-radio><n-radio value="external">外来人员</n-radio></n-space></n-radio-group><div class="case-person-inline-fields"><template v-if="form.violatorType==='external'"><div class="case-external-fields"><div><label>人员姓名 <span class="case-required">*</span></label><n-input v-model:value="form.externalName" maxlength="30" placeholder="请输入外来人员姓名" /></div><div><label>手机号码 <span class="case-required">*</span></label><n-input v-model:value="form.externalPhone" maxlength="11" placeholder="请输入11位手机号码" /></div></div></template><template v-else><label>违规人员 <span class="case-required">*</span></label><button type="button" class="case-person-trigger" @click="openPersonPicker"><span :class="{'case-help':!form.violator}">{{form.violator||'请选择违规人员'}}</span><i class="fa fa-angle-right" aria-hidden="true"></i></button></template></div></div>
 <div v-if="form.violator" class="case-history"><div class="case-section-title" style="margin-bottom:12px">历史违规记录</div><div class="case-history-stats"><div><span>历史违规次数</span><strong>{{history.count}} 次</strong></div><div><span>最后一次违规</span><strong>{{history.latest}}<template v-if="history.latestType"><br>{{history.latestType}}</template></strong></div></div><div style="margin-top:12px;color:#8190a5">违规类型分布</div><div v-if="history.distribution.length" class="case-bar-chart" role="img" :aria-label="'违规类型分布，共'+history.distribution.length+'种类型，'+history.count+'次'">
 <div v-for="item in history.distribution" :key="item.type" class="case-bar-row" :title="item.type+'：'+item.count+'次，占'+(item.count/history.count*100).toFixed(1)+'%'">
  <span class="case-bar-label">{{item.type}}</span><div class="case-bar-track"><div class="case-bar-fill" :style="{width:(item.count/history.maxCount*100)+'%'}"></div></div><span class="case-bar-value">{{item.count}}次</span>
 </div></div><p v-else class="case-help" style="margin-top:8px">暂无历史违规记录</p></div>
 </section>
 <section><h3 class="case-section-title">处理结果</h3><div><label>处理经过描述 <span class="case-required">*</span></label><n-input v-model:value="form.description" type="textarea" maxlength="500" show-count :autosize="{minRows:4,maxRows:8}" placeholder="请描述核实、沟通、教育或处理经过" /></div><div style="margin-top:20px"><label>整改措施 <span class="case-required">*</span></label><n-input v-model:value="form.measures" type="textarea" maxlength="500" show-count :autosize="{minRows:4,maxRows:8}" placeholder="请填写已落实的整改措施" /></div></section>
 <section><h3 class="case-section-title">上传处理照片</h3><n-upload :custom-request="upload" :on-remove="remove" accept="image/*" :max="3" list-type="image-card" /><p class="case-help">最多3张图片，每张不超过2MB</p></section>
 <n-alert v-if="error" type="error">{{error}}</n-alert></div>
 </div></template><template v-if="mode==='process'||(active&&!isFire(active))" #footer><n-space><n-button @click="drawer=false">关闭</n-button><n-button v-if="mode==='detail'&&canAccept(active)" type="primary" @click="accept(active)">接收处置</n-button><n-button v-if="mode==='detail'&&canProcess(active)" type="primary" @click="open(active,'process')">去处置</n-button><n-button v-if="mode==='process'&&canProcess(active)" type="primary" @click="submit">提交处置</n-button><n-button v-if="mode==='detail'&&!handlingClosed(active)&&currentRole==='值守人员'" @click="openCall(active)">{{stageCalls(active).length?'已电话介入':'电话介入'}}</n-button></n-space></template></n-drawer-content></n-drawer>
 <n-modal v-model:show="responsibleShow" preset="card" title="可处理人员" style="width:520px;max-width:92vw"><div class="case-help">共 {{responsibleList.length}} 人</div><div class="case-responsible-list"><div v-for="p in responsibleList" :key="p.name+'|'+p.phone" class="case-responsible-person">{{p.name}}（{{p.phone}}）</div></div><template #footer><n-space justify="end"><n-button @click="responsibleShow=false">关闭</n-button></n-space></template></n-modal>
 <n-modal v-model:show="personPickerShow" preset="card" title="选择违规人员" class="case-person-picker" :mask-closable="false" style="width:min(1320px,96vw)">
 <div class="case-person-selected"><span>已选人员：</span><n-tag v-if="pickedPerson" type="info" closable @close="personDraft=null">{{pickedPerson.name}}</n-tag><span v-else class="case-help">暂未选择</span></div>
 <div class="case-person-layout"><aside class="case-person-org"><div class="case-person-search"><n-input v-model:value="orgSearch" clearable placeholder="搜索部门或班组" /></div><div class="case-person-heading">组织架构</div><div class="case-person-tree"><n-tree :data="pickerOrgs" :pattern="orgSearch" :selected-keys="personOrg?[personOrg]:[]" default-expand-all block-line @update:selected-keys="keys=>personOrg=keys[0]||null" /></div></aside>
 <section class="case-person-list"><div class="case-person-toolbar"><n-input v-model:value="personSearch" clearable placeholder="搜索人员姓名" /></div><div class="case-person-table-scroll"><table class="case-person-table"><thead><tr><th aria-label="选择人员"></th><th>姓名</th><th>账号</th><th>手机号</th><th>部门</th><th>班组</th><th>岗位</th></tr></thead><tbody><tr v-for="p in pickerVisible" :key="p.id" :class="{selected:personDraft===p.value}" @click="personDraft=p.value"><td><n-radio :checked="personDraft===p.value" :aria-label="'选择'+p.name" @update:checked="personDraft=p.value" /></td><td>{{p.name}}</td><td>{{p.account}}</td><td>{{p.phone||'未录入'}}</td><td>{{p.department}}</td><td>{{p.team}}</td><td>{{p.post||'—'}}</td></tr></tbody></table><n-empty v-if="!pickerRows.length" description="暂无符合条件的人员" style="padding:48px" /></div><div class="case-person-pagination"><span class="case-help">共 {{pickerRows.length}} 人</span><n-pagination v-model:page="personPage" :item-count="pickerRows.length" :page-size="10" :page-slot="5" /></div></section></div>
 <template #footer><n-space justify="end"><n-button @click="personPickerShow=false">关闭</n-button><n-button type="primary" :disabled="!personDraft" @click="confirmPerson">确认</n-button></n-space></template></n-modal>
 <n-modal v-model:show="callShow" preset="card" :title="callView?'已电话介入':'记录电话介入'" style="width:780px;max-width:94vw" :mask-closable="false">
 <div v-if="callView&&callTarget" class="case-call-scroll"><n-timeline><n-timeline-item v-for="call in stageCalls(callTarget)" :key="call.id" type="info" :title="call.stage" :time="call.time"><article class="case-call-entry"><div class="case-call-meta"><span>值守人员：{{call.person}}</span><span>联系对象：{{call.contact}}</span></div><dl class="case-call-fields"><dt>催促内容</dt><dd>{{call.content}}</dd><dt>联系结果</dt><dd>{{call.result}}</dd></dl></article></n-timeline-item></n-timeline></div>
 <div v-else class="case-form"><div class="case-note">{{callTarget&&isFire(callTarget)?'消防电话介入':callTarget&&receipts[callTarget.id]?'催处理：提醒已接收人员完成处理':'催接收：提醒责任人接收处理任务'}}</div><div><label>联系对象 <span class="case-required">*</span></label><n-input v-model:value="callForm.contact" maxlength="30" placeholder="请输入已电话联系的人员" /></div><div><label>{{callTarget&&isFire(callTarget)?'联系内容':'催促内容'}} <span class="case-required">*</span></label><n-input v-model:value="callForm.content" type="textarea" maxlength="500" show-count :autosize="{minRows:3,maxRows:6}" placeholder="请在线下拨打电话后记录催促事项" /></div><div><label>联系结果 <span class="case-required">*</span></label><n-input v-model:value="callForm.result" maxlength="100" placeholder="如已联系、无人接听或对方反馈" /></div><n-alert v-if="callError" type="error">{{callError}}</n-alert></div><template #footer><n-space justify="center"><n-button @click="callShow=false">{{callView?'关闭':'取消'}}</n-button><n-button v-if="callView" @click="callView=false">再次介入</n-button><n-button v-else type="primary" @click="saveCall">保存介入记录</n-button></n-space></template></n-modal>
 <n-modal :show="!!preview" @update:show="preview=null" :mask-closable="true"><img :src="preview" alt="放大查看报警或整改图片" style="max-width:90vw;max-height:85vh;object-fit:contain" @click="preview=null"></n-modal>
 </n-config-provider>`}).component('case-event-detail',window.CaseEventDetail).component('area-cascader',window.AreaCascade.cascader()).use(naive).mount('#caseApp');
})();
