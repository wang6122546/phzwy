(() => {
 const pair=(key,label)=>[key,label];
 const latest=pair('latest','平台最新接收时间'),time=pair('time','报警时间'),device=pair('deviceType','设备类型'),system=pair('systemType','系统类型'),place=pair('area','设备位置'),point=pair('point','主机回路点位/二次码/通道号'),state=pair('caseStatus','处置状态'),finished=pair('finished','处置完成时间');
 const columns={
  '火警':[latest,time,device,place,point,state,pair('action','处置动作'),pair('result','处置结果'),pair('compliance','是否规范')],
  '预警':[latest,time,place,device,pair('description','预警描述'),pair('warningLevel','预警等级'),state,finished],
  '故障':[time,system,device,place,pair('description','故障描述'),pair('faultProblem','故障问题'),pair('faultLocation','故障位置'),point,pair('method','处置方式'),state,pair('late','是否超期'),pair('confirmation','确认状态'),finished],
  '隐患':[time,system,device,pair('description','隐患问题'),pair('reading','报警监测值'),pair('area','隐患位置'),pair('method','处置方式'),state,pair('late','是否超期'),finished],
  '动作':[latest,time,system,device,place,point,pair('method','处置方式'),state,finished],
  '离线':[system,device,place,time,pair('offlineDuration','离线时长'),pair('deviceCurrentStatus','设备当前状态'),pair('imei','IMEI')]
 };
 const field=(key,label,kind='select')=>({key,label,kind});
 const common=[field('time','报警时间','date'),field('deviceType','设备类型'),field('area','楼栋楼层','area'),field('caseStatus','处置状态')];
 const filters={
  '火警':[field('latest','平台最新接收时间','date'),...common,field('action','处置动作'),field('result','处置结果'),field('suspected','高度疑似真警')],
  '预警':[field('latest','平台最新接收时间','date'),...common.filter(f=>f.key!=='area'),field('finished','处置完成时间','date'),field('warningLevel','预警等级')],
  '故障':[field('eventSource','故障来源'),...common,field('finished','处置完成时间','date'),field('method','处置方式'),field('late','是否超期'),field('confirmation','确认状态')],
  '隐患':[field('eventSource','隐患来源'),...common,field('late','是否超期'),field('method','处置方式'),field('finished','处置完成时间','date'),field('description','隐患问题')],
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
  const fields={faultProblem:r.faultProblem||r.issue||r.faultDescription,faultLocation:r.faultLocation||r.reportedLocation||r.deviceLocation||r.installationPosition||path,latest:r.lastReceivedAt||r.lastReceiveTime||r.time,systemType:model?.device.find(p=>p[0]==='系统类型')?.[1],point:[r.hostLoopPoint||r.loopPoint,r.secondaryCode,r.channelNo].filter(v=>v!==undefined&&v!==null&&v!=='').join('/'),action:r.disposalAction||r.fireDisposal?.action,result:r.disposalResult||r.fireDisposal?.verificationResult,compliance:r.compliance??r.isStandard,description:r.warningDescription||r.faultDescription||r.hazardProblem||r.type,warningLevel:r.warningLevel||r.level,finished:r.completedAt||r.resolvedAt||r.fireDisposal?.time,method:r.disposalMethod,late:r.isOverdue,confirmation:r.confirmationStatus,eventSource:r.faultSource||r.hazardSource||r.eventSource,reading:r.monitoringValue,suspected:r.highlySuspected,deviceCurrentStatus:r.deviceCurrentStatus||r.currentDeviceStatus};
  const v=Object.hasOwn(fields,key)?fields[key]:r[key];return v===false?'否':v===true?'是':v===undefined||v===null||v===''||v==='—'?'～':v;
 };
 const deviceCatalog={"独立式报警设备": "独立式感烟火灾探测报警器|独立式感温火灾探测报警器|独立式图像型火灾探测器|独立式电气火灾监控探测器|独立式可燃气体探测器|独立式复合型火灾探测器|热成像火灾探测器|独立式粉尘浓度探测器|智能AI视频分析仪|视频通道(天泽防灾智盒）|独立式声光报警器|智能断路器|独立式可燃气体探测器（天然气）|独立式手动火灾报警按钮|独立式温湿度探测器|分布式电气火灾监控探测器|智能管理终端（防火阀）|智能管理终端（排烟风机）|独立式喇叭|视频通道（鲲云视频盒子）", "终端状态智能监控系统": "水泵状态监测装置", "火灾自动报警系统": "火灾报警控制器|点型感烟火灾探测器|点型感温火灾探测器|点型紫外火焰探测器|红外感烟探测器|线型光束感烟火灾探测器|图像型火灾探测器|手动火灾报警按钮（不带电话孔）|消火栓按钮|声光警报器|外置集中UPS（不间断电源）|模块（消火栓泵）|吸气式感烟火灾探测器", "物联网监测设备": "水浸监测装置|水位监测装置|水压监测装置（室内消火栓）|防火门监测装置|水压监测装置（室外消火栓）|水压监测装置（试验消火栓）|水压监测装置（喷淋末端）|水压监测装置（水炮模拟末端）|水压监测装置（湿式阀组供水侧）|水压监测装置（消防泵出水口）|无线风压风速风量计|无线差压传感器|热成像网络摄像机|风速风向测量仪", "物联网传输设备": "用户信息传输装置|消防物联网信息网关|天泽智盒", "其他物联网设备": "蓝牙标签|RFID（巡检）|视频采集终端（可见光）", "电气火灾监控系统": "电气火灾监控器|故障电弧式电气火灾监控探测器", "可燃气体探测报警系统": "可燃气体探测器", "室内消火栓系统": "室内消火栓", "室外消火栓系统": "稳压泵（室外消火栓）|地上消火栓", "防火分隔设施": "常闭防火门|常开防火门", "干粉灭火系统": "干粉灭火控制器", "机械加压送风系统": "送风口"};
 const deviceOptions=Object.entries(deviceCatalog).map(([label,names])=>({label,value:"system:"+label,children:names.split("|").map(label=>({label,value:label}))}));
 const matchesDevice=(r,selected,system)=>selected.startsWith("system:")?(system===selected.slice(7)||deviceCatalog[selected.slice(7)]?.split("|").includes(r.deviceType)):r.deviceType===selected;
 const dictionaries={caseStatus:['待处置','处置中','已处置'],action:['现场核警','值守核警'],result:['真警','误报','忽略'],suspected:['是','否'],late:['是','否'],confirmation:['待确认','已确认'],warningLevel:['一级','二级','三级','四级'],offlineDuration:['大于1天','大于7天','大于15天','大于30天','小于一天','1~7天','7~15天','15~30天']};
 const methods={'故障':['自行处置','转维保','转设备运维','系统自动处置'],'隐患':['自行处置','转维保'],'动作':['自行处置','转维保','系统自动处置']};
 const hazardProblems='风压差异常|未戴安全帽|违规吸烟|未系安全绳|未穿三色马甲|湿度异常|温度异常|车辆违规停放|消控室人员睡岗|消控室人员离岗|电瓶车入梯|消防安全管理|积水报警|卸油检测异常|充电枪未归位|漏油检测异常|漏气检测异常|漏水检测异常|未穿工作服|水位异常|管网压力异常|消防通道占用|疏散通道堵塞|识别到电瓶车蓄电池|识别到电瓶车充电器|其他隐患|禁停区发现电瓶车|物料随意堆放|非机动车乱停放|监控画面异常|未放置防护栏|存在大件垃圾堆放|存在无照经营|施工占道检测异常|未戴厨师帽|现场大量积水|消防检查隐患|电瓶车违停|周界存在隐患情况|人员打电话识别|安全通道占用|风速异常|区域人数超阈值|人员工作场所使用手机|人员私自翻越围栏|人员未戴口罩|未正确摆放灭火器|人员未穿反光衣识别|识别到电瓶车|人员入侵|现场抽烟抓拍'.split('|');
 const options=(category,key)=>key==='eventSource'?(category==='故障'?['物联网监测','人工上报','核警转故障']:['物联网监测','人工上报','智能视频终端','巡检巡查']):key==='method'?methods[category]:key==='description'&&category==='隐患'?hazardProblems:dictionaries[key];
 const matchesDuration=(record,selected)=>{const raw=record.offlineDurationHours??record.offlineDuration;let hours=typeof raw==='number'?raw:parseFloat(raw);if(typeof raw==='string'&&/天/.test(raw))hours*=24;if(!Number.isFinite(hours)){const start=new Date(String(record.offlineAt||record.offlineTime||record.time).replace(' ','T')).getTime();hours=(Date.now()-start)/3600000;}if(!Number.isFinite(hours))return false;const days=hours/24;return selected==='小于一天'?days<1:selected.startsWith('大于')?days>parseInt(selected.replace('大于','')):(()=>{const [a,b]=selected.split('~').map(parseFloat);return days>=a&&days<=b;})();};
 window.FireEventTable={columns,filters,category,alarmTime,value,options,matchesDuration,deviceOptions,matchesDevice,categories:Object.keys(columns)};
})();
