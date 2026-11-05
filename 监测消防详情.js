(() => {
 window.MonitorFireDetail={props:{record:{type:Object,required:true}},components:{NTimeline:naive.NTimeline,NTimelineItem:naive.NTimelineItem,NEmpty:naive.NEmpty},setup(props){
  const {ref,computed,watch,onMounted,onBeforeUnmount}=Vue;
  const detailTab=ref('details'),photoPreview=ref(null);
  const read=key=>{try{return JSON.parse(localStorage.getItem(key))||{};}catch{return {};}};
  const storedCalls=ref(read('alarm-case-phone-interventions-v1')),storedDisposals=ref(read('alarm-case-disposals-v1'));
  const refresh=()=>{storedCalls.value=read('alarm-case-phone-interventions-v1');storedDisposals.value=read('alarm-case-disposals-v1');};
  onMounted(()=>{window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);});
  onBeforeUnmount(()=>{window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh);});
  const isFire=r=>window.AlarmSourceRules.isFire(r);
  const active=computed(()=>({...props.record,caseStatus:props.record.caseStatus||props.record.phase||window.AlarmSourceRules.fireStatus(props.record)}));
  const stageCalls=()=>fireInterventions.value;
 const areaPath=r=>{
  const d=window.ResponsibilityData;
  if(!d)return r.area||'—';
  const asset=[...d.videos,...d.devices].find(item=>item.id===r.deviceId);
  // Match the warehouse fire-host placement used by the monitoring map.
  const buildingId=String(r.deviceId||'').startsWith('fire-')?r.deviceId.slice(5):null;
  const floor=d.floors.find(item=>item.buildingId===buildingId);
  const areaId=r.areaId||asset?.areaId||(floor&&d.areas.find(item=>item.floorId===floor.id)?.id);
  return (areaId&&d.path(areaId))||[r.buildingName,r.floorName,r.area].filter(Boolean).join(' / ')||'—';
 };
  const fireDetail=computed(()=>{
   const r=props.record;if(!r||!isFire(r))return {};
   const device=window.ResponsibilityData?.devices.find(d=>d.id===r.deviceId)||{};
   const result=r.fireDisposal||storedDisposals.value[r.id]||{};
   return {first:r.firstReceivedAt||r.time,last:r.lastReceivedAt||r.time,
    building:r.buildingName||areaPath(r).split(' / ')[0],imei:r.imei||device.imei||'—',
    system:r.systemType||device.systemType||'—',deviceType:r.deviceType||device.deviceType||'—',
    model:r.brandModel||device.brandModel||'—',installed:r.installedAt||device.installedAt||'—',
    result:result.verificationResult||r.verificationResult||'—',description:result.description||result.note||'—',
    person:result.person||'—',phone:result.phone||r.disposalPhone||'—',completed:result.time||r.statusUpdatedAt||r.updatedAt||'—',photos:result.evidence||[]};
  });
  const fireInterventions=computed(()=>(storedCalls.value[props.record?.id]||[]).slice().sort((a,b)=>(b.time||'').localeCompare(a.time||'')));
  const firePrivate=ref(false);
  watch(()=>props.record.id,()=>{detailTab.value='details';firePrivate.value=false;photoPreview.value=null;refresh();});
  return {active,detailTab,photoPreview,fireDetail,firePrivate,fireInterventions,stageCalls,areaPath};
 },template:` <div class="map-fire-detail">
 <div class="fire-detail-tabs" role="tablist" aria-label="消防报警详情"><button role="tab" :aria-selected="detailTab==='details'" :class="{active:detailTab==='details'}" @click="detailTab='details'">预警信息</button><button role="tab" :aria-selected="detailTab==='records'" :class="{active:detailTab==='records'}" @click="detailTab='records'">处置记录</button></div>
 <div v-if="detailTab==='details'" role="tabpanel">
 <details class="fire-detail-card" open><summary>预警信息 | 处置等级：{{active.level||'—'}}</summary><div class="fire-warning"><div class="fire-warning-name">{{active.type}}</div><dl class="fire-fields"><dt>报警ID：</dt><dd>{{active.id}}</dd><dt>首次接收时间：</dt><dd>{{fireDetail.first}}</dd><dt>末次接收时间：</dt><dd>{{fireDetail.last}}</dd></dl></div></details>
 <details class="fire-detail-card" open><summary>设备信息</summary><dl class="fire-fields"><dt>楼宇名称：</dt><dd>{{fireDetail.building}}</dd><dt>IMEI：</dt><dd>{{fireDetail.imei}}</dd><dt>系统类型：</dt><dd>{{fireDetail.system}}</dd><dt>设备类型：</dt><dd>{{fireDetail.deviceType}}</dd><dt>设备位置：</dt><dd>{{areaPath(active)}}</dd><dt>品牌型号：</dt><dd>{{fireDetail.model}}</dd><dt>安装日期：</dt><dd>{{fireDetail.installed}}</dd></dl></details>

 <details class="fire-detail-card" open><summary>催促记录</summary><n-empty description="暂无催促记录" size="large" class="fire-empty" /></details>
 </div>
 <div v-else class="fire-records" role="tabpanel"><n-timeline>
 <n-timeline-item v-if="active.caseStatus==='已处置'" type="info" title="事件已完成处置"><dl class="fire-fields"><dt>核警结果：</dt><dd>{{fireDetail.result}}</dd><dt>处置描述：</dt><dd>{{fireDetail.description}}</dd><dt>处置人员：</dt><dd>{{firePrivate?fireDetail.person:fireDetail.person==='—'?'—':fireDetail.person.slice(0,1)+'**'}} <button v-if="fireDetail.person!=='—'" class="fire-privacy" @click="firePrivate=!firePrivate" :aria-label="firePrivate?'隐藏个人信息':'显示个人信息'">{{firePrivate?'◉':'◎'}}</button></dd><dt>联系方式：</dt><dd>{{firePrivate?fireDetail.phone:fireDetail.phone.replace(/(\\d{3})\\d{4}(\\d{4})/,'$1****$2')}} <button v-if="fireDetail.phone!=='—'" class="fire-privacy" @click="firePrivate=!firePrivate" :aria-label="firePrivate?'隐藏个人信息':'显示个人信息'">{{firePrivate?'◉':'◎'}}</button></dd><dt>处置完成时间：</dt><dd>{{fireDetail.completed}}</dd><dt>现场照片：</dt><dd><div v-if="fireDetail.photos.length" class="fire-photos"><img v-for="photo in fireDetail.photos" :key="photo.url" :src="photo.url" :alt="photo.name||'现场照片'" @click="photoPreview=photo.url"></div><span v-else>—</span></dd></dl></n-timeline-item>
 <n-timeline-item v-for="call in fireInterventions" :key="call.id" type="success" :title="'电话介入 · '+(call.stage==='消防电话介入'?'催处置':call.stage||'催处置')" :time="call.time"><dl class="fire-fields fire-intervention-fields"><dt>介入阶段</dt><dd>{{call.stage==='消防电话介入'?'催处置':call.stage||'催处置'}}</dd><dt>值守人员</dt><dd>{{call.person||'—'}}</dd><dt>联系对象</dt><dd>{{call.contact||'—'}}</dd><dt>催促内容</dt><dd>{{call.content||'—'}}</dd><dt>联系结果</dt><dd>{{call.result||'—'}}</dd></dl></n-timeline-item>
 <n-timeline-item type="info" title="预警接收"><dl class="fire-fields"><dt>预警描述：</dt><dd>{{active.type}}</dd><dt>平台首次接收时间：</dt><dd>{{fireDetail.first}}</dd></dl></n-timeline-item>
 </n-timeline></div></div><div v-if="photoPreview" class="preview" @click.self="photoPreview=null"><button @click="photoPreview=null">关闭图片</button><img :src="photoPreview" alt="现场照片大图"></div>`};
})();
