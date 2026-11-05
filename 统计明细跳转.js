(() => {
  const allowed=['统计报表.html','数据分析.html'];
  const storageKey='stats-drill-';
  const read=key=>{try{return JSON.parse(sessionStorage.getItem(key));}catch{return null;}};
  const token=new URLSearchParams(location.search).get('statsDrill');
  const payload=token?read(storageKey+token):null;
  const valid=payload&&Array.isArray(payload.rows)&&allowed.includes(payload.returnPage)&&Date.now()-payload.created<86400000;
  if(valid){
    window.StatsDrill={...payload,demo:payload.source==='demo'};
    window.ALARM_DEMO_RECORDS=payload.rows.map(r=>({...r,photo:r.photo||'sample-normal-scene.jpg',confidence:r.confidence||'—',reviewer:r.reviewer||'—',reviewTime:r.reviewTime||'—',overdue:r.reviewLate?'超期':'否',overdueSeconds:r.reviewLate?1:0}));
  }
  const restore=page=>read('stats-return-'+page);
  const go=(target,data,state)=>{
    const returnPage=decodeURIComponent(location.pathname.split('/').pop());
    if(!allowed.includes(returnPage))throw Error('无效的报表来源');
    const id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
    sessionStorage.setItem('stats-return-'+returnPage,JSON.stringify(state));
    sessionStorage.setItem(storageKey+id,JSON.stringify({...data,returnPage,created:Date.now()}));
    const url=new URL(target,location.href);url.searchParams.set('statsDrill',id);
    url.searchParams.set('start',data.range[0]);url.searchParams.set('end',data.range[1]);
    location.href=url.href;
  };
  const mount=()=>{
    if(!token)return;
    const back=document.createElement('button');back.textContent='返回';back.type='button';
    back.style.cssText='height:30px;padding:0 12px;border:1px solid #d8e2ef;border-radius:6px;background:white;color:#0879ff;cursor:pointer;flex:none;font:400 14px Microsoft YaHei,sans-serif';
    back.onclick=()=>location.href=valid?payload.returnPage:'统计报表.html';
    const tabs=document.getElementById('alarmScopeTabs');
    if(tabs){back.style.marginLeft='auto';back.style.alignSelf='center';tabs.append(back);}
    else if(document.getElementById('caseApp')){
      const place=()=>{const stack=document.querySelector('#caseApp .case-stack');if(!stack)return false;const toolbar=document.createElement('div');toolbar.style.cssText='display:flex;justify-content:flex-end';toolbar.append(back);stack.prepend(toolbar);return true;};
      if(!place()){const observer=new MutationObserver(()=>{if(place())observer.disconnect();});observer.observe(document.getElementById('caseApp'),{childList:true,subtree:true});}
    }
    // The independent statistics samples must never be written to the business ledger.
    if(valid&&payload.source==='demo')document.addEventListener('click',event=>{
      const button=event.target.closest('a,button');if(!button)return;
      if(button.tagName==='A'&&button.getAttribute('href')?.includes('AI识别的违章复核.html')){event.preventDefault();event.stopImmediatePropagation();alert('演示明细仅供查看，请返回后查看其他记录。');}
    },true);
  };
  window.StatsNavigation={go,restore};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
