(() => {
 const refresh=()=>{
  const rules=window.AlarmBasicSettings;if(!rules)return;
  let changed=false;
  document.querySelectorAll('#alarmRecordsTable tbody tr').forEach(row=>{
   if(row.cells.length!==15)return;
   const result=rules.review({time:row.cells[2].textContent.trim(),status:row.cells[9].textContent.trim(),reviewTime:row.cells[12].textContent.trim()});
   const cell=row.cells[13];if(cell.textContent!==result.overdue){changed=true;cell.textContent=result.overdue;}
   cell.dataset.reviewOverdueSeconds=String(result.overdueSeconds);cell.style.color=result.overdueSeconds>0?'#ef2f4f':'#24344d';
  });
  if(changed)document.getElementById('reviewOverdueFilter')?.dispatchEvent(new Event('change'));
  const id=new URLSearchParams(location.search).get('alarmId');
  const records=window.ALARM_DEMO_RECORDS||[];const record=records.find(r=>r.id===id)||records[0];
  if(record)document.querySelectorAll('[data-alarm-field="overdue"]').forEach(field=>{const result=rules.review(record);field.textContent=result.overdue;field.style.color=result.overdueSeconds>0?'#ef2f4f':'#24344d';});
 };
 refresh();setInterval(refresh,1000);window.addEventListener('storage',event=>{if(event.key===window.AlarmBasicSettings?.key)refresh();});
})();
