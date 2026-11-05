(() => {
  if (window.GlobalAlarmCenter) return;
  const base = new URL('.', document.currentScript.src);
  const isFire=r=>window.AlarmSourceRules?AlarmSourceRules.isFire(r):!!r&&(r.kind==='fire'||r.sourceType==='fire'||r.source==='fire'||String(r.deviceId||'').startsWith('fire-')||String(r.id||'').startsWith('FIRE-DEMO-'));
  const key = 'global-alarm-center-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };
  let state = load();
  let records = [];
  let drawerOpen = false;
  let notices = [];
  let noticeSequence = 0;
  function dismissNotice(token) {
    const notice = notices.find(item => item.token === token);
    if (notice) clearTimeout(notice.timer);
    notices = notices.filter(item => item.token !== token);
    render();
  }
  function showNotice(record) {
    const notice = {record, token: ++noticeSequence};
    notice.timer = setTimeout(() => dismissNotice(notice.token), 10000);
    notices.push(notice);
    while (notices.length > 2) clearTimeout(notices.shift().timer);
    render();
  }
  const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = (file, id) => new URL(file + '?alarmId=' + encodeURIComponent(id), base).href;
  const pending = () => records.filter(r => r.status === '待复核');
  const style = document.createElement('style');
  style.textContent = `
  #globalAlarmCenter{font:400 14px "Microsoft YaHei",sans-serif;color:#24344d;position:relative;z-index:1050}
  #globalAlarmCenter *{box-sizing:border-box} #globalAlarmCenter button,#globalAlarmCenter a{font:inherit;cursor:pointer}
  #globalAlarmCenter button:focus-visible,#globalAlarmCenter a:focus-visible{outline:2px solid #0879ff;outline-offset:3px}
  .gac-stack{position:fixed;right:24px;bottom:24px;display:flex;flex-direction:column;gap:12px;max-height:calc(100vh - 48px);overflow-y:auto;overscroll-behavior:contain;padding:2px;width:364px;max-width:calc(100vw - 28px)}
  .gac-toast{position:relative;flex:none;width:360px;max-width:calc(100vw - 32px);background:linear-gradient(145deg,#fff,#f7fbff);border:1px solid rgba(190,211,238,.95);border-radius:8px;box-shadow:0 8px 20px rgba(45,87,140,.12);overflow:hidden}
  .gac-head{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #e7eef8;color:#172033;font-size:16px;font-weight:400}
  .gac-head button{background:transparent;border:0;color:#8190a5;width:30px;height:30px;font-size:22px!important}
  .gac-head-tools{display:flex;align-items:center;gap:4px;margin-left:auto}
  #globalAlarmCenter .gac-head .gac-more{width:auto;padding:0 8px;font-size:12px!important;color:#0879ff;border-radius:6px;white-space:nowrap}
  .gac-head .gac-more:hover{background:#eef6ff}
  .gac-event-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
  .gac-body .gac-event-heading h3{flex:1;min-width:0;margin:0;overflow-wrap:anywhere;line-height:22px}
  .gac-event-heading .gac-tag{flex:none;white-space:nowrap}
  .gac-level{display:inline-flex;align-items:center;gap:6px;height:22px;line-height:22px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:400}
  .gac-level::before{content:'';width:6px;height:6px;flex:none;border-radius:50%;background:currentColor}
  .gac-level--1{color:#ef2f4f;background:#fff4f5}.gac-level--2{color:#d98600;background:#fff3d9}
  .gac-level--3{color:#d98600;background:#fff3d9}.gac-level--4{color:#0879ff;background:#eef6ff}
  .gac-level--unknown{color:#8190a5;background:#fafbfd}
  .gac-body{padding:16px}.gac-body p{margin:8px 0;color:#8190a5;font-size:12px;overflow-wrap:anywhere}.gac-body h3{margin:0 0 12px;font-size:16px;font-weight:400;color:#172033}
  .gac-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.gac-actions a{display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 18px;border:1px solid #d8e2ef;border-radius:8px;text-decoration:none;color:#0879ff;background:white}
  .gac-actions a:last-child{background:linear-gradient(100deg,#0879ff,#6654f7);color:white;border:0}
  .gac-dock{position:fixed;right:24px;bottom:16px;display:flex;align-items:center;gap:10px;height:44px;padding:0 16px;background:white;color:#0879ff;border:1px solid rgba(190,211,238,.95);border-radius:8px;box-shadow:0 8px 20px rgba(45,87,140,.08)}
  .gac-mask{position:fixed;inset:0;background:rgba(23,32,51,.28)}
  .gac-drawer{position:fixed;top:0;right:0;bottom:0;width:480px;max-width:100vw;background:#fafbfd;box-shadow:-8px 0 20px rgba(45,87,140,.12);display:flex;flex-direction:column}
  .gac-list{flex:1;min-height:0;overflow:auto;padding:16px}.gac-item{background:linear-gradient(145deg,#fff,#f7fbff);border:1px solid rgba(190,211,238,.95);border-radius:8px;margin-bottom:12px;padding:16px}
  .gac-tag{display:inline-block;font-size:12px;height:22px;line-height:22px;padding:0 8px;border-radius:999px;background:#fff3d9;color:#d98600}
  .gac-empty{text-align:center;padding:64px 16px;color:#8190a5}
  @media(max-width:600px){.gac-stack{right:14px}.gac-dock{right:16px}}
  `;
  document.head.appendChild(style);
  const root = document.createElement('div'); root.id = 'globalAlarmCenter'; document.body.appendChild(root);
  const actions = r => `<div class="gac-actions"><a href="${esc(url('AI隐患核查.html', r.id))}">详情</a><a href="${esc(url('AI识别的违章复核.html', r.id))}">复核</a></div>`;
  const levelBadge = r => {
    const tone = {'一级':'1','二级':'2','三级':'3','四级':'4'}[r.level] || 'unknown';
    return `<span class="gac-level gac-level--${tone}">${esc(r.level || '未分级')}</span>`;
  };
  const processingStatus=r=>{let done;try{done=JSON.parse(localStorage.getItem('alarm-case-disposals-v1')||'{}')?.[r.id];}catch{}const raw=(done?.localCompleted?done.status:null)||r.processingStatus||r.handleStatus||r.caseStatus||r.disposal?.status||done?.status;const aliases={'未处理':'待处理','待接收':'待处理','待处置':'待处理','待处理':'待处理','已处置':'完成处理','已处理':'完成处理'};return ['完成处理','无需处理','先期处理'].includes(raw)?raw:aliases[raw]||(done?'完成处理':'待处理');};
  const content = r => `<div class="gac-event-heading"><h3>${esc(({'货架区未佩戴安全帽':'未佩戴安全帽','仓库人员未穿反光衣':'未穿反光衣'}[r.type]||r.type))}</h3><span class="gac-tag" style="${processingStatus(r)==='完成处理'?'color:#12a36a;background:#e8fbf4':processingStatus(r)==='无需处理'?'color:#8190a5;background:#fafbfd':processingStatus(r)==='先期处理'?'color:#0879ff;background:#eef6ff':''}">${esc(processingStatus(r))}</span></div><p>设备名称：${esc(r.device||'—')}</p><p>设备位置：${esc(r.deviceLocation||r.location||r.area||'—')}</p><p>责任区域：${esc(r.area||'—')}</p><p>报警时间：${esc(r.time||'—')}</p><p>置信度：${esc(r.confidence||'—')}</p>${actions(r)}`;
  function render() {
    const list = pending();
    const toastMarkup = notices.map(notice => `<section class="gac-toast" role="status" aria-live="polite" data-notice="${notice.token}"><header class="gac-head"><span style="color:#0879ff">新报警提醒</span><div class="gac-head-tools"><button class="gac-more" data-open-drawer title="查看报警信息(${list.length})" aria-label="查看报警信息(${list.length})">报警信息(${list.length}...)</button><button data-minimize="${notice.token}" aria-label="关闭报警提醒">×</button></div></header><div class="gac-body">${content(notice.record)}</div></section>`).join('');
    const drawerMarkup = `<div class="gac-mask" data-close-drawer></div><section class="gac-drawer" role="dialog" aria-modal="true" aria-label="报警信息"><header class="gac-head"><span>报警信息(${list.length})</span><button data-close-drawer aria-label="关闭报警信息">×</button></header><div class="gac-list">${list.map(r => `<article class="gac-item gac-body">${content(r)}</article>`).join('') || '<div class="gac-empty"><div style="font-size:36px;margin-bottom:16px">✓</div>暂无报警信息</div>'}</div></section>`;
    const dockMarkup = `<button class="gac-dock" data-open-drawer aria-label="报警信息${list.length}条，打开报警抽屉"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span>报警信息 ${list.length}</span></button>`;
    root.innerHTML = drawerOpen ? drawerMarkup : notices.length ? `<div class="gac-stack" aria-label="新报警提醒列表">${toastMarkup}</div>` : dockMarkup;
  }
  root.addEventListener('click', event => {
    const close = event.target.closest('[data-minimize]');
    if(close) dismissNotice(Number(close.dataset.minimize));
    if(event.target.closest('[data-open-drawer]')) { drawerOpen = true; render(); root.querySelector('[data-close-drawer][aria-label]')?.focus(); }
    if(event.target.closest('[data-close-drawer]')) { drawerOpen = false; state.minimized = true; save(); render(); }
  });
  document.addEventListener('keydown', event => { if(!drawerOpen)return; if(event.key === 'Escape'){drawerOpen=false;state.minimized=true;save();render();root.querySelector('.gac-dock')?.focus();} if(event.key === 'Tab'){const items=Array.from(root.querySelectorAll('.gac-drawer button,.gac-drawer a'));const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}} });
  function receive(record) {
    if(isFire(record))return;
    if(!record?.id || !record.type) return;
    records = records.filter(r => r.id !== record.id);
    const next = {...record,status:'待复核'}; records.unshift(next);
    state.extra = [next,...(state.extra || []).filter(r => r.id !== record.id)];
    state.latest = record.id; state.minimized = false; save(); showNotice(next);
  }
  window.GlobalAlarmCenter = {receive, open:() => {drawerOpen=true;render();}, getPending:() => pending().map(r=>({...r}))};
  window.addEventListener('alarm:received', event => receive(event.detail));
  window.addEventListener('storage', event => {if(event.key===key){state=load(); merge();render();}else if(event.key==='alarm-case-disposals-v1'){render();}});
  function merge(){ const map = new Map((window.ALARM_DEMO_RECORDS || []).map(r=>[r.id,r])); (state.extra || []).forEach(r=>map.set(r.id,r));records=Array.from(map.values()).filter(r=>!isFire(r)).sort((a,b)=>b.time.localeCompare(a.time)); }
  function init(){ merge();
    const requested = new URLSearchParams(location.search).get('alarmId');
    const panel = document.getElementById('detailPanel');
    const record = records.find(r => r.id === requested);
    if(panel && record){
      window.fillAlarmDetail?.({...record,photo:new URL(record.photo || 'sample-no-helmet.jpg',base).href});
      panel.classList.remove('translate-x-full');
    }
 if(state.minimized === undefined){state.minimized=false;save();}
 render();
 const first = pending()[0];
 if(first) showNotice(first);
 // One demonstration only: first now, second after 5 seconds.
 // Each expires after 10 seconds, so they disappear at 10 and 15 seconds.
 setTimeout(() => {
   const second = pending()[1];
   if(second) showNotice(second);
 }, 5000);
 }
  if(window.ALARM_DEMO_RECORDS) init(); else {const script=document.createElement('script');script.src=new URL('报警演示数据.js',base).href;script.onload=()=>{const todayScript=document.createElement('script');todayScript.src=new URL('今日报警演示数据.js',base).href;todayScript.onload=init;todayScript.onerror=init;document.head.appendChild(todayScript);};script.onerror=()=>{state.minimized=true;init();};document.head.appendChild(script);}
})();
