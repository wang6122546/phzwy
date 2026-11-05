(() => {
 const key='alarm-basic-settings-v1',defaults={reviewSeconds:300,disposalSeconds:1800};
 const defaultLevels=['一级','二级','三级','四级'].map((name,index)=>({name,enabled:true,description:['紧急报警，优先处置','较高风险，及时处置','一般风险，按流程处置','低风险，持续关注'][index]}));
 const get=()=>{let data={};try{data=JSON.parse(localStorage.getItem(key))||{};}catch{}const alarmLevels=defaultLevels.map(item=>{const saved=Array.isArray(data.alarmLevels)?data.alarmLevels.find(level=>level.name===item.name):null;return {...item,enabled:saved?.enabled!==false,description:typeof saved?.description==='string'?saved.description:item.description};});return {...Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,Number.isInteger(data[k])&&data[k]>0?data[k]:v])),alarmLevels,defaultAlarmLevel:alarmLevels.some(l=>l.name===data.defaultAlarmLevel&&l.enabled)?data.defaultAlarmLevel:alarmLevels.find(l=>l.enabled)?.name||'一级'};};
 const seconds=(start,end)=>{const a=new Date(String(start).replace(' ','T')).getTime(),b=end&&end!=='—'?new Date(String(end).replace(' ','T')).getTime():Date.now();return Number.isFinite(a)&&Number.isFinite(b)?Math.max(0,Math.floor((b-a)/1000)):0;};
 const excess=(start,end,limit)=>Math.max(0,seconds(start,end)-limit);
 const text=value=>value>0?(value<60?'超期'+value+'秒':'超期'+Math.ceil(value/60)+'分钟'):'否';
 window.AlarmBasicSettings={key,get,excess,text,review:r=>{const value=excess(r.time,r.status==='已复核'?r.reviewTime:null,get().reviewSeconds);return {overdueSeconds:value,overdue:text(value)};}};
})();

(() => {
 const types=["仓库人员未穿反光衣", "货架区未佩戴安全帽", "违规吸烟", "车辆逆行", "车辆违规反向停放", "行人未走人行通道", "消防通道堵塞", "人员入侵", "焰火报警", "烟雾报警", "未佩戴厨帽", "未佩戴口罩", "翻越围栏", "机动车违停", "未佩戴安全带", "缺失灭火器", "未佩戴护目镜", "积水识别", "车辆车门及尾板未关闭", "作业车辆未按照朝站台侧开门", "货物高于托架，叉车存在进行倒车行驶", "理货员等违规站位"];
 const key='alarm-event-levels-v1',levels=['一级','二级','三级','四级'];
 const defaults=Object.fromEntries(types.map(type=>[type,{'货架区未佩戴安全帽':'一级','人员入侵':'一级','违规吸烟':'四级','行人未走人行通道':'二级','未佩戴安全带':'三级','焰火报警':'一级','烟雾报警':'一级','消防通道堵塞':'二级'}[type]||'三级']));
 const saved=()=>{try{return JSON.parse(localStorage.getItem(key))||{};}catch{return {};}};
 const get=()=>{const data=saved();return Object.fromEntries(types.map(type=>[type,levels.includes(data[type])?data[type]:defaults[type]]));};
 const cameraKey='alarm-camera-levels-v1';
 const getCameras=()=>{try{const data=JSON.parse(localStorage.getItem(cameraKey));return Array.isArray(data)?data.filter(r=>r&&r.id&&levels.includes(r.level)):[];}catch{return [];}};
 const level=(type,fallback,camera)=>{
  const data=saved(),base=levels.includes(data[type])?data[type]:(defaults[type]||(levels.includes(fallback)?fallback:'三级'));
  const r=typeof camera==='string'?{deviceId:camera}:camera||{};
  const cameraId=r.deviceId||r.cameraId,cameraName=r.device||r.cameraName;
  const rule=getCameras().find(c=>cameraId&&c.id===cameraId)||getCameras().find(c=>cameraName&&c.name===cameraName);
  return rule&&levels.indexOf(rule.level)<levels.indexOf(base)?rule.level:base;
 };
 const resolve=r=>window.AlarmSourceRules?.isFire(r)?r:{...r,level:level(r.type,r.level,r)};
 window.AlarmEventLevels={key,types,levels,get,level,cameraKey,getCameras,resolve};
})();
