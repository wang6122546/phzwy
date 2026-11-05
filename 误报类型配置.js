(() => {
const $ = id => document.getElementById(id);
let editing = null, removing = null;
function render() {
 try {
 const all = MisreportTypes.read(), keyword = $('search').value.trim().toLowerCase();
 const rows = all.filter(r => (r.name+' '+r.description).toLowerCase().includes(keyword));
 $('count').textContent = '共 '+rows.length+' 项'; $('rows').replaceChildren();
 rows.forEach((r,i) => {
 const tr = document.createElement('tr');
 [String(i+1),r.name,r.description || '—'].forEach(value => { const td=document.createElement('td'); td.textContent=value; tr.appendChild(td); });
 const actions=document.createElement('td');
 [['编辑','action',()=>openEditor(r)],['删除','action danger',()=>{removing=r.id;$('removeText').textContent='确定删除“'+r.name+'”？删除后复核下拉框将不再提供此选项。';$('deleteError').textContent='';$('removeDialog').showModal();}]].forEach(([name,cls,fn])=>{const b=document.createElement('button');b.textContent=name;b.className=cls;b.onclick=fn;actions.appendChild(b);});
 tr.appendChild(actions);$('rows').appendChild(tr);
 });
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.className='empty';td.textContent='暂无误报类型';tr.appendChild(td);$('rows').appendChild(tr);}
 $('pageError').textContent='';
 }catch(e){$('pageError').textContent='读取配置失败：'+e.message;}
}
function openEditor(r){editing=r?r.id:null;$('editorTitle').textContent=r?'编辑误报类型':'新增误报类型';$('name').value=r?r.name:'';$('description').value=r?r.description:'';$('formError').textContent='';$('editor').showModal();}
$('add').onclick=()=>openEditor(null);$('cancel').onclick=()=>$('editor').close();$('search').oninput=render;
$('editForm').onsubmit=e=>{e.preventDefault();try{const name=$('name').value.trim(),description=$('description').value.trim(),rows=MisreportTypes.read();if(!name)throw Error('请输入类型名称');if(rows.some(r=>r.id!==editing&&r.name===name))throw Error('类型名称已存在');if(editing){const r=rows.find(r=>r.id===editing);if(!r)throw Error('该类型已删除，请刷新后重试');Object.assign(r,{name,description});}else rows.push({id:'MT'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name,description});MisreportTypes.save(rows);$('editor').close();render();}catch(e){$('formError').textContent=e.message;}};
$('removeCancel').onclick=()=>$('removeDialog').close();$('removeConfirm').onclick=()=>{try{MisreportTypes.save(MisreportTypes.read().filter(r=>r.id!==removing));$('removeDialog').close();render();}catch(e){$('deleteError').textContent=e.message;}};
window.addEventListener('storage',e=>{if(e.key===MisreportTypes.key)render();});render();
})();
