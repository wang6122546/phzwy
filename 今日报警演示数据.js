(() => {
 const today = new Date().toLocaleDateString('sv-SE');
 if(window.ALARM_DEMO_RECORDS.some(r => r.id === 'BJ' + today.replaceAll('-', '') + 'D0001')) return;
 const templates = window.ALARM_DEMO_RECORDS.slice();
 for (let index = 0; index < 8; index++) {
  window.ALARM_DEMO_RECORDS.push({...templates[index % templates.length],
   id: 'BJ' + today.replaceAll('-', '') + 'D' + String(index + 1).padStart(4, '0'),
   time: today + ' 10:' + String(48 - index * 5).padStart(2, '0') + ':00',
   misreportType: index === 6 ? '光照或阴影变化' : '',
   remark: index < 5 ? '' : ['经核实，现场存在违规行为。','现场光照变化引发误识别，未发现违规行为。','该事件属于已安排的计划内作业。'][index-5],
   status: index < 5 ? '待复核' : '已复核',
   result: index < 5 ? '-' : ['确认违规','误报','计划内事件'][index-5],
   reviewer: index < 5 ? '—' : ['张安全','李强','王敏'][index-5],
   reviewTime: index < 5 ? '—' : today + ' 11:' + String(10 + index).padStart(2,'0') + ':00', overdueSeconds: index === 0 ? 120 : 0, overdue: index === 0 ? '超期2分钟' : '否'
  });
 }
})();

if(window.AlarmEventLevels)window.ALARM_DEMO_RECORDS.forEach(record=>record.level=window.AlarmEventLevels.level(record.type,record.level,record));

// Office overview demo: three distinct event types, with review and handling states.
(() => {
 const today=new Date().toLocaleDateString('sv-SE'),prefix='OFFICE-DEMO-'+today+'-';
 const base=window.ALARM_DEMO_RECORDS[0]||{};
 const examples=[
  {suffix:'01',type:'人员入侵',device:'办公三楼机房内',deviceId:'video-it-0',time:'10:36:00',level:'一级',status:'待复核',result:'-',photo:'sample-blocked-passage.jpg',confidence:'96.8%'},
  {suffix:'02',type:'违规吸烟',device:'UPS房1',deviceId:'video-it-1',time:'10:24:00',level:'四级',status:'已复核',result:'确认违规',photo:'sample-normal-scene.jpg',confidence:'94.2%'},
  {suffix:'03',type:'消防通道堵塞',device:'办公三楼机房内',deviceId:'video-it-0',time:'09:18:00',level:'二级',status:'已复核',result:'确认违规',photo:'sample-blocked-passage.jpg',confidence:'98.1%'}
 ];
 examples.forEach(item=>{const id=prefix+item.suffix;if(window.ALARM_DEMO_RECORDS.some(r=>r.id===id))return;window.ALARM_DEMO_RECORDS.push({...base,...item,id,time:today+' '+item.time,area:'办公楼 / 办公楼3层 / IT机房',reviewer:item.status==='已复核'?'王值守':'—',reviewTime:item.status==='已复核'?today+(item.suffix==='03'?' 09:22:00':' 10:28:00'):'—',remark:item.status==='已复核'?'现场核实，确认违规。':'',overdue:'否',overdueSeconds:0,misreportType:''});});
 if(window.AlarmEventLevels)window.ALARM_DEMO_RECORDS.filter(r=>r.id.startsWith(prefix)).forEach(r=>r.level=window.AlarmEventLevels.level(r.type,r.level,r));
})();

// Fire-alarm demo data per warehouse, covering every handling state shown in the building popup.
(() => {
 if(window.StatsDrill)return;
 const today=new Date().toLocaleDateString('sv-SE');
 const read=k=>{try{return JSON.parse(localStorage.getItem(k))||{};}catch{return {};}};
 const stamp=h=>today+' '+h;
 const fireCases=[
  {id:'FIRE-DEMO-'+today+'-W1',buildingId:'warehouse-1',type:'烟雾报警',device:'1号仓库消防监测主机',area:'1号仓库',level:'一级',status:'待复核',result:'-',reviewer:'—',reviewTime:'—',time:'10:12:00',photo:'sample-blocked-passage.jpg',confidence:'99.2%',owner:'王值守'},
  {id:'FIRE-DEMO-'+today+'-W2',buildingId:'warehouse-2',alarmStatus:'已处置',type:'焰火报警',device:'2号仓库消防监测主机',area:'2号仓库',level:'一级',status:'已复核',result:'确认违规',reviewer:'王值守',reviewTime:'09:50:00',time:'09:48:00',photo:'sample-normal-scene.jpg',confidence:'98.6%',owner:'王值守'},
  {id:'FIRE-DEMO-'+today+'-W3',buildingId:'warehouse-3',alarmStatus:'处置中',type:'消防水压偏低',device:'3号仓库消防监测主机',area:'3号仓库',level:'二级',status:'已复核',result:'确认违规',reviewer:'王值守',reviewTime:'09:18:00',time:'09:15:00',photo:'sample-safety-belt.jpg',confidence:'97.4%',owner:'王值守'},
  {id:'FIRE-DEMO-'+today+'-W4',buildingId:'warehouse-4',alarmStatus:'已处置',type:'消防通道堵塞',device:'4号仓库消防监测主机',area:'4号仓库',level:'二级',status:'已复核',result:'确认违规',reviewer:'王值守',reviewTime:'08:42:00',time:'08:40:00',photo:'sample-blocked-passage.jpg',confidence:'98.1%',owner:'王值守'}
 ];
 fireCases.forEach(item=>{
  if(window.ALARM_DEMO_RECORDS.some(r=>r.id===item.id))return;
  window.ALARM_DEMO_RECORDS.push({...item,deviceType:({'烟雾报警':'点型感烟火灾探测器','焰火报警':'独立式电气火灾监控探测器','消防水压偏低':'水压监测装置','消防通道堵塞':'水压监测装置'}[item.type]),id:item.id,deviceId:'fire-'+item.buildingId,time:stamp(item.time),reviewTime:item.reviewTime==='—'?'—':stamp(item.reviewTime),remark:item.status==='已复核'?'经消防主机复核，确认现场报警属实。':'',overdue:'否',overdueSeconds:0,misreportType:''});
 });
 if(window.AlarmEventLevels)window.ALARM_DEMO_RECORDS.filter(r=>r.id.startsWith('FIRE-DEMO-')).forEach(r=>r.level=window.AlarmEventLevels.level(r.type,r.level,r));
 // Preset receive / disposal state for the accepted and finished fire cases.
 const receiptKey='alarm-case-receipts-v1',disposalKey='alarm-case-disposals-v1';
 const receipts=read(receiptKey),disposals=read(disposalKey);
 const w2='FIRE-DEMO-'+today+'-W2',w3='FIRE-DEMO-'+today+'-W3',w4='FIRE-DEMO-'+today+'-W4';
 // W2 stays 待接收 (no receipt preset); W3 gets receipt only -> 待处置; W4 gets both -> 已处置.
 if(!receipts[w3])receipts[w3]={person:'张安全',time:stamp('09:25:00')};
 if(!receipts[w4])receipts[w4]={person:'张安全',time:stamp('08:48:00')};
 if(!disposals[w4])disposals[w4]={person:'张安全',violator:'王值守',time:stamp('09:05:00'),description:'到场核实消防通道被货物占用，已现场清理恢复。',measures:'清除通道障碍物并划定禁放区域。',evidence:[{id:w4+'-photo',name:'现场照片',url:'sample-blocked-passage.jpg'}]};
 try{localStorage.setItem(receiptKey,JSON.stringify(receipts));localStorage.setItem(disposalKey,JSON.stringify(disposals));}catch{}
})();

// Independent suspected-review example shared by the alarm list and detail views.
(() => {
 const today=new Date().toLocaleDateString('sv-SE'),id='AI-SUSPECTED-DEMO-'+today;
 if(window.ALARM_DEMO_RECORDS.some(r=>r.id===id))return;
 const base=window.ALARM_DEMO_RECORDS.find(r=>!window.AlarmSourceRules?.isFire(r));if(!base)return;
 window.ALARM_DEMO_RECORDS.push({...base,id,time:today+' 10:20:00',status:'已复核',result:'疑似',reviewer:'张安全',reviewTime:today+' 10:22:00',remark:'现有画面不足以确认是否违规，标记为疑似，待进一步核实。',misreportType:'',overdue:'否',overdueSeconds:0});
})();

// Populate event-judgment values on built-in reviewed examples.
window.ALARM_DEMO_RECORDS.forEach(record=>{
 if(record.status!=='已复核'||record.eventJudgment||window.AlarmSourceRules?.isFire(record))return;
 record.eventJudgment=record.result==='误报'?'算法误报':record.result==='疑似'?'画面异常':/佩戴|穿|口罩|帽|反光衣|安全带/.test(record.type)?'穿戴不规范':'违规或异常';
});
