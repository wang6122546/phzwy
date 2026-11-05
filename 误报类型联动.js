(() => {
 const select = document.getElementById('misreportType');
 function refresh() {
 const selected = select.value;
 try {
 const rows = MisreportTypes.read();
 select.replaceChildren(new Option(rows.length ? '请选择误报类型' : '暂无已配置的误报类型',''));
 rows.forEach(r => select.add(new Option(r.name,r.id)));
 select.disabled = rows.length === 0;
 if(rows.some(r=>r.id===selected)) select.value=selected;
 }catch(e){select.replaceChildren(new Option('配置读取失败，请刷新重试',''));select.disabled=true;}
 }
 window.addEventListener('focus',refresh);
 window.addEventListener('storage',e=>{if(e.key===MisreportTypes.key)refresh();});
 window.addEventListener('misreport-types-change',refresh);
 refresh();
})();
