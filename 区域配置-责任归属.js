(() => {
  const D = window.ResponsibilityData, A = window.AreaConfigDevices;
  const table = document.getElementById('areaTableBody'), drawer = document.getElementById('areaDrawer');
  if (!D || !A || !table || !drawer) return;
  const key = 'sinotrans-area-responsibility-v1';
  let assignments;
  try { assignments = JSON.parse(localStorage.getItem(key) || '{}'); } catch { assignments = {}; }
  const departments = D.departments.filter(x => x.type === 'department'), people = D.people;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const deptName = id => departments.find(x => x.id === id)?.name || '';
  const personName = id => people.find(x => x.id === id)?.name || '';
  const rowKey = row => row.dataset.responsibilityId || (row.dataset.responsibilityId = row.cells[0].textContent.trim() === '新增' ? 'new-' + crypto.randomUUID() : row.cells[0].textContent.trim());
  const summary = value => [deptName(value.department), ...(value.people || []).map(personName)].filter(Boolean).join('、') || '—';
  const head = document.querySelector('#areaConfigTable thead tr');
  const th = document.createElement('th'); th.className = 'px-4 py-3 text-left font-medium text-textSecondary whitespace-nowrap'; th.textContent = '责任人'; head.insertBefore(th, head.lastElementChild);
  const field = document.createElement('section'); field.className = 'area-responsibility-field';
  field.innerHTML = '<h4>关联摄像头</h4><div id="areaCameraPreview" class="area-camera-cards"></div><h4 id="areaResponsibilityLabel">责任人</h4><button type="button" id="openAreaResponsibility" class="area-responsibility-trigger" aria-labelledby="areaResponsibilityLabel areaResponsibilityValue" aria-haspopup="dialog"><span id="areaResponsibilityValue">请选择责任人</span><i class="fa fa-angle-right" aria-hidden="true"></i></button>';
  drawer.querySelector('.flex-1.overflow-y-auto').appendChild(field);
  const cameraPreview = document.getElementById('areaCameraPreview'), division = document.getElementById('areaDivisionSelect');
  let activeRow = null, contextRow = null, draft = {department:'',people:[]}, draftDevices = [], editMode = false, editingId = null;
  const copy = value => ({department:value?.department || '',people:[...(value?.people || [])]});
  const deviceCards = devices => devices.length ? devices.map(device => `<article class="area-camera-card"><span class="area-camera-icon ${device.type === '移动' ? 'mobile' : ''}"><i class="fa ${device.type === '移动' ? 'fa-dot-circle-o' : 'fa-video-camera'}" aria-hidden="true"></i></span><div class="area-camera-info"><div>${esc(device.name)}</div><p>设备编号：${esc(device.code)}</p></div><span class="area-camera-type ${device.type === '移动' ? 'mobile' : ''}">${esc(device.type || '固定')}</span></article>`).join('') : '<div class="area-camera-empty">选择区域划分后自动关联摄像头</div>';
  // Fixed demo camera catalogue for the existing floor-plan rooms.
  const catalog = new Map();
  ['生产综合楼','选矿主厂房','运输转运楼'].forEach((building, b) => ['一层','二层','三层'].forEach((floor, f) => ['配电室','主控室','设备间','东侧生产区','西侧作业区'].forEach((zone, z) => {
    catalog.set([building,floor,zone].join(' / '), [0,1].map(i => ({name:`${building}${floor}${zone}${i+1}号摄像头`,type:i === 0 ? '移动' : '固定',code:`${i === 0 ? 'MBQJ' : 'CAM'}-${b+1}${f+1}${z+1}${i+1}`})));
  })));
  const camerasForDivision = value => {
    const [building,floor,zones] = value.split(' / ');
    return [...new Map((zones || '').split('、').filter(Boolean).flatMap(zone => {
      const location = [building,floor,zone].join(' / ');
      if (!catalog.has(location)) {
        const code = Array.from(location).reduce((hash,char) => (Math.imul(hash,31)+char.charCodeAt(0)) >>> 0,0).toString(36).toUpperCase();
        catalog.set(location,[0,1].map(i => ({name:`${building}${floor}${zone}${i+1}号摄像头`,type:i===0?'移动':'固定',code:`${i===0?'MBQJ':'CAM'}-${code}-${i+1}`})));
      }
      return catalog.get(location);
    }).map(camera => [camera.code,camera])).values()];
  };
  const renderDraft = () => {
    cameraPreview.innerHTML = deviceCards(draftDevices);
    const value = document.getElementById('areaResponsibilityValue');
    value.textContent = summary(draft) === '—' ? '请选择责任人' : summary(draft);
    value.classList.toggle('has-value', summary(draft) !== '—');
  };
  const renderRows = () => {
    [...table.rows].forEach(row => {
      if (row.cells.length === 8) { const td = document.createElement('td'); td.className = 'px-4 py-3 area-responsibility-cell'; row.insertBefore(td,row.lastElementChild); }
      const value = assignments[rowKey(row)];
      row.cells[7].textContent = summary(value || {});
    });
  };
  const deviceList = document.getElementById('deviceDrawerList');
  if (deviceList) {
    const ownerCard = document.createElement('div');
    ownerCard.className = 'area-responsibility-preview';
    ownerCard.style.margin = '16px 24px';
    deviceList.before(ownerCard);
    table.addEventListener('click', event => {
      const camera = event.target.closest('.camera-count');
      if (!camera) return;
      const value = assignments[rowKey(camera.closest('tr'))] || {};
      ownerCard.textContent = '责任人：' + summary(value);
    }, true);
  }
  const restore = () => {
    [...table.rows].forEach(row => {
      const saved = assignments[rowKey(row)];
      if (saved?.division) row.dataset.areaDivision = saved.division;
      if (saved?.cameras) A.set(row,saved.cameras);
    });
    renderRows(); A.refresh();
  };
  const load = row => {
    draft = copy(row ? assignments[rowKey(row)] : null);
    const saved = row ? assignments[rowKey(row)] : null;
    division.value = row ? saved?.division || row.dataset.areaDivision || '' : '';
    const contextSerial = contextRow?.cells[0].textContent.trim().split('.') || [];
    const findRow = serial => [...table.rows].find(item => item.cells[0].textContent.trim() === serial);
    const name = item => item?.cells[1].textContent.replace(/^[⌄›]\s*/, '').trim() || '';
    const inheritedDivision = (contextRow && (assignments[rowKey(contextRow)]?.division || contextRow.dataset.areaDivision) || '').split(' / ');
    drawer.dataset.building = contextRow?.dataset.building || inheritedDivision[0] || name(findRow(contextSerial[0]));
    drawer.dataset.floor = contextRow?.dataset.floor || inheritedDivision[1] || name(findRow(contextSerial.slice(0,2).join('.')));
    document.getElementById('areaDivisionText').textContent = division.value || '请选择作业区域划分';
    draftDevices = row ? saved?.cameras || A.get(row) : [];
    renderDraft();
  };
  division.addEventListener('change', () => { draftDevices = camerasForDivision(division.value); renderDraft(); });
  table.addEventListener('click', event => {
    const action = event.target.closest('span.cursor-pointer');
    if (!action || !['编辑','新增作业区域','新增下级'].includes(action.textContent.trim())) return;
    editMode = action.textContent.trim() === '编辑';
    contextRow = action.closest('tr');
    activeRow = editMode ? action.closest('tr') : null;
    editingId = activeRow ? rowKey(activeRow) : null;
    queueMicrotask(() => {
      load(activeRow); drawer.classList.remove('hidden');
      if (activeRow) document.getElementById('areaName').value = activeRow.cells[1].textContent.trim();
      ['areaOwner','areaOwnerPhone'].forEach(id => document.getElementById(id)?.parentElement.classList.add('hidden'));
    });
  }, true);
  const saveButton = document.getElementById('saveArea');
  saveButton.addEventListener('click', () => {
    const before = new Set([...table.rows]);
    const value = {...copy(draft),division:division.value,cameras:draftDevices.map(x => ({...x}))};
    const wasEdit = editMode, currentId = editingId;
    setTimeout(() => {
      if (!drawer.classList.contains('hidden')) return;
      const row = wasEdit ? [...table.rows].find(x => rowKey(x) === currentId) : [...table.rows].find(x => !before.has(x));
      if (!row) return;
      const next = {...assignments,[rowKey(row)]:value};
      try { localStorage.setItem(key,JSON.stringify(next)); } catch { drawer.classList.remove('hidden'); window.alert('保存失败，请检查浏览器存储后重试'); return; }
      assignments = next; row.dataset.areaDivision = value.division; A.set(row,value.cameras); renderRows(); A.refresh();
    },0);
  }, true);
  new MutationObserver(renderRows).observe(table,{childList:true});
  restore();

  const modal = document.createElement('div'); modal.className = 'area-owner-mask'; modal.hidden = true;
  modal.innerHTML = `<section role="dialog" aria-modal="true" aria-labelledby="areaOwnerPickerTitle" class="area-owner-dialog"><header><h2 id="areaOwnerPickerTitle">选择责任人</h2><button type="button" data-owner-close aria-label="关闭责任选择">×</button></header><div class="area-owner-body"><div class="area-owner-selected"><span>已选：</span><div id="areaOwnerTags"></div></div><div class="area-owner-toolbar"><span>选择部门和人员</span><input id="areaOwnerSearch" type="search" placeholder="输入姓名、岗位或手机号搜索" aria-label="搜索责任人"></div><div class="area-owner-layout"><aside><h3>组织架构</h3><input id="areaOwnerOrgSearch" type="search" placeholder="输入组织名称" aria-label="搜索组织"><div id="areaOwnerOrgTree"></div></aside><div class="area-owner-people-table"><div id="areaOwnerSelectionCount" class="area-owner-selection-count" role="status" aria-live="polite"></div><table><thead><tr><th><input type="checkbox" id="areaOwnerAll" aria-label="选择当前页人员"></th><th>序号</th><th>人员姓名</th><th>手机号</th><th>部门</th><th>岗位</th></tr></thead><tbody id="areaOwnerPeopleRows"></tbody></table><div class="area-owner-pagination"><span id="areaOwnerTotal"></span><button type="button" id="areaOwnerPrev" aria-label="上一页人员">‹</button><span id="areaOwnerPage"></span><button type="button" id="areaOwnerNext" aria-label="下一页人员">›</button></div></div></div></div><footer><button type="button" data-owner-close>取消</button><button type="button" id="areaOwnerConfirm" class="primary">确定</button></footer></section>`;
  document.body.appendChild(modal);
  let picker = copy(draft), org = '', page = 1, focusBefore = null;
  const search = document.getElementById('areaOwnerSearch'), orgSearch = document.getElementById('areaOwnerOrgSearch');
  const orgPeople = () => people.filter(person => {
    let department = D.departments.find(item => item.id === person.departmentId);
    while (department) { if (department.id === org) return true; department = D.departments.find(item => item.id === department.parentId); }
    return !org;
  });
  const filtered = () => orgPeople().filter(person => [person.name,person.post,person.phone,deptName(person.departmentId)].some(value => value.includes(search.value.trim())));
  const pageRows = () => filtered().slice((page-1)*5,page*5);
  const renderPicker = () => {
    const tags = picker.people.map(id=>({id,name:personName(id),kind:'person'}));
    document.getElementById('areaOwnerTags').innerHTML = tags.length ? tags.map(tag=>`<button type="button" class="area-owner-tag" data-remove-kind="${tag.kind}" data-remove-id="${tag.id}" aria-label="移除${esc(tag.name)}">${esc(tag.name)} <span aria-hidden="true">×</span></button>`).join('') : '<span class="area-owner-placeholder">请选择人员</span>';
    document.getElementById('areaOwnerOrgTree').innerHTML = `<button type="button" class="area-org-root" data-org="company"><i class="fa fa-building-o"></i> 深圳中外运物流有限公司</button><button type="button" class="area-org-group" data-org="pinghu">⌄ 平湖物流中心</button>` + departments.filter(dep=>dep.name.includes(orgSearch.value.trim())).map(dep=>`<div class="area-org-department ${org===dep.id?'active':''}"><button type="button" data-org="${dep.id}"><i class="fa fa-sitemap"></i> ${dep.name}</button></div>`).join('');
    const rows = pageRows(), total = filtered().length;
    const scopedPeople = orgPeople(), selectedCount = scopedPeople.filter(person => picker.people.includes(person.id)).length;
    document.getElementById('areaOwnerSelectionCount').textContent = `该部门责任人已选${selectedCount}人，未选${scopedPeople.length-selectedCount}人`;
    document.getElementById('areaOwnerPeopleRows').innerHTML = rows.length ? rows.map((person,i)=>`<tr><td><input type="checkbox" data-person="${person.id}" ${picker.people.includes(person.id)?'checked':''} aria-label="选择${person.name}"></td><td>${(page-1)*5+i+1}</td><td>${esc(person.name)}</td><td>${esc(person.phone || '—')}</td><td>${esc(deptName(person.departmentId))}</td><td>${esc(person.post)}</td></tr>`).join('') : '<tr><td colspan="6" class="area-owner-empty">暂无匹配人员</td></tr>';
    const all = document.getElementById('areaOwnerAll'); all.checked = !!rows.length && rows.every(person=>picker.people.includes(person.id)); all.indeterminate = !all.checked && rows.some(person=>picker.people.includes(person.id)); all.disabled = !rows.length;
    document.getElementById('areaOwnerTotal').textContent = `共 ${total} 条 · 5条/页`;
    document.getElementById('areaOwnerPage').textContent = `${page} / ${Math.max(1,Math.ceil(total/5))}`;
    document.getElementById('areaOwnerPrev').disabled = page<=1; document.getElementById('areaOwnerNext').disabled = page>=Math.ceil(total/5);
  };
  const closePicker = () => { modal.hidden = true; focusBefore?.focus(); };
  document.getElementById('openAreaResponsibility').onclick = () => { focusBefore=document.activeElement; picker=copy(draft); org='';page=1;search.value='';orgSearch.value='';modal.hidden=false;renderPicker();search.focus(); };
  modal.addEventListener('click', event => {
    if (event.target===modal || event.target.closest('[data-owner-close]')) { closePicker(); return; }
    const remove=event.target.closest('[data-remove-id]');
    if(remove){if(remove.dataset.removeKind==='department')picker.department='';else picker.people=picker.people.filter(id=>id!==remove.dataset.removeId);renderPicker();}
    const organization=event.target.closest('[data-org]');if(organization){org=organization.dataset.org;page=1;renderPicker();}
  });
  modal.addEventListener('change', event => {
    if(event.target.dataset.person){const id=event.target.dataset.person;picker.people=event.target.checked?[...new Set([...picker.people,id])]:picker.people.filter(value=>value!==id);renderPicker();}
  });
  document.getElementById('areaOwnerAll').onchange = event => { const ids=pageRows().map(person=>person.id);picker.people=event.target.checked?[...new Set([...picker.people,...ids])]:picker.people.filter(id=>!ids.includes(id));renderPicker(); };
  [search,orgSearch].forEach(input=>input.oninput=()=>{page=1;renderPicker();});
  document.getElementById('areaOwnerPrev').onclick=()=>{page--;renderPicker();};document.getElementById('areaOwnerNext').onclick=()=>{page++;renderPicker();};
  document.getElementById('areaOwnerConfirm').onclick=()=>{draft=copy(picker);renderDraft();closePicker();};
  modal.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closePicker();}if(event.key==='Tab'){const focusable=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
})();
