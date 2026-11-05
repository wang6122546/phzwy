(() => {
  const table = document.getElementById('areaTableBody'), assets = window.AreaConfigDevices;
  if (!table || !assets) return;
  const key = 'sinotrans-area-config-rows-v1';
  const templates = new Map([...table.rows].map(row => [row.cells[2].textContent.trim(), row.cloneNode(true)]));
  const snapshot = () => [...table.rows].map(row => ({
    id: row.dataset.responsibilityId || row.cells[0].textContent.trim(),
    serial: row.cells[0].textContent.trim(),
    name: row.cells[1].textContent.replace(/^[⌄›]\s*/, '').trim(),
    level: row.cells[2].textContent.trim(), risk: row.cells[3].textContent.trim(),
    owner: row.cells[4].textContent.trim(), unit: row.cells[5].textContent.trim(),
    division: row.dataset.areaDivision || '', cameras: assets.get(row)
  }));
  const count = () => {
    const footer = document.querySelector('#areaConfigTable')?.parentElement?.parentElement?.querySelector('.text-textSecondary');
    // Only update the existing record-count text, preserving the footer layout.
    const candidates = [...document.querySelectorAll('span,div,p')].filter(el => el.childElementCount === 0 && /^共\s*\d+\s*条$/.test(el.textContent.trim()));
    candidates.forEach(el => { el.textContent = `共 ${table.rows.length} 条`; });
  };
  let restoreError = false;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && saved.version === 1 && Array.isArray(saved.rows)) {
      if (!saved.rows.every(item => item && typeof item.name === 'string' && typeof item.serial === 'string' && templates.has(item.level) && Array.isArray(item.cameras))) throw Error('invalid area data');
      const fragment = document.createDocumentFragment();
      saved.rows.forEach(item => {
        const row = templates.get(item.level).cloneNode(true);
        row.hidden = false; row.style.display = '';
        row.dataset.responsibilityId = item.id;
        row.dataset.areaDivision = item.division || '';
        [item.serial,item.name,item.level,item.risk,item.owner,item.unit].forEach((value,index) => {
          if(index === 2) return;
          row.cells[index].textContent = value || (index === 0 ? '' : '—');
        });
        assets.set(row,item.cameras);fragment.appendChild(row);
      });
      table.replaceChildren(fragment);assets.refresh();
    }
  } catch { restoreError = true; }
  const save = () => {
    count();
    if (restoreError) return;
    try { localStorage.setItem(key, JSON.stringify({version:1, rows:snapshot()})); }
    catch { showError('区域列表保存失败，请检查浏览器存储后重试。'); }
  };
  function showError(message) {
    let note = document.getElementById('areaListStorageError');
    if (!note) { note = document.createElement('p'); note.id='areaListStorageError';note.setAttribute('role','alert');note.style.cssText='padding:12px 16px;color:#ef2f4f;background:#fff4f5';document.querySelector('#areaConfigTable').before(note); }
    note.textContent=message;
  }
  if (restoreError) showError('已保存的区域列表读取失败，当前显示初始列表；原存储数据已保留。');
  let pending;
  const schedule = () => { clearTimeout(pending);pending=setTimeout(save,0); };
  document.getElementById('saveArea').addEventListener('click', () => {
    setTimeout(() => { if (document.getElementById('areaDrawer').classList.contains('hidden')) save(); },0);
  },true);
  new MutationObserver(schedule).observe(table,{childList:true});
  count();
})();
