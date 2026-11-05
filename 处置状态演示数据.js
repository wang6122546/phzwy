(() => {
 if(window.StatsDrill)return;
 const read=k=>{try{return JSON.parse(localStorage.getItem(k))||{};}catch{return {};}};
 const alarmKey='global-alarm-center-v1',receiptKey='alarm-case-receipts-v1',disposalKey='alarm-case-disposals-v1',callKey='alarm-case-phone-interventions-v1';
 const state=read(alarmKey),receipts=read(receiptKey),disposals=read(disposalKey),calls=read(callKey);
 const extra=Array.isArray(state.extra)?state.extra:[];
 const stamp=minutes=>{const d=new Date(Date.now()-minutes*60000);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+d.toTimeString().slice(0,8);};
 const officePrefix='OFFICE-DEMO-'+new Date().toLocaleDateString('sv-SE')+'-';
 for(const suffix of ['02','03']){const id=officePrefix+suffix,day=new Date().toLocaleDateString('sv-SE');
  if(!receipts[id])receipts[id]={person:'张安全',time:day+(suffix==='02'?' 10:32:00':' 09:26:00')};
  if(suffix==='03'&&!disposals[id])disposals[id]={person:'张安全',time:day+' 09:45:00',description:'已清理办公楼消防通道堆放物，恢复通道畅通。',measures:'清除障碍物并检查疏散通道。',evidence:[{name:'现场整改照片',url:'sample-normal-scene.jpg'}]};
 }
 const cases=[
  {suffix:'PENDING-01',type:'货架区未佩戴安全帽',area:'仓库作业区',device:'仓库作业区摄像头01',photo:'sample-no-helmet.jpg',level:'一级',minutes:18,accepted:12},
  {suffix:'PENDING-02',type:'消防通道堵塞',area:'装卸作业区',device:'装卸通道摄像头02',photo:'sample-blocked-passage.jpg',level:'二级',minutes:60,accepted:45},
  {suffix:'DONE-01',type:'人员入侵',area:'限制通行区',device:'限制通行区摄像头03',photo:'sample-blocked-passage.jpg',level:'一级',minutes:100,accepted:90,finished:75},
  {suffix:'DONE-02',type:'未佩戴安全带',area:'高处作业区',device:'作业平台摄像头04',photo:'sample-safety-belt.jpg',level:'三级',minutes:160,accepted:150,finished:110}
 ];
 for(const item of cases){
  const id='CASE-MOBILE-DEMO-'+item.suffix;
  if(extra.some(r=>r.id===id))continue;
  const record={id,type:item.type,area:item.area,device:item.device,photo:item.photo,level:item.level,time:stamp(item.minutes),reviewTime:stamp(item.minutes-2),notifiedAt:stamp(item.minutes-2),status:'已复核',result:'确认违规',reviewer:'王值守',remark:'经现场画面核实，确认存在违规行为。',owner:'刘刚',assignee:'张安全',confidence:'96.2%',overdue:'否'};
  extra.push(record);
  if(!receipts[id])receipts[id]={person:'张安全',time:stamp(item.accepted)};
  if(item.finished!==undefined&&!disposals[id])disposals[id]={person:'张安全',violator:'刘刚（13800002001）',time:stamp(item.finished),description:'到场核实报警情况，通知违规人员停止违规行为，并完成现场安全教育。',measures:item.type==='人员入侵'?'人员已撤离限制区域，恢复现场通行边界与警示标识。':'已正确佩戴并检查安全带，确认防护措施到位后恢复作业。',evidence:[{id:id+'-photo',name:'现场整改照片',url:'sample-normal-scene.jpg'}]};
  if(!calls[id])calls[id]=[{id:id+'-call',stage:'催处置',person:'王值守',contact:'张安全',time:stamp(item.accepted-2),content:'电话了解现场处置进展，提醒完成整改后及时提交处置结果。',result:'已联系，处置人员正在现场处理'}];
 }
 try{localStorage.setItem(alarmKey,JSON.stringify({...state,extra}));localStorage.setItem(receiptKey,JSON.stringify(receipts));localStorage.setItem(disposalKey,JSON.stringify(disposals));localStorage.setItem(callKey,JSON.stringify(calls));}catch{}
})();
