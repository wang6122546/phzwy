(() => {
  const value = input => input === undefined || input === null || input === '' ? '—' : input;
  const photos = list => (Array.isArray(list) ? list : []).map(item => typeof item === 'string' ? {url:item} : item).filter(item => item?.url);
  const category = record => {
    if (!window.AlarmSourceRules.isFire(record)) return '报警';
    const supplied = record.alarmCategory || record.eventCategory;
    if (supplied) return supplied;
    return /烟感|烟雾|火灾|火警/.test(record.type || '') && !/电气|剩余电流/.test(record.type || '') ? '火警' : '预警';
  };
  const build = (record, context = {}) => {
    const fire = window.AlarmSourceRules.isFire(record), type = category(record);
    const D = window.ResponsibilityData;
    const asset = [...(D?.devices || []),...(D?.videos || [])].find(item => item.id === record.deviceId) || {};
    const disposal = context.disposal || record.fireDisposal || record.disposal || {};
    const receipt = context.receipt || record.receipt;
    const first = window.AlarmSourceRules.firstReceived(record);
    const latest = record.lastReceivedAt || record.lastReceiveTime || record.time;
    const position = record.deviceLocation || record.installationPosition || record.location || context.area || record.area;
    const deviceType = record.deviceType || asset.deviceType || (!fire ? '视频通道（AI识别）' : undefined);
    const system = record.systemType || asset.systemType || (/点型感烟|点型感温/.test(deviceType || '') ? '火灾自动报警系统' : !fire ? '视频监控系统' : undefined);
    const gateway = /火灾自动报警/.test(system || '') || record.hostLoopPoint || record.loopPoint || record.gatewayCode;
    const device = [];
    if (gateway) {
      device.push([record.deviceCode || record.deviceId ? '设备编号' : '用传/网关编码',record.deviceCode || record.gatewayCode || asset.code || record.deviceId],['主机回路点位',record.hostLoopPoint || record.loopPoint],['二次码',record.secondaryCode],['通道号',record.channelNo]);
    } else device.push(['IMEI',record.imei || asset.imei]);
    device.push(['系统类型',system],['设备类型',deviceType],['设备位置',position],['品牌型号',record.brandModel || asset.brandModel],['安装日期',record.installedAt || asset.installedAt]);
    const compliance = record.compliance || record.isStandard || disposal.compliance || disposal.isStandard;
    const locationCheck = record.verificationLocationCheck || disposal.locationCheck;
    const closed = ['完成处理','无需处理','已处置','已闭环'].includes(record.caseStatus) || !!disposal.time;
    const nodes = [];
    const add = (title,time,fields,evidence=[],video=null) => nodes.push({id:`${record.id}-${nodes.length}`,title,time,fields:fields.map(([label,data])=>[label,value(data)]),photos:photos(evidence),video});
    const personPhone = name => D?.people.find(person => person.name === name)?.phone;
    if (closed && Object.keys(disposal).length) {
      const person = disposal.person || disposal.handler;
      add(disposal.action || '现场核警',disposal.time || record.completedAt,[['核警结果',disposal.verificationResult || record.verificationResult || record.result || record.caseStatus],['处理描述',disposal.description || disposal.note],['整改措施',disposal.measures],['核警人员',person],['联系方式',disposal.phone || record.disposalPhone || personPhone(person)],['核警时间',disposal.time || record.completedAt]],disposal.evidence || disposal.photos);
    }
    if (!fire && record.reviewTime && record.reviewTime !== '—') {
      const fields = [['核警结果',record.result]];
      if (record.result === '误报') fields.push(['误报原因',record.misreportType]);
      fields.push(['事件判定',record.eventJudgment],['核警人员',record.reviewer],['联系方式',record.reviewerPhone || personPhone(record.reviewer)],['核警时间',record.reviewTime]);
      if (record.remark) fields.push(['核警说明',record.remark]);
      add('现场核警',record.reviewTime,fields,record.reviewPhotos);
    }
    (record.monitoringVerifications || []).forEach(item => add('监测值守核警',item.time,[['服务机构',item.organization],['核警结果',item.result],['核警时间',item.time]]));
    (context.calls || []).forEach(call => add('电话告警（监测值守）',call.time,[['告警接收人',call.contact],['联系方式',call.phone || call.contactPhone || personPhone(call.contact)],['告警时间',call.time],['值守人员',call.person],['联系内容',call.content],['联系结果',call.result]]));
    (record.preliminaryUpdates || disposal.preliminaryUpdates || []).forEach(item => add('先期处理',item.time,[['处理人员',item.person],['处理描述',item.description || item.note],['整改措施',item.measures]],item.evidence));
    if (receipt?.time) add('处置接收',receipt.time,[['接收人员',receipt.person],['接收时间',receipt.time]]);
    add(type+'接收',first,[['平台首次接收时间',first]],record.photo ? [{url:record.photo,name:'报警现场照片'}] : [],record.video);
    nodes.sort((a,b)=>String(b.time || '').localeCompare(String(a.time || '')));
    return {title:type+'处置信息',tab:type+'信息',event:[['平台最新接收时间',value(latest)],['平台首次接收时间',value(first)]],device:device.map(([label,data])=>[label,value(data)]),showCompliance:!!compliance || !!locationCheck || closed,compliance:[['是否规范',value(typeof compliance==='boolean'?(compliance?'规范':'不规范'):compliance)],['核警位置校验',value(locationCheck)]],nodes,position:value(position)};
  };
  window.CaseEventDetailModel = {build,category};
  window.CaseEventDetail = Vue.defineComponent({
    name:'CaseEventDetail',props:{record:{type:Object,required:true},disposal:Object,receipt:Object,calls:{type:Array,default:()=>[]},area:String},
    setup(props){
      const tab=Vue.ref('information'),preview=Vue.ref(null),location=Vue.ref(false);
      const model=Vue.computed(()=>build(props.record,{disposal:props.disposal,receipt:props.receipt,calls:props.calls,area:props.area}));
      Vue.watch(()=>props.record.id,()=>{tab.value='information';preview.value=null;location.value=false;});
      return {tab,model,preview,location};
    },
    template:`<div class="case-event-detail"><div class="case-event-tabs" role="tablist" aria-label="事件处置信息标签"><button type="button" role="tab" :aria-selected="tab==='information'" :class="{active:tab==='information'}" @click="tab='information'">{{model.tab}}</button><button type="button" role="tab" :aria-selected="tab==='records'" :class="{active:tab==='records'}" @click="tab='records'">处置记录</button></div><div v-if="tab==='information'" class="case-event-panel" role="tabpanel" :aria-label="model.tab"><details open class="case-event-section"><summary>{{model.tab}}</summary><dl><template v-for="[label,data] in model.event" :key="label"><dt>{{label}}：</dt><dd>{{data}}</dd></template></dl></details><details open class="case-event-section"><summary>设备信息</summary><dl><template v-for="[label,data] in model.device" :key="label"><dt>{{label}}：</dt><dd>{{data}} <button v-if="label==='设备位置'&&data!=='—'" type="button" class="case-event-location" @click="location=true">查看位置</button></dd></template></dl></details><details v-if="model.showCompliance" open class="case-event-section"><summary>规范信息</summary><dl><template v-for="[label,data] in model.compliance" :key="label"><dt>{{label}}：</dt><dd>{{data}}</dd></template></dl></details></div><div v-else class="case-event-panel" role="tabpanel" aria-label="处置记录"><ol class="case-event-timeline"><li v-for="node in model.nodes" :key="node.id"><h3>{{node.title}}</h3><dl><template v-for="[label,data] in node.fields" :key="label"><dt>{{label}}：</dt><dd>{{data}}</dd></template><template v-if="node.photos.length"><dt>现场照片：</dt><dd class="case-event-photos"><button v-for="photo in node.photos" :key="photo.url" type="button" @click="preview=photo.url" :aria-label="'查看'+(photo.name||'现场照片')"><img :src="photo.url" :alt="photo.name||'现场照片'"></button></dd></template><template v-if="node.video"><dt>报警视频：</dt><dd><video :src="node.video" controls preload="metadata" aria-label="报警视频"></video></dd></template></dl></li></ol></div><n-modal :show="!!preview" preset="card" title="现场照片" style="width:min(900px,92vw)" @update:show="show=>{if(!show)preview=null}"><img v-if="preview" :src="preview" alt="现场照片放大" style="width:100%;max-height:80vh;object-fit:contain"></n-modal><n-modal v-model:show="location" preset="card" title="设备位置" style="width:min(520px,92vw)"><dl class="case-event-location-fields"><dt>设备名称</dt><dd>{{record.device||'—'}}</dd><dt>设备位置</dt><dd>{{model.position}}</dd><dt>责任区域</dt><dd>{{area||record.area||'—'}}</dd></dl><template #footer><n-space justify="end"><n-button @click="location=false">关闭</n-button><n-button tag="a" href="方案图册.html" type="primary">查看监测一张图</n-button></n-space></template></n-modal></div>`
  });
})();
