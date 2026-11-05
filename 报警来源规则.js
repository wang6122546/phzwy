(() => {
 const isFire=r=>!!r&&(r.kind==='fire'||r.sourceType==='fire'||r.source==='fire'||String(r.deviceId||'').startsWith('fire-')||String(r.id||'').startsWith('FIRE-DEMO-'));
 const fireStatus=r=>{
  const raw=r?.alarmStatus??r?.fireStatus??r?.processingStatus??r?.caseStatus;
  if(['已处置','已恢复','完成处理','已闭环'].includes(raw))return '已处置';
  if(['处置中','处理中','正在处置','已接收'].includes(raw))return '处置中';
  if(['～','—','-','不适用'].includes(raw))return '～';
  return '待处置';
 };
 const firstReceived=r=>r?.firstReceivedAt||r?.firstReceiveTime||r?.platformFirstReceiveTime||r?.time||'—';
 const fireName=r=>({'烟雾报警':'烟感火灾报警','焰火报警':'电气火灾剩余电流报警','消防通道堵塞':'消防水压偏低'}[r.type]||r.type);
 window.AlarmSourceRules={isFire,isAI:r=>!isFire(r),fireStatus,firstReceived,fireName};
})();
