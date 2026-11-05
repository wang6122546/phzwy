(() => {
 const q=new URLSearchParams(location.search);if(q.get('fromMap')!=='1')return;
 const target='方案图册.html';
 const toolbar=document.createElement('div');toolbar.style.cssText='display:flex;justify-content:flex-end;align-items:center;padding:10px 24px;background:#fff;border-bottom:1px solid #e7eef8;flex:none';
 const back=document.createElement('a');back.href=target;back.textContent='返回监测一张图';back.style.cssText='height:36px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid #d8e2ef;border-radius:8px;color:#0879ff;font:400 14px Microsoft YaHei,sans-serif;text-decoration:none';toolbar.append(back);
 const host=document.querySelector('main > header')||document.querySelector('body > header');if(host)host.after(toolbar);else document.body.prepend(toolbar);
 const isReview=decodeURIComponent(location.pathname).endsWith('AI识别的违章复核.html');if(!isReview)return;
 const oldBack=document.querySelector('a[aria-label="返回AI报警中心"]');if(oldBack){oldBack.href=target;oldBack.setAttribute('aria-label','返回监测一张图');}
 const cancel=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='取消');if(cancel)cancel.onclick=()=>location.href=target;
 const submit=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='提交复核结果');if(!submit)return;
 const error=document.createElement('p');error.setAttribute('role','alert');error.style.cssText='color:#ef2f4f;font:400 14px Microsoft YaHei,sans-serif;padding:8px 0';submit.parentElement.before(error);
 submit.onclick=()=>{
  error.textContent='';let state;
  try{state=JSON.parse(localStorage.getItem('global-alarm-center-v1'))||{};}catch{error.textContent='报警读取失败，请重试';return;}
  const id=q.get('alarmId'),base=[...(state.extra||[]),...(window.ALARM_DEMO_RECORDS||[])].find(r=>r.id===id);
  if(!base){error.textContent='该报警不存在，请返回重新选择';return;}
  if(window.AlarmSourceRules?.isFire(base)){error.textContent='消防设备报警不提供AI复核';return;}
  if(base.status==='已复核'){error.textContent='该报警已复核，请返回监测一张图查看最新状态';return;}
  const result=document.querySelector('[data-review-result][aria-pressed="true"]')?.dataset.reviewResult;
  if(!['确认违规','误报','计划内事件','疑似'].includes(result)){error.textContent='请选择复核结果';return;}
  const misreport=document.getElementById('misreportType');if(result==='误报'&&!misreport.value){error.textContent='请选择误报类型';return;}
  const type=document.getElementById('reviewEventType').value,level=document.getElementById('reviewAlarmLevel').value;
  if(!AlarmEventLevels.types.includes(type)||!AlarmEventLevels.levels.includes(level)){error.textContent='请选择有效的事件类型和报警等级';return;}
  if(!confirm('确认提交本次复核结果？'))return;
  const d=new Date(),time=d.toLocaleDateString('sv-SE')+' '+d.toTimeString().slice(0,8);
  const updated={...base,eventJudgment:document.getElementById('reviewEventJudgment')?.value||'',status:'已复核',result,type,level,reviewer:'张安全',reviewTime:time,remark:document.querySelector('textarea')?.value.trim()||'',misreportType:result==='误报'?misreport.selectedOptions[0].textContent:''};
  try{localStorage.setItem('global-alarm-center-v1',JSON.stringify({...state,extra:[updated,...(state.extra||[]).filter(r=>r.id!==id)]}));}catch{error.textContent='复核结果保存失败，请检查浏览器存储后重试';return;}
  location.href=target;
 };
})();
