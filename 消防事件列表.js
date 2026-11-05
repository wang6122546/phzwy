(() => {
 const pair=(key,label)=>[key,label];
 const latest=pair('latest','平台最新接收时间'),time=pair('time','报警时间'),device=pair('deviceType','设备类型'),system=pair('systemType','系统类型'),place=pair('area','设备位置'),point=pair('point','主机回路点位/二次码/通道号'),state=pair('caseStatus','处置状态'),finished=pair('finished','处置完成时间');
 const columns={
  '火警':[latest,pair('id','报警ID'),time,device,place,point,state,pair('action','处置动作'),pair('result','处置结果'),pair('compliance','是否规范')],
  '预警':[latest,pair('id','报警ID'),time,place,device,pair('description','预警描述'),pair('warningLevel','预警等级'),state,finished],
  '故障':[pair('eventSource','故障来源'),pair('id','报警ID'),time,system,device,place,pair('description','故障描述'),point,pair('method','处置方式'),state,pair('late','是否超期'),pair('confirmation','确认状态'),finished],
  '隐患':[pair('eventSource','隐患来源'),pair('id','报警ID'),time,system,device,pair('description','隐患问题'),pair('reading','报警监测值'),pair('area','隐患位置'),pair('method','处置方式'),state,pair('late','是否超期'),finished],
  '动作':[latest,pair('id','报警ID'),time,system,device,place,point,pair('method','处置方式'),state,finished],
  '离线':[system,device,place,pair('id','报警ID'),time,pair('offlineDuration','离线时长'),pair('deviceCurrentStatus','设备当前状态'),pair('imei','IMEI'),state]
 };
 const field=(key,label,kind='select')=>({key,label,kind});
 const common=[field('time','报警时间','date'),field('deviceType','设备类型'),field('area','楼栋楼层','area'),field('caseStatus','处置状态')];
 const filters={
  '火警':[field('latest','平台最新接收时间','date'),...common,field('action','处置动作'),field('result','处置结果'),field('suspected','高度疑似真警')],
  '预警':[field('latest','平台最新接收时间','date'),...common.filter(f=>f.key!=='area'),field('finished','处置完成时间','date'),field('warningLevel','预警等级')],
  '故障':[...common,field('finished','处置完成时间','date'),field('method','处置方式'),field('late','是否超期'),field('confirmation','确认状态')],
  '隐患':[...common,field('late','是否超期'),field('method','处置方式'),field('finished','处置完成时间','date'),field('description','隐患问题')],
  '动作':[field('latest','平台最新接收时间','date'),...common.filter(f=>f.key!=='area'),field('method','处置方式'),field('finished','处置完成时间','date')],
  '离线':[field('deviceType','设备类型'),field('area','楼栋楼层','area'),field('time','报警时间','date'),field('offlineDuration','离线时长'),field('imei','IMEI','text')]
 };
 const category=r=>{
  const explicit=r.alarmCategory||r.eventCategory||r.fireCategory;
  if(columns[explicit])return explicit;
  const text=[r.type,r.deviceCurrentStatus].join(' ');
  return /离线/.test(text)?'离线':/故障/.test(text)?'故障':/隐患/.test(text)?'隐患':/动作|启动|反馈/.test(text)?'动作':/烟雾|烟感|火警/.test(text)?'火警':'预警';
 };
 const alarmTime=r=>category(r)==='离线'?(r.offlineAt||r.offlineTime||r.time):r.firstReceivedAt||r.firstReceiveTime||r.platformFirstReceiveTime||r.faultReportedAt||r.manualReportedAt||r.reportedAt||r.hazardConvertedAt||r.time;
 const value=(r,key,path,model)=>{
  if(key==='time')return alarmTime(r)||'～';
  if(key==='caseStatus')return category(r)==='离线'?'～':window.AlarmSourceRules.fireStatus(r);
  if(key==='area')return r.deviceLocation||r.installationPosition||path||r.area||'～';
  const fields={latest:r.lastReceivedAt||r.lastReceiveTime||r.time,systemType:model?.device.find(p=>p[0]==='系统类型')?.[1],point:[r.hostLoopPoint||r.loopPoint,r.secondaryCode,r.channelNo].filter(v=>v!==undefined&&v!==null&&v!=='').join('/'),action:r.disposalAction||r.fireDisposal?.action,result:r.disposalResult||r.fireDisposal?.verificationResult,compliance:r.compliance??r.isStandard,description:r.warningDescription||r.faultDescription||r.hazardProblem||r.type,warningLevel:r.warningLevel||r.level,finished:r.completedAt||r.resolvedAt||r.fireDisposal?.time,method:r.disposalMethod,late:r.isOverdue,confirmation:r.confirmationStatus,eventSource:r.faultSource||r.hazardSource||r.eventSource,reading:r.monitoringValue,suspected:r.highlySuspected,deviceCurrentStatus:r.deviceCurrentStatus||r.currentDeviceStatus};
  const v=Object.hasOwn(fields,key)?fields[key]:r[key];return v===false?'否':v===true?'是':v===undefined||v===null||v===''||v==='—'?'～':v;
 };
 window.FireEventTable={columns,filters,category,alarmTime,value,categories:Object.keys(columns)};
})();
