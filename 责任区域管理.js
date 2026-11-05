(() => {
  const {createApp,ref,computed,watch,h}=Vue, D=window.ResponsibilityData;
  const copy=v=>JSON.parse(JSON.stringify(v));
  const ProdEmptyState={props:{description:{default:'暂无关联范围'},hint:{default:''}},template:`<div class="ra-empty" role="status"><svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="60" cy="71" rx="48" ry="6" fill="#eef6ff"/><path d="M24 23h29l8 9h35v35H24z" fill="#eef6ff" stroke="#cfe1ff"/><path d="M28 14h49l13 13v31H28z" fill="white" stroke="#d8e2ef"/><path d="M77 14v13h13M40 36h36M40 45h25" fill="none" stroke="#cfe1ff" stroke-width="3"/><path d="M20 40h80l-8 29H28z" fill="#eef6ff" stroke="#cfe1ff"/></svg><p>{{description}}</p><small v-if="hint">{{hint}}</small></div>`};
  createApp({components:{ProdEmptyState},setup(){
    let loadError='';
    const load=()=>{try{
      const raw=localStorage.getItem(D.key);if(!raw)return D.initial();
      const value=JSON.parse(raw);if(![1,2,3].includes(value.version)||!value.departments||!value.people)throw Error();
      const defaults=D.initial();
      const next={...defaults,...value,version:3,departments:{...defaults.departments,...value.departments},people:{...defaults.people,...value.people}};
      if(value.version<3){
        next.departments.safety=copy(defaults.departments.safety);
        next.people['person-1']=copy(defaults.people['person-1']);
        next.people['person-2']=copy(defaults.people['person-2']);
        try{localStorage.setItem(D.key,JSON.stringify(next));}catch{loadError='示例数据已更新，但浏览器存储不可用；请在恢复后保存配置。';}
      }
      return next;
    }catch{loadError='已保存的配置无法读取，本次显示初始配置；保存成功后将替换原配置。';return D.initial();}};
    const state=ref(load()),selected=ref(['safety']),orgKeyword=ref(''),keyword=ref(''),page=ref(1),pageSize=ref(10),toast=ref(loadError),toastType=ref(loadError?'warning':'success');
    let toastTimer;
    const notify=(message,type='success')=>{clearTimeout(toastTimer);toast.value=message;toastType.value=type;toastTimer=setTimeout(()=>toast.value='',4500);};
    const org=computed(()=>D.departments.find(o=>o.id===selected.value[0])||D.departments[1]);
    const makeOrgTree=parent=>D.departments.filter(d=>d.parentId===parent).map(d=>({key:d.id,label:d.name,prefix:()=>h('span',{class:'ra-org-type-icon '+(d.type==='department'?'department':'business'),title:d.type==='department'?'部门':'业务单位','aria-label':d.type==='department'?'部门':'业务单位'},d.type==='department'?'部':'业'),children:makeOrgTree(d.id)}));const orgTree=makeOrgTree(undefined);
    const deptName=id=>D.departments.find(d=>d.id===id)?.name||'—';
    const containsDept=(parent,id)=>parent===id||D.departments.some(d=>d.id===id&&d.parentId&&containsDept(parent,d.parentId));
    const selectedOrg=keys=>{if(keys.length)selected.value=keys;};
    const scopeOfDept=id=>state.value.departments[id]||D.blank();
    const currentScope=computed(()=>{if(org.value.type==='department')return scopeOfDept(org.value.id);const scopes=D.departments.filter(d=>d.type==='department'&&containsDept(org.value.id,d.id)).map(d=>scopeOfDept(d.id));return Object.fromEntries(['places','devices','videos'].map(key=>[key,[...new Set(scopes.flatMap(s=>s[key]||[]))]]));});
    const currentResolved=computed(()=>D.resolve(currentScope.value));
    const metricDefs=[{key:'buildings',label:'楼栋',unit:'栋',icon:'fa-building-o'},{key:'floors',label:'楼层',unit:'层',icon:'fa-bars'},{key:'areas',label:'区域',unit:'个',icon:'fa-map-o'},{key:'videos',label:'视频',unit:'路',icon:'fa-video-camera'}];
    const metrics=computed(()=>metricDefs.map(m=>({...m,count:currentResolved.value[m.key].length})));
    const personConfig=p=>state.value.people[p.id]||{mode:'department',scope:D.blank()};
    const personScope=p=>personConfig(p).mode==='personal'?personConfig(p).scope:scopeOfDept(p.departmentId);
    const summary=s=>{const r=D.resolve(s);return metricDefs.filter(m=>r[m.key].length).map(m=>r[m.key].length+' '+m.unit+m.label).join(' · ')||'暂无关联范围';};
    const scopeTags=s=>{
      const leafIds=new Set((s.places||[]).flatMap(D.descendants));
      const tags=[],remaining=new Set(leafIds);
      D.buildings.forEach(b=>{const ids=D.descendants(b.id);if(ids.length&&ids.every(id=>remaining.has(id))){tags.push(b.name+'（全部）');ids.forEach(id=>remaining.delete(id));}});
      D.floors.forEach(f=>{const ids=D.descendants(f.id);if(ids.length&&ids.every(id=>remaining.has(id))){const b=D.buildings.find(b=>b.id===f.buildingId);tags.push(b.name+' / '+f.name+'（全部）');ids.forEach(id=>remaining.delete(id));}});
      remaining.forEach(id=>tags.push(D.path(id)));
      (s.videos||[]).forEach(id=>{const v=D.videos.find(v=>v.id===id);if(v&&!leafIds.has(v.areaId))tags.push('视频 · '+v.name);});
      return tags;
    };
    const rangeRows=scope=>{
      const resolved=D.resolve(scope),selectedAreas=new Set(resolved.areas),videoIds=new Set(resolved.videos);
      return D.floors.flatMap(f=>{
        const all=D.areas.filter(a=>a.floorId===f.id),chosen=all.filter(a=>selectedAreas.has(a.id));
        const videos=D.videos.filter(v=>videoIds.has(v.id)&&all.some(a=>a.id===v.areaId));
        if(!chosen.length&&!videos.length)return [];
        return [{id:f.id,building:D.buildings.find(b=>b.id===f.buildingId)?.name||'—',floor:f.name,areas:chosen.length===all.length?'全部区域':chosen.map(a=>a.name).join('、')||'仅单独关联视频',videos,extra:videos.filter(v=>!selectedAreas.has(v.areaId)).length}];
      });
    };
    const departmentRows=computed(()=>rangeRows(currentScope.value));
    const scopeBrief=scope=>{const r=D.resolve(scope);return r.buildings.length+' 个场所 · '+r.floors.length+' 个楼层 · '+r.videos.length+' 路视频';};
    const detailShow=ref(false),detailPerson=ref(null),videoShow=ref(false),videoRow=ref(null);
    const detailScope=computed(()=>detailPerson.value?personScope(detailPerson.value):D.blank());
    const detailRows=computed(()=>rangeRows(detailScope.value));
    const viewPerson=p=>{detailPerson.value=p;detailShow.value=true;};
    const viewVideos=row=>{videoRow.value=row;videoShow.value=true;};
    const people=computed(()=>{const q=keyword.value.trim().toLowerCase();return D.people.filter(p=>containsDept(org.value.id,p.departmentId)&&[p.name,p.phone,p.post,D.departments.find(d=>d.id===p.departmentId)?.name].join(' ').toLowerCase().includes(q));});
    const visible=computed(()=>people.value.slice((page.value-1)*pageSize.value,page.value*pageSize.value));
    watch([selected,keyword,pageSize],()=>page.value=1);
    const drawer=ref(false),target=ref(null),mode=ref('department'),draft=ref(D.blank()),error=ref(''),placeKeyword=ref(''),expanded=ref(['warehouse-1','warehouse-1-f1']),dirtyConfirm=ref(false);
    let openedSnapshot='';
    const formSnapshot=()=>JSON.stringify({mode:mode.value,scope:draft.value});
    const open=(person=null)=>{
      target.value=person;mode.value=person?personConfig(person).mode:'department';
      draft.value=copy(person?(personConfig(person).scope||D.blank()):currentScope.value);
      error.value='';placeKeyword.value='';openedSnapshot=formSnapshot();drawer.value=true;
    };
    const close=()=>{if(formSnapshot()!==openedSnapshot){dirtyConfirm.value=true;return;}drawer.value=false;};
    const inherited=computed(()=>target.value?scopeOfDept(target.value.departmentId):currentScope.value);
    const effectiveDraft=computed(()=>target.value&&mode.value==='department'?inherited.value:draft.value);
    const draftResolved=computed(()=>D.resolve(effectiveDraft.value));
    const draftStats=computed(()=>metricDefs.map(m=>({...m,count:draftResolved.value[m.key].length})));
    const changeMode=value=>{mode.value=value;error.value='';};
    const save=()=>{
      error.value='';
      if((!target.value||mode.value==='personal')&&!draft.value.places.length){error.value='请至少关联一个楼栋、楼层或区域';return;}
      const next=copy(state.value);
      if(target.value)next.people[target.value.id]={mode:mode.value,scope:copy(draft.value)};
      else next.departments[org.value.id]=copy(draft.value);
      try{localStorage.setItem(D.key,JSON.stringify(next));state.value=next;drawer.value=false;notify('管辖范围已保存');}catch{error.value='保存失败，浏览器存储不可用或空间不足，请重试';}
    };
    const picker=ref(false),pickerType=ref('videos'),pickerKeyword=ref(''),pickerArea=ref(null),pickerChecked=ref([]),pickerPage=ref(1);
    const pickerItems=computed(()=>D[pickerType.value]);
    const implicitIds=computed(()=>D.resolve({...draft.value,devices:[],videos:[]})[pickerType.value]);
    const filteredAssets=computed(()=>{const q=pickerKeyword.value.trim().toLowerCase();return pickerItems.value.filter(i=>(!pickerArea.value||i.areaId===pickerArea.value)&&[i.name,i.code,D.path(i.areaId)].join(' ').toLowerCase().includes(q));});
    const visibleAssets=computed(()=>filteredAssets.value.slice((pickerPage.value-1)*10,pickerPage.value*10));
    const pickerCount=computed(()=>new Set([...implicitIds.value,...pickerChecked.value]).size);
    const areaOptions=D.areas.map(a=>({label:D.path(a.id),value:a.id}));
    const openPicker=type=>{pickerType.value=type;pickerKeyword.value='';pickerArea.value=null;pickerPage.value=1;pickerChecked.value=[...draft.value[type]];picker.value=true;};
    const setAsset=(id,checked)=>{const next=new Set(pickerChecked.value);checked?next.add(id):next.delete(id);pickerChecked.value=[...next];};
    const selectableVisible=computed(()=>visibleAssets.value.filter(i=>!implicitIds.value.includes(i.id)));
    const allVisible=computed(()=>selectableVisible.value.length>0&&selectableVisible.value.every(i=>pickerChecked.value.includes(i.id)));
    const someVisible=computed(()=>!allVisible.value&&selectableVisible.value.some(i=>pickerChecked.value.includes(i.id)));
    const toggleVisible=checked=>{const next=new Set(pickerChecked.value);selectableVisible.value.forEach(i=>checked?next.add(i.id):next.delete(i.id));pickerChecked.value=[...next];};
    const confirmPicker=()=>{draft.value[pickerType.value]=[...pickerChecked.value];picker.value=false;};
    watch([pickerKeyword,pickerArea],()=>pickerPage.value=1);
    const I=window.ResponsibilityImport;
    const importShow=ref(false),importType=ref('department'),importStrategy=ref('merge'),importResult=ref(null),importFileName=ref(''),importBusy=ref(false),importError=ref(''),importPage=ref(1),importErrorsOnly=ref(false);
    let importToken=0;
    const resetImport=()=>{importToken++;importResult.value=null;importFileName.value='';importError.value='';importPage.value=1;importErrorsOnly.value=false;importBusy.value=false;};
    const openImport=type=>{resetImport();importType.value=type;importStrategy.value='merge';importShow.value=true;};
    const changeImportType=type=>{resetImport();importType.value=type;};
    const closeImport=()=>{resetImport();importShow.value=false;};
    const readImport=async ({file})=>{
      if(!file?.file)return;resetImport();const token=importToken;const type=importType.value;
      importFileName.value=file.name;importBusy.value=true;
      try{const matrix=await I.read(file.file);if(token!==importToken)return;importResult.value=I.plan(matrix,type);}
      catch(e){if(token===importToken)importError.value=e.message||'文件读取失败，请检查文件格式';}
      finally{if(token===importToken)importBusy.value=false;}
    };
    const importPreviewRows=computed(()=>{const rows=importResult.value?.rows||[];return importErrorsOnly.value?rows.filter(r=>r.errors.length):rows;});
    const importVisibleRows=computed(()=>importPreviewRows.value.slice((importPage.value-1)*10,importPage.value*10));
    watch(importErrorsOnly,()=>importPage.value=1);
    const commitImport=()=>{
      try{const result=importResult.value;if(!result||importBusy.value) return;
        const next=I.apply(state.value,result,importStrategy.value);localStorage.setItem(D.key,JSON.stringify(next));state.value=next;
        const count=result.groups.length;closeImport();page.value=1;notify('已成功导入 '+count+' 个对象的管辖范围');
      }catch(e){importError.value=e.message==='请先修正全部错误再导入'?e.message:'导入未保存：'+(e.message||'浏览器存储不可用，请重试');}
    };
    const downloadImportErrors=()=>{if(!importResult.value)return;I.download('管辖导入错误明细.csv',[['文件行号','部门名称','人员姓名','管辖方式','楼栋/场所','楼层','区域','错误原因'],...importResult.value.rows.filter(r=>r.errors.length).map(r=>[r.line,r.department,r.name,r.mode,r.building,r.floor,r.area,r.errors.join('；')])]);};
    const theme={common:{primaryColor:'#0879ff',primaryColorHover:'#3d8fff',primaryColorPressed:'#065fd4',textColorBase:'#24344d',fontSize:'14px',fontWeightStrong:'400',borderRadius:'8px'},Button:{heightMedium:'36px',heightSmall:'30px',borderRadiusMedium:'8px',borderRadiusSmall:'6px',fontWeight:'400'},Input:{heightMedium:'36px',border:'1px solid #d8e2ef'},Select:{peers:{InternalSelection:{heightMedium:'36px',borderRadius:'8px',border:'1px solid #d8e2ef'}}}};
    return {I,importShow,importType,importStrategy,importResult,importFileName,importBusy,importError,importPage,importErrorsOnly,importPreviewRows,importVisibleRows,openImport,changeImportType,closeImport,readImport,commitImport,downloadImportErrors,rangeRows,departmentRows,scopeBrief,detailShow,detailPerson,detailScope,detailRows,videoShow,videoRow,viewPerson,viewVideos,D,deptName,org,orgTree,selected,selectedOrg,orgKeyword,keyword,page,pageSize,metrics,currentScope,currentResolved,scopeTags,people,visible,personConfig,personScope,summary,drawer,target,mode,draft,error,placeKeyword,expanded,dirtyConfirm,open,close,save,changeMode,inherited,effectiveDraft,draftStats,picker,pickerType,pickerKeyword,pickerArea,pickerChecked,pickerPage,visibleAssets,filteredAssets,implicitIds,pickerCount,areaOptions,openPicker,setAsset,allVisible,someVisible,selectableVisible,toggleVisible,confirmPicker,theme,toast,toastType};
  },template:`
  <n-config-provider :theme-overrides="theme">
    <n-alert v-if="toast" class="ra-toast" :type="toastType" closable @close="toast=''">{{toast}}</n-alert>
    <div class="ra-shell">
      <aside class="ra-panel ra-org" aria-label="所属组织">
        <div class="ra-org-title"><i class="fa fa-sitemap" aria-hidden="true"></i>所属组织</div>
        <n-input v-model:value="orgKeyword" clearable placeholder="搜索组织或部门" aria-label="搜索组织或部门"><template #prefix><i class="fa fa-search" aria-hidden="true"></i></template></n-input>
        <div class="ra-org-tree"><n-tree :data="orgTree" :pattern="orgKeyword" :selected-keys="selected" @update:selected-keys="selectedOrg" default-expand-all block-line :cancelable="false" /></div>
        <div class="ra-org-count">{{D.departments.length}} 个组织节点 · {{D.people.length}} 名人员</div>
      </aside>
      <main class="ra-panel ra-main">
        <div class="ra-main-toolbar"><n-button class="hz-soft-btn" aria-label="导入部门/人员管辖" @click="openImport('department')">导入部门/人员管辖</n-button></div>
        <section class="prod-surface-card ra-summary">
          <div class="ra-section-head"><div><h2 class="ra-section-title">部门管辖</h2><p class="ra-subtitle">{{org.name}} · {{org.type!=='department'?'下属部门管辖汇总':'已关联范围'}}</p></div><n-button class="hz-primary-btn" :disabled="org.type!=='department'" @click="open()"><template #icon><i class="fa fa-pencil-square-o" aria-hidden="true"></i></template>编辑管辖范围</n-button></div>
          <p class="ra-subtitle">{{scopeBrief(currentScope)}}</p>
          <div class="ra-department-scroll"><table class="ra-table"><thead><tr><th>楼栋 / 场所</th><th>楼层</th><th>管辖区域</th><th>关联视频</th><th>操作</th></tr></thead><tbody><tr v-for="row in departmentRows" :key="row.id"><td>{{row.building}}</td><td>{{row.floor}}</td><td>{{row.areas}}<div v-if="row.extra" class="ra-secondary">另关联区域外视频 {{row.extra}} 路</div></td><td>{{row.videos.length}} 路</td><td><n-button class="prod-row-action" size="small" :disabled="!row.videos.length" @click="viewVideos(row)">查看视频</n-button></td></tr></tbody></table><prod-empty-state v-if="!departmentRows.length" description="暂无关联范围" /></div>
        </section>
        <section class="prod-surface-card ra-people">
          <div class="ra-people-head"><h2 class="ra-section-title">人员列表</h2><n-input v-model:value="keyword" class="ra-search" clearable placeholder="搜索姓名、岗位、部门或手机号" aria-label="搜索人员"><template #prefix><i class="fa fa-search" aria-hidden="true"></i></template></n-input></div>
          <div class="ra-table-scroll"><table class="ra-table"><thead><tr><th>人员</th><th>部门 / 岗位</th><th>已关联范围</th><th>操作</th></tr></thead><tbody><tr v-for="p in visible" :key="p.id"><td><div class="ra-person"><span class="ra-avatar">{{p.name.slice(-2)}}</span><div>{{p.name}}<div class="ra-secondary">{{p.phone}}</div></div></div></td><td>{{deptName(p.departmentId)}}<div class="ra-secondary">{{p.post}}</div></td><td><span :class="['ra-mode',{personal:personConfig(p).mode==='personal'}]">{{personConfig(p).mode==='personal'?'独立配置':'跟随部门'}}</span><div class="ra-range-text">{{personConfig(p).mode==='personal'?scopeTags(personScope(p)).join('；')||'暂无关联范围':'与部门一致'}}</div></td><td><n-space :wrap="false" :size="8"><n-button class="prod-row-action" size="small" @click="viewPerson(p)">查看范围</n-button><n-button class="prod-row-action" size="small" @click="open(p)" :aria-label="'编辑'+p.name+'的管辖范围'">编辑管辖范围</n-button></n-space></td></tr></tbody></table><prod-empty-state v-if="!people.length" description="暂无符合条件的人员" hint="请调整搜索关键词或切换组织" /></div>
          <div class="ra-pagination"><span>共 {{people.length}} 人</span><n-pagination v-model:page="page" v-model:page-size="pageSize" :item-count="people.length" :page-sizes="[5,10,20]" show-size-picker /></div>
        </section>
      </main>
    </div>
    <n-drawer :show="drawer" @update:show="value=>{if(!value)close()}" width="min(720px, 100vw)" class="ra-drawer ra-scope-editor" :mask-closable="false" :close-on-esc="false">
      <n-drawer-content title="编辑管辖范围" closable @close="close" :native-scrollbar="false">
        <div class="ra-form-section"><h3 class="ra-form-title">{{target?'人员信息':'部门信息'}}</h3><div>{{target?target.name:org.name}}<span class="ra-secondary" v-if="target"> · {{deptName(target.departmentId)}} / {{target.post}}</span></div></div>
        <section v-if="target" class="ra-form-section"><h3 class="ra-form-title">管辖方式</h3><n-radio-group :value="mode" @update:value="changeMode" name="scopeMode" class="ra-mode-options"><div :class="['ra-mode-card',{active:mode==='department'}]"><n-radio value="department">按部门</n-radio><p>与所属部门的管辖范围一致</p></div><div :class="['ra-mode-card',{active:mode==='personal'}]"><n-radio value="personal">按个人</n-radio><p>单独设置该人员的管辖范围</p></div></n-radio-group></section>
        <section v-if="target&&mode==='department'" class="ra-form-section"><h3 class="ra-form-title">继承部门范围</h3><div class="ra-inherited"><div>{{deptName(target.departmentId)}}</div><div class="ra-secondary">{{summary(inherited)}}</div><div v-if="scopeTags(inherited).length" class="ra-scope-preview"><span v-for="tag in scopeTags(inherited)" class="ra-chip" :key="tag">{{tag}}</span></div><prod-empty-state v-else description="所属部门尚未关联范围" /></div></section>
        <template v-else>
          <section class="ra-form-section"><h3 class="ra-form-title">关联楼栋、楼层、区域<span class="ra-required">*</span></h3><n-input v-model:value="placeKeyword" clearable placeholder="搜索楼栋、楼层或区域" aria-label="搜索管辖区域" /><div class="ra-selection-head"><span>已选择 {{D.resolve(draft).areas.length}} 个区域</span><n-button text type="primary" @click="draft.places=[]">清空选择</n-button></div><div class="ra-place-tree"><n-tree :data="D.tree" :pattern="placeKeyword" checkable cascade check-strategy="child" v-model:checked-keys="draft.places" v-model:expanded-keys="expanded" block-line /></div></section>
          <section class="ra-form-section"><h3 class="ra-form-title">关联视频</h3><div class="ra-associations"><div class="ra-association"><div><i class="fa fa-video-camera" aria-hidden="true"></i>视频<div class="ra-secondary">已关联 {{D.resolve(draft).videos.length}} 路</div></div><n-button class="hz-soft-btn" @click="openPicker('videos')">关联视频</n-button></div></div></section>
        </template>
        <section class="ra-form-section"><h3 class="ra-form-title">管辖范围汇总</h3><div class="ra-form-stats"><span v-for="m in draftStats" :key="m.key">{{m.label}}<b>{{m.count}}</b>{{m.unit}}</span></div></section>
        <n-alert v-if="error" type="error" class="ra-error" role="alert">{{error}}</n-alert>
        <template #footer><n-space><n-button class="hz-soft-btn" @click="close">取消</n-button><n-button class="hz-primary-btn" @click="save">保存</n-button></n-space></template>
      </n-drawer-content>
    </n-drawer>
    <n-modal v-model:show="picker" preset="card" title="关联视频" class="ra-picker" :mask-closable="false" :close-on-esc="false">
      <div class="ra-picker-filters"><n-input v-model:value="pickerKeyword" clearable placeholder="搜索视频名称或编号" aria-label="搜索关联对象" /><n-select v-model:value="pickerArea" :options="areaOptions" filterable clearable placeholder="全部区域" aria-label="筛选关联区域" to="body" consistent-menu-width style="min-width:220px" /></div>
      <div class="ra-selection-head" style="margin-bottom:12px"><n-checkbox :checked="allVisible" :indeterminate="someVisible" :disabled="!selectableVisible.length" @update:checked="toggleVisible">本页全选</n-checkbox><span>已关联 {{pickerCount}} 路视频</span></div>
      <div class="ra-picker-list"><div v-for="asset in visibleAssets" :key="asset.id" class="ra-picker-row"><n-checkbox :checked="implicitIds.includes(asset.id)||pickerChecked.includes(asset.id)" :disabled="implicitIds.includes(asset.id)" @update:checked="v=>setAsset(asset.id,v)"><div>{{asset.name}}<div class="ra-secondary">{{asset.code}} · {{D.path(asset.areaId)}}</div></div></n-checkbox><span v-if="implicitIds.includes(asset.id)" class="ra-mode">随区域关联</span></div><prod-empty-state v-if="!filteredAssets.length" description="暂无符合条件的记录" hint="请调整搜索关键词或区域" /></div>
      <div class="ra-picker-footer"><span class="ra-secondary">共 {{filteredAssets.length}} 条</span><n-pagination v-model:page="pickerPage" :page-size="10" :item-count="filteredAssets.length" :page-slot="5" /></div>
      <template #footer><n-space justify="center"><n-button class="hz-soft-btn" @click="picker=false">取消</n-button><n-button class="hz-primary-btn" @click="confirmPicker">确认关联</n-button></n-space></template>
    </n-modal>
    <n-modal v-model:show="detailShow" preset="card" :title="(detailPerson?.name||'')+' · 管辖范围'" class="ra-picker">
      <p class="ra-secondary" v-if="detailPerson">{{deptName(detailPerson.departmentId)}} / {{detailPerson.post}} · {{personConfig(detailPerson).mode==='personal'?'独立配置':'跟随部门 · 与部门一致'}}</p>
      <div class="ra-detail-scroll"><table class="ra-table"><thead><tr><th>楼栋 / 场所</th><th>楼层</th><th>管辖区域</th><th>关联视频</th><th>操作</th></tr></thead><tbody><tr v-for="row in detailRows" :key="row.id"><td>{{row.building}}</td><td>{{row.floor}}</td><td>{{row.areas}}<div v-if="row.extra" class="ra-secondary">另关联区域外视频 {{row.extra}} 路</div></td><td>{{row.videos.length}} 路</td><td><n-button class="prod-row-action" size="small" :disabled="!row.videos.length" @click="viewVideos(row)">查看视频</n-button></td></tr></tbody></table><prod-empty-state v-if="!detailRows.length" description="暂无关联范围" /></div>
      <template #footer><n-space justify="center"><n-button class="hz-soft-btn" @click="detailShow=false">关闭</n-button></n-space></template>
    </n-modal>
    <n-modal v-model:show="videoShow" preset="card" title="关联视频明细" class="ra-picker">
      <p class="ra-secondary" v-if="videoRow">{{videoRow.building}} / {{videoRow.floor}} · 共 {{videoRow.videos.length}} 路视频</p>
      <div class="ra-detail-scroll"><table class="ra-table"><thead><tr><th>视频名称</th><th>编号</th><th>所属区域</th></tr></thead><tbody><tr v-for="video in videoRow?.videos||[]" :key="video.id"><td>{{video.name}}</td><td>{{video.code}}</td><td>{{D.path(video.areaId)}}</td></tr></tbody></table></div>
      <template #footer><n-space justify="center"><n-button class="hz-soft-btn" @click="videoShow=false">关闭</n-button></n-space></template>
    </n-modal>
    <n-drawer :show="importShow" @update:show="v=>{if(!v)closeImport()}" width="min(1000px, 100vw)" class="ra-drawer" :mask-closable="false" :close-on-esc="false">
      <n-drawer-content title="导入管辖范围" closable @close="closeImport" :native-scrollbar="false">
        <section class="ra-form-section"><h3 class="ra-form-title">导入类型</h3><n-radio-group :value="importType" @update:value="changeImportType" name="importType"><n-space><n-radio value="department">部门管辖</n-radio><n-radio value="person">人员管辖</n-radio></n-space></n-radio-group></section>
        <section class="ra-form-section"><h3 class="ra-form-title">准备数据</h3><n-space><n-button class="hz-soft-btn" @click="I.template(importType)">下载导入模板</n-button><n-button class="hz-soft-btn" @click="I.directory()">下载档案名称对照表</n-button></n-space>
          <p class="ra-secondary">按照已有部门、人员和楼栋 / 楼层 / 区域名称填写。每行填写一个范围，同一对象的多行范围合并去重；空白楼层代表整栋，空白区域代表整层。多个区域可用顿号分隔。</p>
          <p v-if="importType==='person'" class="ra-secondary">人员模板按楼栋 / 场所、楼层、区域、人员姓名、手机号码填写，导入范围按人员独立配置。人员按姓名和手机号码匹配，所属部门自动识别；同名人员请填写手机号。</p>
          <p class="ra-secondary">支持 XLSX、XLS、CSV，最大 5 MB、2000 行。Excel 读取第一个工作表，第一行为表头；请勿合并单元格。匹配区域后自动关联视频。</p>
        </section>
        <section class="ra-form-section"><h3 class="ra-form-title">选择文件</h3><n-upload accept=".xlsx,.xls,.csv" :default-upload="false" :show-file-list="false" :disabled="importBusy" @change="readImport"><n-button class="hz-soft-btn" :loading="importBusy">{{importBusy?'正在读取…':'选择文件'}}</n-button></n-upload><p v-if="importFileName" class="ra-secondary">{{importFileName}}</p></section>
        <section class="ra-form-section"><h3 class="ra-form-title">导入方式</h3><n-radio-group v-model:value="importStrategy" name="importStrategy"><n-space><n-radio value="merge">追加到现有范围</n-radio><n-radio value="replace">替换导入对象的范围</n-radio></n-space></n-radio-group><p class="ra-secondary">{{importStrategy==='merge'?'保留已有范围，合并本次范围；人员设为跟随部门时改为继承所属部门。':'仅替换文件中涉及对象的完整范围，包括其单独关联的视频；其他对象保持原配置。'}}部门范围变更后，跟随部门的人员同步更新。</p></section>
        <n-alert v-if="importError" type="error" class="ra-form-section">{{importError}}</n-alert>
        <section v-if="importResult" class="ra-form-section"><h3 class="ra-form-title">校验预览</h3><n-alert :type="importResult.errors?'error':'success'" class="ra-form-section">共 {{importResult.rows.length}} 行、{{importResult.groups.length}} 个对象，{{importResult.errors}} 行存在错误。{{importResult.errors?'请修正后重新选择文件，全部通过后才能导入。':'校验通过，确认导入后生效。'}}</n-alert><n-space justify="space-between" class="ra-form-section"><n-checkbox v-model:checked="importErrorsOnly">只看错误行</n-checkbox><n-button v-if="importResult.errors" class="hz-soft-btn" @click="downloadImportErrors">下载错误明细</n-button></n-space>
          <div class="ra-import-scroll"><table class="ra-table"><thead><tr><th>文件行号</th><th>部门 / 人员</th><th>管辖方式</th><th>楼栋 / 楼层 / 区域</th><th>校验结果</th></tr></thead><tbody><tr v-for="r in importVisibleRows" :key="r.line"><td>{{r.line}}</td><td>{{r.department}}<div v-if="importType==='person'" class="ra-secondary">{{r.name}} {{r.phone}}</div></td><td>{{r.mode}}</td><td>{{r.modeValue==='department'?'与所属部门一致':[r.building,r.floor||'全部楼层',r.area||'全部区域'].join(' / ')}}</td><td><span v-if="!r.errors.length" class="ra-import-valid">通过</span><span v-else class="ra-import-invalid">{{r.errors.join('；')}}</span></td></tr></tbody></table><prod-empty-state v-if="!importPreviewRows.length" description="暂无错误行" /></div><div class="ra-pagination"><span>共 {{importPreviewRows.length}} 行</span><n-pagination v-model:page="importPage" :page-size="10" :item-count="importPreviewRows.length" :page-slot="5" /></div>
        </section>
        <template #footer><n-space><n-button class="hz-soft-btn" @click="closeImport">取消</n-button><n-button class="hz-primary-btn" :disabled="!importResult||!!importResult.errors||importBusy" @click="commitImport">确认导入</n-button></n-space></template>
      </n-drawer-content>
    </n-drawer>
    <n-modal v-model:show="dirtyConfirm" preset="dialog" type="warning" title="放弃本次修改？" content="尚未保存的管辖范围修改将不会生效。" positive-text="放弃修改" negative-text="继续编辑" @positive-click="()=>{dirtyConfirm=false;drawer=false}" @negative-click="dirtyConfirm=false" />
  </n-config-provider>`}).use(naive).mount('#responsibilityApp');
})();

