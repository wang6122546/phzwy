(() => {
 const d=document,field=d.getElementById('areaDivisionField'),input=d.getElementById('areaDivisionSelect'),button=d.getElementById('openAreaDivision');
 const error=d.createElement('p');error.id='areaDivisionError';error.hidden=true;error.textContent='请选择区域划分';error.setAttribute('role','alert');field.appendChild(error);
 button.setAttribute('aria-required','true');button.setAttribute('aria-describedby',error.id);
 const clear=()=>{error.hidden=true;button.removeAttribute('aria-invalid');};
 d.getElementById('saveArea').addEventListener('click',event=>{
  if(!field.classList.contains('hidden')&&!input.value.trim()){
   event.preventDefault();event.stopImmediatePropagation();error.hidden=false;button.setAttribute('aria-invalid','true');button.focus();
  }else clear();
 },true);
 d.getElementById('saveGis').addEventListener('click',()=>{if(input.value.trim())clear();});
 d.getElementById('areaTableBody').addEventListener('click',event=>{if(event.target.closest('span.cursor-pointer'))clear();});
})();
