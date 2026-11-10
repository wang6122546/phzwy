(() => {
  const E=window.StatsEngine,{createApp,ref,computed,watch,onMounted,onBeforeUnmount}=Vue;
  const Empty={props:['description'],template:`<div class="st-empty"><svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="60" cy="71" rx="48" ry="6" fill="#eef6ff"/><path d="M24 23h29l8 9h35v35H24z" fill="#eef6ff" stroke="#cfe1ff"/><path d="M28 14h49l13 13v31H28z" fill="white" stroke="#d8e2ef"/><path d="M40 36h36M40 45h25" fill="none" stroke="#cfe1ff" stroke-width="3"/></svg><p>{{description||'暂无符合条件的数据'}}</p></div>`};
  const Bars={props:{rows:Array,field:String,limit:{type:Number,default:8}},template:`<div v-if="rows.length" class="st-bars"><div v-for="r in rows.slice(0,limit)" :key="r.name" class="st-bar-row"><span class="st-bar-name" :title="r.name">{{r.name}}</span><div class="st-bar-track"><div class="st-bar-fill" :style="{width:(r[field]/Math.max(1,...rows.map(x=>x[field]))*100)+'%'}"></div></div><span class="st-bar-value">{{r[field]}}</span></div></div><prod-empty-state v-else />`};
  const fieldHelp={
    '报警总量':'当前时间范围与筛选条件内的全部报警数量，按报警发生时间归属。',
    '确认违规（含消防）':'包含经复核确认违规的AI报警和消防设备报警。消防报警在此归入确认违规，其余分类仅统计AI报警。',
    '确认违规':'经复核确认存在违规的AI报警数量，不含消防设备报警。',
    '误报':'已复核且复核结果为误报的报警数量，不进入查处闭环统计。',
    '疑似':'已复核但尚不能确认是否违规的数量，计入复核率，不计入准确率样本，不自动生成查处任务。',
    '计划内事件':'已复核且认定为计划内作业或事件的数量，不计入准确率分母，也无需查处。',
    '待复核':'当前筛选范围内尚未完成复核的报警数量。',
    '识别准确率':'确认违规数量 ÷（确认违规数量＋误报数量）×100%。排除待复核、计划内事件和疑似；无有效样本显示“—”。',
    '准确率':'确认违规数量 ÷（确认违规数量＋误报数量）×100%。合计按全部筛选结果重新计算，不平均各行百分比。',
    '复核率':'已复核报警数量 ÷ 报警总量 ×100%。已复核包括确认违规、误报、计划内事件和疑似。',
    '查处闭环率':'AI确认违规报警与消防设备报警中，已完成处理的比例。暂无查处报警时显示“—”。',
    '闭环率':'已完成处理的报警占全部查处报警的比例，包含AI确认违规报警和消防设备报警。暂无查处报警时显示“—”。',
    '待接收':'已确认违规、等待接收处理的AI报警数量，不含消防设备报警。',
    '待处置':'正在等待处理完成的报警数量，包含已接收的AI报警和未处理完成的消防设备报警。',
    '已闭环':'已完成处理的报警数量，包含AI报警和已处理或已恢复的消防设备报警。',
    '复核超期':'报警发生至完成复核超过基础配置的复核时限；未复核的计算至当前时间，包含已复核超期记录。',
    '处置超期':'超过处理时限的报警数量，包含AI和消防设备报警，也包括超期后已完成处理的报警。',
    '平均时长 / 分钟':'报警发生到处理完成的平均用时，单位为分钟，包含AI和消防设备报警。仅计算时间信息完整的已闭环记录。',
    '报警量':'当前分组中的报警数量，包含确认违规、误报、计划内事件、疑似和待复核。',
    '统计分组':'按当前选择的日期、区域、违规事件类型、报警等级或违规人员归并统计；合计包含全部筛选结果。',
    '统计周期':'报告覆盖的报警发生时间范围，报告中的处置状态为生成时快照。',
    '报告类型':'报告分为日报、周报、月报和自定义报告；手动生成仅支持自定义报告。',
    '生成方式':'手动生成由“生成报告”发起；自动生成按开启的日报、周报或月报周期触发。',
    '生成时间':'本份报告快照生成并保存的时间；后续业务变化不会改写历史快照。',
    '周期自动生成':'开启后在页面在线时于09:00后检查最近完整周期，同一周期不重复生成；页面关闭后暂停检查。',
    '日报':'统计前一自然日00:00:00至23:59:59的报警，按生成时状态形成报告。',
    '周报':'统计前一完整自然周，周一00:00:00至周日23:59:59。',
    '月报':'统计前一完整自然月，从月初00:00:00至月末23:59:59。',
    '确认违规区域排行':'按各责任区域的确认违规数量降序排列，不将报警数量直接等同于风险等级。',
    '确认违规区域分布':'按责任区域展示AI确认违规报警和消防设备报警的合计数量，数量较多的区域排在前面。',
    '违规人员排行':'按已登记的违规人员汇总确认违规数量，不使用处置人或责任人替代违规人员。',
    '违规事件类型排行':'按各违规事件类型的报警数量降序排列，同时展示各类型的识别准确率。',
    '复核结果分布':'展示AI与消防报警的数量和占比。消防设备报警归入确认违规；误报、计划内事件、疑似和待复核为AI报警的复核分类。',
    '报警与确认违规趋势':'按报警发生日期展示每日趋势。报警总量包含AI识别和消防设备报警；确认违规仅包含经复核确认违规的AI报警。',
    '识别准确率趋势':'按报警发生日期统计。确认违规 ÷（确认违规＋误报）×100%，排除待复核、计划内事件和疑似。悬停数据点查看样本数量，无有效样本不绘制数据点。',
    '处置闭环率趋势':'按报警发生日期展示AI与消防报警的处理完成比例，帮助了解各日报警的后续处理进展。',
    '分析记录':'参与本次智能分析的全部筛选报警数量。',
    '待闭环事件':'尚未完成处理的AI确认违规报警和消防设备报警数量。',
    '未完成处置超期':'超过处理时限、仍未完成处理的AI及消防设备报警数量。'
  };
  const sourceHelp={
    report:{'AI区域闭环率':'本区域AI确认违规已闭环数÷本区域AI确认违规数。','消防区域闭环率':'本区域消防已闭环数÷本区域消防报警总数，区域汇总到二级。','ai预警识别准确率':'仅统计AI预警识别结果：确认违规÷（确认违规+误报），排除待复核、计划内事件及疑似。','闭环率':'（消防已闭环数+AI预警已闭环数）÷（消防预警数+AI预警数）。分母为报告周期内两类报警总数，分母为0显示—。','处置超期':'超过处理时限的报警数据，包含AI和消防设备报警。'},
    fire:{
      '报警总量':'当前时间范围及筛选条件内的消防设备报警数量，仅统计消防报警。',
      '闭环率':'已闭环消防报警数 ÷ 消防报警总量 ×100%。仅统计当前筛选范围内的消防设备报警，不含AI报警；无有效分母显示“—”，合计按全部记录重新计算。',
      '查处闭环率':'已闭环消防报警数 ÷ 消防报警总量 ×100%。不含AI报警；无有效分母显示“—”。',
      '待处置':'当前消防报警中尚未闭环的数量，包含待处置和处置中的记录，不含AI报警。',
      '已闭环':'当前筛选范围内已处置或已恢复的消防报警数量，不含AI报警。',
      '统计分组':'仅对消防报警按日期或二级责任区域归并统计；合计包含当前全部筛选结果。',
      '处置超期':'仅包含消防处置中故障事件和隐患事件',
      '处置闭环率趋势':'按报警日期展示每日已闭环消防报警数 ÷ 当日消防报警总量 ×100%。不含AI报警；无有效分母不绘制数据点。',
      '确认违规区域分布':'按责任区域展示消防报警数量，不含AI报警。',
      '报警量':'当前分组内的消防设备报警数量，不含AI报警。'
    },
    ai:{
      '报警总量':'当前时间范围及筛选条件内的AI报警数量，不含消防设备报警。',
      '闭环率':'已闭环AI查处记录数 ÷ AI确认违规记录数 ×100%。仅统计AI确认违规报警，不含消防报警；无有效分母显示“—”，合计按全部记录重新计算。',
      '查处闭环率':'已闭环AI查处记录数 ÷ AI确认违规记录数 ×100%。不含消防报警；无有效分母显示“—”。',
      '待处置':'当前AI确认违规记录中已接收且尚未完成处理的数量，不含待接收记录及消防报警。',
      '已闭环':'当前AI确认违规记录中已完成处理的数量，不含消防报警。',
      '处置超期':'当前AI确认违规记录接收后超过配置处理时限的数量，包含已完成及未完成的超期记录，不含消防报警。',
      '平均时长 / 分钟':'AI确认违规记录从报警发生到处理完成的平均分钟数，仅计算时间完整的已闭环记录，不含消防报警。',
      '处置闭环率趋势':'按报警日期展示每日已闭环AI记录数 ÷ 当日AI确认违规记录数 ×100%。不含消防报警；无有效分母不绘制数据点。',
      '确认违规区域分布':'按责任区域展示AI确认违规数量，不含消防报警。',
      '复核结果分布':'当前AI报警按确认违规、误报、计划内事件、疑似和待复核分类展示数量与占比，不含消防报警。',
      '报警与确认违规趋势':'按日期展示AI报警总量和AI确认违规数量，不含消防报警。',
      '分析记录':'参与当前AI智能分析的筛选报警数量，不含消防报警。',
      '待闭环事件':'当前AI确认违规记录中尚未完成处理的数量，包含待接收及待处置，不含消防报警。',
      '未完成处置超期':'当前AI确认违规记录中已接收、超过处理时限且仍未完成处理的数量，不含消防报警。'
    }
  };
  const FieldHint={props:['label'],setup(props){const scope=Vue.inject('statisticsHelpScope',ref('mixed'));const help=computed(()=>sourceHelp[scope.value]?.[props.label]||fieldHelp[props.label]);return {shown:ref(false),help};},template:`<n-tooltip v-if="help" :show="shown" placement="top" to="body" :style="{maxWidth:'320px',fontSize:'12px',lineHeight:'1.8'}"><template #trigger><span class="st-field-hint" tabindex="0" role="img" :aria-label="label+'统计说明'" @mouseenter="shown=true" @mouseleave="shown=false" @focus="shown=true" @blur="shown=false" @click.stop @keydown.stop><i class="fa fa-question-circle-o" aria-hidden="true"></i></span></template>{{help}}</n-tooltip>`};
  createApp({components:{ProdEmptyState:Empty,StatsBars:Bars,FieldHint},setup(){
    const pageMode=document.body.dataset.statPage,title={reports:'统计报表',analysis:'数据分析',management:'安全管理报告'}[pageMode];
    const saved=window.StatsNavigation?.restore(decodeURIComponent(location.pathname.split('/').pop()))||{};
    const withinYear=value=>{if(!Array.isArray(value)||value.length!==2||!value.every(Number.isFinite)||value[0]>value[1])return false;const start=new Date(value[0]),limit=new Date(start),month=start.getMonth();limit.setFullYear(limit.getFullYear()+1);if(limit.getMonth()!==month)limit.setDate(0);return value[1]<=+limit;};
    const source=ref('demo'),records=ref([]),refreshed=ref(''),quick=ref(saved.quick||'month'),range=ref(withinYear(saved.range)?saved.range:E.period('month')),area=ref(AreaCascade.selection(saved.area)),type=ref(saved.type||null),level=ref(saved.level||null),department=ref(null),tab=ref(saved.tab||'alarm'),dimension=ref(saved.dimension==='department'?'date':saved.dimension||'date'),page=ref(saved.page||1),pageSize=ref(saved.pageSize||10),notice=ref(''),noticeType=ref('success');
    if(dimension.value==='person'||tab.value==='fireCase'&&!['date','area'].includes(dimension.value))dimension.value='date';
    const analysisSource=ref(saved.analysisSource==='fire'?'fire':'ai');
    Vue.provide('statisticsHelpScope',computed(()=>pageMode==='reports'?(tab.value==='fireCase'?'fire':'ai'):pageMode==='analysis'?analysisSource.value:'report'));
    let noticeTimer,timer;
    const notify=(text,kind='success')=>{clearTimeout(noticeTimer);notice.value=text;noticeType.value=kind;noticeTimer=setTimeout(()=>notice.value='',5000);};
    const fireArea=r=>{
      const d=window.ResponsibilityData;if(!d)return r.area;
      const asset=[...d.devices,...d.videos].find(item=>item.id===r.deviceId);
      const buildingId=String(r.deviceId||'').startsWith('fire-')?r.deviceId.slice(5):null;
      const floor=d.floors.find(item=>item.buildingId===buildingId);
      const areaId=r.areaId||asset?.areaId||(floor&&d.areas.find(item=>item.floorId===floor.id)?.id);
      return (areaId&&d.path(areaId))||[r.buildingName,r.floorName,r.area].filter(Boolean).join(' / ');
    };
    const fireCategories=['火警','预警','故障','隐患','动作','离线'];
    const fireCategory=r=>{const explicit=r.alarmCategory||r.eventCategory||r.fireCategory;if(fireCategories.includes(explicit))return explicit;const text=[r.type,r.deviceCurrentStatus].join(' ');return /离线/.test(text)?'离线':/故障/.test(text)?'故障':/隐患/.test(text)?'隐患':/动作|启动|反馈/.test(text)?'动作':/烟感|烟雾|火警/.test(text)?'火警':'预警';};
    const refresh=()=>{records.value=E.load('demo').map(r=>E.normalize(['reports','analysis'].includes(pageMode)&&E.isFire(r)?{...r,area:pageMode==='analysis'?AreaCascade.path(fireArea(r)).split(' / ').slice(0,2).join(' / '):fireArea(r),...(pageMode==='analysis'?{type:fireCategory(r)}:{})}:r));refreshed.value=E.stamp(new Date());};refresh();
    const quickOptions=[{label:'今日',value:'today'},{label:'本周',value:'week'},{label:'本月',value:'month'},{label:'本季度',value:'quarter'}];
    const selectQuick=value=>{quick.value=value;if(value!=='custom')range.value=E.period(value);};
    const selectRange=value=>{if(value&&!withinYear(value)){notify('查询时间跨度不能超过一年，请重新选择','warning');return;}range.value=value;quick.value='custom';};
    const validRange=computed(()=>withinYear(range.value));
    const filterOptions=computed(()=>({range:range.value,area:AreaCascade.selection(area.value).length?area.value:null,type:pageMode==='reports'&&tab.value!=='alarm'?null:type.value,level:pageMode==='reports'&&tab.value!=='alarm'?null:level.value}));
    const rows=computed(()=>validRange.value?E.filter(records.value,filterOptions.value).filter(r=>pageMode==='reports'?(tab.value==='fireCase'?E.isFire(r):!E.isFire(r)):pageMode==='analysis'?(analysisSource.value==='fire'?E.isFire(r):!E.isFire(r)):!E.isFire(r)):[]);
    const summary=computed(()=>E.stats(rows.value));
    const previousRows=computed(()=>{if(!validRange.value)return [];const length=range.value[1]-range.value[0]+1;return E.filter(records.value,{...filterOptions.value,range:[range.value[0]-length,range.value[0]-1]}).filter(r=>pageMode==='reports'?(tab.value==='fireCase'?E.isFire(r):!E.isFire(r)):pageMode==='analysis'?(analysisSource.value==='fire'?E.isFire(r):!E.isFire(r)):!E.isFire(r));});
    const prev=computed(()=>E.stats(previousRows.value));
    const change=(value,old,suffix='')=>old===null||value===null?'暂无可比数据':suffix==='%'?(Math.round((value-old)*10)/10>0?'+':'')+Math.round((value-old)*10)/10+' 个百分点':old===0?value===0?'与上一等长时段持平':'上一等长时段为 0':(value>=old?'+':'')+Math.round((value-old)/old*1000)/10+'%';
    const secondArea=r=>AreaCascade.path(r.area).split(' / ').slice(0,2).join(' / ');
    const options=key=>pageMode==='analysis'&&analysisSource.value==='fire'&&key==='type'?fireCategories.map(value=>({label:value,value})):key==='area'?AreaCascade.options(records.value.filter(r=>pageMode==='analysis'?(analysisSource.value==='fire'?E.isFire(r):!E.isFire(r)):pageMode!=='reports'||(tab.value==='fireCase'?E.isFire(r):!E.isFire(r))).map(r=>(tab.value==='fireCase'||pageMode==='analysis'&&analysisSource.value==='fire')?secondArea(r):r.area)):[...new Set(records.value.filter(r=>pageMode!=='analysis'||(analysisSource.value==='fire'?E.isFire(r):!E.isFire(r))).map(r=>r[key]).filter(Boolean))].sort().map(v=>({label:v,value:v}));
    const metricCards=computed(()=>{
      const s=summary.value,p=prev.value;
      if(pageMode==='reports'||pageMode==='analysis')return [{label:'识别准确率',value:E.fmt(s.accuracy),key:'accuracy',icon:'fa-bullseye',note:change(s.accuracy,p.accuracy,'%')},{label:'复核率',value:E.fmt(s.reviewRate),key:'reviewed',icon:'fa-check-square-o',note:change(s.reviewRate,p.reviewRate,'%')},{label:'查处闭环率',value:E.fmt(s.closeRate),key:'caseScope',icon:'fa-check-circle-o',note:change(s.closeRate,p.closeRate,'%')}];
      return tab.value!=='alarm'&&pageMode==='reports'?[{label:'确认违规',value:s.confirmed,unit:'条',key:'confirmed',icon:'fa-exclamation-triangle',note:'查处统计的范围'},{label:'已闭环',value:s.closed,unit:'条',key:'closed',icon:'fa-check-circle-o',note:change(s.closed,p.closed)},{label:'闭环率',value:E.fmt(s.closeRate),key:'confirmed',icon:'fa-pie-chart',note:change(s.closeRate,p.closeRate,'%')},{label:'处置超期',value:s.disposalLate,unit:'条',key:'disposalLate',icon:'fa-clock-o',note:'含已完成和未完成的超期记录'}]:[{label:'报警总量',value:s.total,unit:'条',key:'total',icon:'fa-bell-o',note:change(s.total,p.total)},{label:'识别准确率',value:E.fmt(s.accuracy),key:'accuracy',icon:'fa-bullseye',note:change(s.accuracy,p.accuracy,'%')},{label:'查处闭环率',value:E.fmt(s.closeRate),key:'caseScope',icon:'fa-check-circle-o',note:change(s.closeRate,p.closeRate,'%')},{label:'待复核',value:s.pending,unit:'条',key:'pending',icon:'fa-clock-o',note:'当前筛选报警中的待复核记录'}];
    });
    const dimensionOptions=computed(()=>[{label:'按日期',value:'date'},{label:'按区域',value:'area'},...(tab.value==='fireCase'?[]:[{label:'按违规事件类型',value:'type'},{label:'按报警等级',value:'level'}])]);
    const fireLateCount=items=>items.filter(r=>{const category=r.alarmCategory||r.eventCategory||r.fireCategory||r.type||'';return E.isFire(r)&&/故障|隐患/.test(category)&&(r.disposalLate===true||r.isOverdue===true||r.isOverdue==='是');}).length;
    const reportGroups=(items,key)=>{
      if(tab.value!=='fireCase'||!['area','type'].includes(key))return E.groups(items,key);
      const buckets=new Map();
      items.forEach(r=>{const name=key==='area'?secondArea(r)||'未分配':r.fireType||window.AlarmSourceRules.fireName(r)||r.deviceType||'未分类消防报警';if(!buckets.has(name))buckets.set(name,[]);buckets.get(name).push(r);});
      return [...buckets].map(([name,rows])=>({name,rows,...E.stats(rows)}));
    };
    const tableGroups=computed(()=>reportGroups(tab.value!=='alarm'?rows.value.filter(E.caseEligible):rows.value,dimension.value).map(g=>tab.value==='fireCase'?{...g,disposalLate:fireLateCount(g.rows)}:g).sort((a,b)=>dimension.value==='date'?b.name.localeCompare(a.name):b.total-a.total));
    const tableTotals=computed(()=>({...E.stats(tab.value!=='alarm'?rows.value.filter(E.caseEligible):rows.value),...(tab.value==='fireCase'?{disposalLate:fireLateCount(rows.value)}:{})}));
    const visibleGroups=computed(()=>tableGroups.value);
    const areaRanks=computed(()=>{
      const items=rows.value.filter(r=>pageMode==='analysis'?E.caseEligible(r):r.confirmed);
      if(pageMode==='analysis'&&analysisSource.value==='fire'){
        const buckets=new Map();items.forEach(r=>{const name=secondArea(r)||'未分配';if(!buckets.has(name))buckets.set(name,[]);buckets.get(name).push(r);});
        return [...buckets].map(([name,records])=>({name,rows:records,...E.stats(records),confirmed:records.length})).sort((a,b)=>b.confirmed-a.confirmed);
      }
      return E.groups(items,'area').map(g=>({...g,confirmed:pageMode==='analysis'?g.total:g.confirmed})).sort((a,b)=>b.confirmed-a.confirmed);
    });
    const typeRanks=computed(()=>analysisSource.value==='fire'?fireCategories.map(name=>{const items=rows.value.filter(r=>fireCategory(r)===name);return {name,rows:items,...E.stats(items)};}).sort((a,b)=>b.total-a.total):E.groups(rows.value,'type').sort((a,b)=>b.total-a.total));
    const personRanks=computed(()=>E.groups(rows.value.filter(r=>r.confirmed),'person').sort((a,b)=>b.total-a.total));
    const series=computed(()=>validRange.value?E.trend(rows.value,range.value):[]);
    const points=(field,max)=>series.value.map((v,i)=>(45+i*650/Math.max(1,series.value.length-1))+','+(180-(v[field]??0)/Math.max(1,max)*150)).join(' ');
    const rateWidth=ref(730);let rateObserver;
    const rateSegments=field=>{const segments=[];let current=[];series.value.forEach((v,i)=>{if(v[field]===null){if(current.length)segments.push(current.join(' '));current=[];}else current.push((45+i*(rateWidth.value-80)/Math.max(1,series.value.length-1))+','+(180-v[field]*1.5));});if(current.length)segments.push(current.join(' '));return segments;};
    const chartMax=computed(()=>Math.max(1,...series.value.map(s=>s.total)));
    const rateTicks=computed(()=>{const count=series.value.length;if(count<2)return series.value;const intervals=Math.min(count-1,Math.max(1,Math.floor((rateWidth.value-80)/76)));return Array.from({length:intervals+1},(_,i)=>series.value[Math.round(i*(count-1)/intervals)]);});
    const lineTicks=computed(()=>series.value.filter((v,i)=>i===0||i===series.value.length-1||i===Math.floor(series.value.length/2)));
    const notes=computed(()=>E.insights(rows.value));
    const distribution=computed(()=>{
      if(pageMode==='analysis'&&analysisSource.value==='fire'){let offset=0;return [{name:'待处置',value:rows.value.filter(r=>window.AlarmSourceRules.fireStatus(r)==='待处置').length,color:'#d98600',key:'firePending'},{name:'处置中',value:rows.value.filter(r=>window.AlarmSourceRules.fireStatus(r)==='处置中').length,color:'#0879ff',key:'fireProcessing'},{name:'已处置',value:rows.value.filter(r=>window.AlarmSourceRules.fireStatus(r)==='已处置').length,color:'#12a36a',key:'closed'}].map(d=>{const count=rows.value.filter(r=>['待处置','处置中','已处置'].includes(window.AlarmSourceRules.fireStatus(r))).length;const share=count?d.value/count*100:0;const result={...d,share,offset};offset+=share;return result;});}
      const s=E.stats(rows.value),fireCount=rows.value.filter(E.isFire).length;let offset=0;
      return [{name:'确认违规',value:s.confirmed+fireCount,color:'#0879ff',key:'distributionConfirmed'},{name:'误报',value:s.mis,color:'#d98600',key:'mis'},{name:'计划内事件',value:s.planned,color:'#12a36a',key:'planned'},{name:'疑似',value:s.suspected,color:'#d98600',key:'suspected'},{name:'待复核',value:s.pending,color:'#8190a5',key:'pending'}].map(d=>{const share=s.total?d.value/s.total*100:0;const result={...d,share,offset};offset+=share;return result;});
    });
    const insight=computed(()=>{
      const s=summary.value,open=s.waiting+s.processing,late=rows.value.filter(r=>E.caseEligible(r)&&!r.completed&&r.disposalLate).length,top=areaRanks.value[0],misType=E.groups(rows.value.filter(r=>r.result==='误报'),'type').sort((a,b)=>b.mis-a.mis)[0];
      const priority=late?'优先跟进':open||s.pending?'持续关注':'运行观察';
      const headline=!s.total?'暂无可分析的报警数据':late?'建议优先推动超期待处置记录闭环':s.pending?'建议先完成待复核记录，明确现场处置重点':open?'建议聚焦未闭环事件，落实现场整改':'本期查处报警已闭环，建议持续观察重点场景';
      const narrative=!s.total?'调整时间或筛选条件后，将根据对应数据更新分析结论。':'当前筛选范围共 '+s.total+' 条'+(analysisSource.value==='fire'?'消防报警':'AI报警')+'，'+(analysisSource.value==='fire'?'':'已确认违规 '+s.confirmed+' 条，')+'已闭环 '+s.closed+' 条。'+(rows.value.some(E.caseEligible)?'闭环率为 '+E.fmt(s.closeRate)+'。':'暂无确认违规记录。')+(top?(analysisSource.value==='fire'?'消防报警主要集中在 ':'AI确认违规主要集中在 ')+top.name+'，占上述报警 '+E.fmt(E.percent(top.confirmed,rows.value.filter(E.caseEligible).length))+'。':'')+(s.pending?'另有 '+s.pending+' 条待复核，建议先完成核实，再判断识别与处置表现。':'');
      const actions=s.total?[
        {title:late?'优先处理超期事件':'跟进处置闭环',tone:late?'warning':'primary',evidence:late?'仍有 '+late+' 条超期待处置':'待闭环 '+open+' 条',advice:open?'跟进当前来源报警的处理进度、现场整改和完成结果，优先处理超期事件。':'继续检查整改结果与现场防护措施，防止同类事件重复发生。',key:late?'lateProcessing':'unclosed',button:late?'查看超期待处置':'查看未闭环'},
        {title:top?'聚焦重点区域':'持续检查责任区域',tone:'primary',evidence:top?top.confirmed+(analysisSource.value==='fire'?' 条消防报警集中于该区域':' 条AI确认违规集中于该区域'):'暂无确认违规区域',advice:top?'优先检查 '+top.name+' 的作业组织、防护措施和现场通行秩序。':'保持常态巡查，补充区域责任与监控覆盖信息。',key:'area',button:'查看重点区域'},
        {title:s.pending?'完成复核与样本核查':'复查误报场景',tone:'success',evidence:s.pending?s.pending+' 条记录待复核':s.mis+' 条误报',advice:misType?'结合 '+misType.name+' 的误报样本核查画面、遮挡和场景变化，再决定是否调整识别策略。':'核对原始画面与现场事实，形成可追溯的复核结论和处理记录。',key:s.pending?'pending':'mis',button:s.pending?'查看待复核':'查看误报'}
      ]:[];
      return {priority,headline,narrative,actions:analysisSource.value==='fire'?actions.filter(a=>!['pending','mis'].includes(a.key)):actions,top,late};
    });
    const openInsight=action=>{
      const filters={area:area.value,type:type.value,level:level.value,...(action.filters||{})};
      let matched=rows.value,target='AI隐患核查.html';
      if(action.keyword)filters.keyword=action.keyword;
      if(action.key==='lateProcessing'){target='隐患违章管理-违章查处.html';filters.caseStatus='待处置';filters.disposalOverdue='是';matched=matched.filter(r=>E.caseEligible(r)&&!r.completed&&(E.isFire(r)||r.received)&&r.disposalLate);}
      else if(action.key==='unclosed'){target='隐患违章管理-违章查处.html';filters.caseStatus='未闭环';matched=matched.filter(r=>E.caseEligible(r)&&!r.completed);}
      else if(action.key==='area'){const name=insight.value.top?.name;if(!name)return;drill(matched.filter(r=>E.caseEligible(r)&&r.area===name),name+(analysisSource.value==='fire'?' · 消防报警':' · AI确认违规'),'distributionConfirmed');return;}
      else if(action.key==='pending'){filters.status='待复核';matched=matched.filter(r=>r.status!=='已复核');}
      else if(action.key==='mis'){filters.status='已复核';filters.result='误报';matched=matched.filter(r=>r.result==='误报'&&r.status==='已复核');}
      if(filters.keyword)matched=matched.filter(r=>[r.id,r.device,r.area,r.owner,r.reviewer,r.receipt?.person,r.disposal?.person,r.disposal?.violator].some(v=>String(v||'').includes(filters.keyword.trim())));
      try{window.StatsNavigation.go(target,{source:'demo',title:action.title,range:[...range.value],filters,rows:matched,key:action.key},{analysisSource:analysisSource.value,source:'demo',quick:quick.value,range:range.value,area:area.value,type:type.value,level:level.value,tab:tab.value,dimension:dimension.value,page:page.value,pageSize:pageSize.value});}
      catch{notify('无法保存跳转查询，请重试','error');}
    };
    const detailShow=ref(false),detailTitle=ref(''),detailRows=ref([]),detailPage=ref(1);
    const matches=(r,key)=>key==='firePending'?window.AlarmSourceRules.fireStatus(r)==='待处置':key==='fireProcessing'?window.AlarmSourceRules.fireStatus(r)==='处置中':key==='fireNA'?window.AlarmSourceRules.fireStatus(r)==='～':key==='distributionConfirmed'&&E.caseEligible(r)||key==='caseScope'&&E.caseEligible(r)||key==='total'||key==='unclosed'&&E.caseEligible(r)&&!r.completed||key==='mis'&&r.status==='已复核'&&r.result==='误报'||key==='planned'&&r.status==='已复核'&&r.result==='计划内事件'||key==='suspected'&&r.status==='已复核'&&r.result==='疑似'||key==='reviewLate'&&r.reviewLate||key==='accuracy'&&r.status==='已复核'&&['确认违规','误报'].includes(r.result)||key==='confirmed'&&r.confirmed||key==='closed'&&r.completed||key==='reviewed'&&!E.isFire(r)&&r.status==='已复核'||key==='pending'&&!E.isFire(r)&&r.status!=='已复核'||key==='disposalLate'&&r.disposalLate;
    const drill=(items,name,key='total',group=null)=>{
      if(pageMode==='reports'){
        const matched=items.filter(r=>matches(r,key));const target=tab.value!=='alarm'?'隐患违章管理-违章查处.html':'AI隐患核查.html';
        const filters={area:area.value,type:type.value,level:level.value};let selectedRange=[...range.value];
        if(group){if(group.dimension==='date'){const dayStart=E.time(group.name+' 00:00:00');selectedRange=[Math.max(selectedRange[0],dayStart),Math.min(selectedRange[1],dayStart+86400000-1)];}else if(['area','type','level'].includes(group.dimension)&&!(tab.value==='fireCase'&&group.dimension==='type'))filters[group.dimension]=group.name;}
        if(group?.dimension==='person')filters.violator=group.name;
        if(key==='pending')filters.status='待复核';if(key==='reviewed')filters.status='已复核';if(key==='confirmed')filters.result='确认违规';if(key==='accuracy')filters.result='判定样本';if(key==='reviewLate')filters.reviewOverdue='是';if(key==='closed')filters.caseStatus='已处置';if(key==='disposalLate')filters.disposalOverdue='是';
        try{window.StatsNavigation.go(target,{source:source.value,title:name,range:selectedRange,filters,rows:matched,key,group},{analysisSource:analysisSource.value,source:source.value,quick:quick.value,range:range.value,area:area.value,type:type.value,level:level.value,tab:tab.value,dimension:dimension.value,page:page.value,pageSize:pageSize.value});}
        catch{notify('无法保存跳转查询，请检查浏览器会话存储后重试','error');}return;
      }
      detailTitle.value=name;detailRows.value=items.filter(r=>matches(r,key));detailPage.value=1;detailShow.value=true;
    };
    const visibleDetails=computed(()=>detailRows.value.slice((detailPage.value-1)*10,detailPage.value*10));
    const exportDetails=items=>pageMode==='analysis'&&analysisSource.value==='fire'?E.csv('消防报警明细.csv',['报警ID','报警时间','区域','消防报警类型','设备名称','处置状态'],items.map(r=>[r.id,r.time,r.area,r.type,r.device,window.AlarmSourceRules.fireStatus(r)])):E.csv('报警查处明细.csv',['报警ID','报警时间','区域','违规事件类型','部门','等级','复核结果','责任人','查处状态','处置超期','闭环时长（分钟）'],items.map(r=>[r.id,r.time,r.area,r.type,r.department,r.level,r.result,r.owner,r.caseStatus,r.disposalLate?'是':'否',r.duration]));
    const exportTable=()=>{
      try{
        const X=window.XLSX;if(!X)throw Error('Excel 组件未加载，请刷新页面重试');
        const isCase=tab.value!=='alarm',title=isCase?(tab.value==='fireCase'?'消防查处报表':'AI查处报表'):'报警报表',data=isCase?rows.value.filter(E.caseEligible):rows.value;
        const headers=isCase?['统计分组',tab.value==='fireCase'?'报警总量':'确认违规','待处置','已闭环','闭环率','处置超期',...(tab.value==='fireCase'?[]:['平均闭环时长（分钟）'])]:['统计分组','报警总量','确认违规','误报','计划内事件','疑似','待复核','复核超期','准确率','复核率'];
        const ratio=v=>v===null?'—':v/100;
        const cells=g=>isCase?[g.name,tab.value==='fireCase'?g.total:g.confirmed,g.processing,g.closed,ratio(g.closeRate),(tab.value==='fireCase'?fireLateCount(g.rows||data):g.disposalLate),...(tab.value==='fireCase'?[]:[g.avgMinutes??'—'])]:[g.name,g.total,g.confirmed,g.mis,g.planned,g.suspected,g.pending,g.reviewLate,ratio(g.accuracy),ratio(g.reviewRate)];
        const book=X.utils.book_new();book.Props={Title:title,Subject:'全部统计维度',Company:'深圳中外运物流有限公司'};
        for(const option of dimensionOptions.value){
          const groups=reportGroups(data,option.value).sort((a,b)=>option.value==='date'?b.name.localeCompare(a.name):b.total-a.total);
          const matrix=[[title+' · '+option.label],['统计时间：'+range.value.map(t=>E.stamp(new Date(t))).join(' 至 ')],[],headers,...groups.map(cells),cells({name:'合计（全部筛选结果）',...E.stats(data)})];
          const sheet=X.utils.aoa_to_sheet(matrix);sheet['!cols']=headers.map((v,i)=>({wch:i===0?(option.value==='area'?55:32):Math.max(14,v.length*2+2)}));
          sheet['!merges']=[{s:{r:0,c:0},e:{r:0,c:headers.length-1}},{s:{r:1,c:0},e:{r:1,c:headers.length-1}}];
          sheet['!autofilter']={ref:X.utils.encode_range({r:3,c:0},{r:3+groups.length,c:headers.length-1})};
          const percentageCols=isCase?[4]:[7,8];
          for(let row=4;row<matrix.length;row++)for(const col of percentageCols){const cell=sheet[X.utils.encode_cell({r:row,c:col})];if(cell?.t==='n')cell.z='0.0%';}
          X.utils.book_append_sheet(book,sheet,option.label);
        }
        const bytes=X.write(book,{type:'array',bookType:'xlsx'});
        E.download(title+'_'+E.day(new Date(range.value[0]))+'至'+E.day(new Date(range.value[1]))+'.xlsx',new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
        notify('已导出 '+book.SheetNames.length+' 个维度，每个维度一个 Sheet');
      }catch(error){notify(error.message||'导出失败，请重试','error');}
    };
    const reset=()=>{area.value=[];type.value=null;level.value=null;department.value=null;selectQuick('month');};
    watch([range,area,type,level,department,dimension,pageSize],()=>page.value=1);
    watch(tab,()=>{dimension.value='date';page.value=1;if(tab.value!=='alarm'){type.value=null;level.value=null;}area.value=[];});
    watch(source,()=>{area.value=[];type.value=null;department.value=null;refresh();});

    // Reports are frozen snapshots. Local scheduling only checks while this page is open.
    const reportKey='sinotrans-safety-reports-v1',scheduleKey='sinotrans-safety-schedules-v1';
    const reports=ref(E.read(reportKey,[])),reportPage=ref(1),reportKeyword=ref(''),reportKind=ref(null),reportPreview=ref(false),activeReport=ref(null),generateShow=ref(false),generateKind=ref('custom'),generateRange=ref(E.completedPeriod('weekly')),generateSource=ref('demo'),reportError=ref('');
    if(!Array.isArray(reports.value))reports.value=[];
    reports.value=reports.value.map(r=>({...r,notes:(r.notes||[]).map(n=>n.replaceAll('算法类型','违规事件类型').replaceAll('算法','违规事件类型'))}));
    const kinds=[{label:'日报',value:'daily'},{label:'周报',value:'weekly'},{label:'月报',value:'monthly'},{label:'自定义报告',value:'custom'}];
    const schedules=ref({...{daily:false,weekly:false,monthly:false,source:'demo'},...E.read(scheduleKey),source:'demo'});
    const kindName=value=>kinds.find(k=>k.value===value)?.label||value;
    const reportMetrics=items=>{const ai=items.filter(r=>!E.isFire(r)),fire=items.filter(E.isFire),stats=E.stats(items),aiStats=E.stats(ai),fireStats=E.stats(fire);return {...stats,accuracy:aiStats.accuracy,closeRate:E.percent(fireStats.closed+aiStats.closed,fire.length+ai.length),aiTotal:ai.length,fireTotal:fire.length,aiClosed:aiStats.closed,fireClosed:fireStats.closed,disposalLate:items.filter(r=>E.caseEligible(r)&&!r.completed&&r.disposalLate).length};};
    const fireReportAreas=items=>{const buckets=new Map();items.filter(E.isFire).forEach(r=>{const name=secondArea(r)||'未分配';if(!buckets.has(name))buckets.set(name,[]);buckets.get(name).push(r);});return [...buckets].map(([name,items])=>({name,...E.stats(items)})).sort((a,b)=>b.total-a.total).slice(0,5);};
    // Report-only deterministic simulation; shared alarm records are left intact.
    const reportDemoData=period=>{const data=E.filter(E.load('demo').map(r=>E.normalize(r)),{range:period}),ai=data.filter(r=>!E.isFire(r)),fire=data.filter(E.isFire),target=Math.round(ai.length*3/7),zones=['1#仓库 / 1层','2#仓库 / 1层','3#仓库 / 2层','4#仓库 / 1层','园区配套区域 / 地面区域'];for(let i=fire.length;i<target;i++){const seed=ai[Math.floor(i*ai.length/Math.max(1,target))%ai.length],category=['火警','预警','故障','隐患','动作','离线'][i%6],done=i%5<3,late=!done&&['故障','隐患'].includes(category);data.push(E.normalize({id:'REPORT-FIRE-DEMO-'+seed.time.slice(0,10)+'-'+i,kind:'fire',isFire:true,demo:true,alarmCategory:category,type:category,area:zones[i%zones.length],device:'消防监测装置 '+(i+1),deviceType:['点型感烟火灾探测器','独立式电气火灾监控探测器','水压监测装置'][i%3],time:seed.time,alarmStatus:done?'已处置':i%2?'处置中':'待处置',completedAt:done?seed.time:undefined,disposalLate:late,isOverdue:late}));}return data;};
    const reportNotes=data=>{const ai=data.filter(r=>!E.isFire(r)),fire=data.filter(E.isFire),a=E.stats(ai),f=E.stats(fire),top=fireReportAreas(data)[0];return ['AI预警 '+ai.length+' 条，消防报警 '+fire.length+' 条；AI已闭环 '+a.closed+' 条，消防已闭环 '+f.closed+' 条。',...E.insights(ai).filter(n=>!n.startsWith('处置超期 ')).map(n=>'AI：'+n),'消防：期间发生 '+fire.length+' 条报警，已闭环 '+f.closed+' 条，闭环率 '+E.fmt(f.closeRate)+'；建议优先核查未闭环设备及现场处置结果。',top?'消防：重点区域为 '+top.name+'，共 '+top.total+' 条报警、已闭环 '+top.closed+' 条，建议检查设备运行与日常维保。':'消防：期间暂无报警记录。','消防：故障和隐患中仍有 '+fire.filter(r=>!r.completed&&r.disposalLate).length+' 条超期未完成，建议核实故障原因、整改措施及责任人。'];};
    const buildReport=(kind,period,origin,auto=false)=>{
      origin='demo';
      const today=new Date();today.setHours(0,0,0,0);period=[period[0],Math.min(period[1],today.getTime()-1)];
      const data=reportDemoData(period),length=period[1]-period[0]+1,previous=reportDemoData([period[0]-length,period[0]-1]);
      const generated=E.stamp(new Date());
      return {id:'REPORT-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:'平湖物流中心安全管理'+kindName(kind),kind,range:period,source:origin,auto,generated,metrics:reportMetrics(data),previous:reportMetrics(previous),fireAreas:fireReportAreas(data),areas:E.groups(data.filter(r=>!E.isFire(r)&&r.confirmed),'area').sort((a,b)=>b.confirmed-a.confirmed).slice(0,5).map(({rows,...s})=>s),types:E.groups(data.filter(r=>!E.isFire(r)),'type').sort((a,b)=>b.total-a.total).slice(0,6).map(({rows,...s})=>s),notes:reportNotes(data),demoMix:true,overdueScopeVersion:4};
    };
    const storeReport=report=>{const next=[report,...reports.value].slice(0,100);localStorage.setItem(reportKey,JSON.stringify(next));reports.value=next;};
    const reportDateDisabled=timestamp=>{const today=new Date();today.setHours(0,0,0,0);return timestamp>=today.getTime();};
    const generate=()=>{
      reportError.value='';const r=generateRange.value;
      if(!r||r[0]>r[1]||r[1]-r[0]>366*86400000){reportError.value='请选择不超过 366 天的有效报告周期';return;}
      if(r.some(reportDateDisabled)){reportError.value='仅支持生成截至昨日的报告，请选择昨日及之前的日期';return;}
      try{const report=buildReport('custom',r,generateSource.value);storeReport(report);activeReport.value=report;generateShow.value=false;reportPreview.value=true;notify('报告已生成并保存');}catch{reportError.value='生成失败，浏览器存储空间不足或不可用';}
    };
    const chooseGenerateKind=value=>{generateKind.value=value;if(value!=='custom')generateRange.value=E.completedPeriod(value);};
    const openGenerate=()=>{generateSource.value=source.value;generateKind.value='custom';generateRange.value=E.completedPeriod('daily');reportError.value='';generateShow.value=true;};
    const checkSchedules=()=>{
      const now=new Date();if(now.getHours()<9)return;
      for(const kind of ['daily','weekly','monthly']){
        if(!schedules.value[kind])continue;
        const period=E.completedPeriod(kind),origin=schedules.value.source;
        if(reports.value.some(r=>r.auto&&r.kind===kind&&r.source===origin&&r.range[0]===period[0]))continue;
        try{storeReport(buildReport(kind,period,origin,true));}catch{notify('自动报告保存失败，请检查浏览器存储','error');break;}
      }
    };
    const saveSchedule=(key,value)=>{const next={...schedules.value,[key]:value};try{localStorage.setItem(scheduleKey,JSON.stringify(next));schedules.value=next;checkSchedules();notify('自动生成设置已保存');}catch{notify('设置未保存，请检查浏览器存储','error');}};
    const filteredReports=computed(()=>reports.value.filter(r=>(!reportKind.value||r.kind===reportKind.value)&&r.name.includes(reportKeyword.value.trim())));
    const visibleReports=computed(()=>filteredReports.value.slice((reportPage.value-1)*10,reportPage.value*10));
    watch([reportKind,reportKeyword],()=>reportPage.value=1);
    const correctedReport=r=>r.overdueScopeVersion===4?r:{...buildReport(r.kind,r.range,r.source,r.auto),id:r.id,name:r.name,generated:r.generated};
    const previewReport=r=>{activeReport.value=correctedReport(r);reportPreview.value=true;};
    const exportReport=r=>{
      r=correctedReport(r);
      const m=r.metrics,esc=E.safe;
      const table=(headers,items)=>'<table><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+items.map(row=>'<tr>'+row.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
      const html='<!DOCTYPE html><html lang="zh-CN"><meta charset="utf-8"><title>'+esc(r.name)+'</title><style>body{font:14px Microsoft YaHei,sans-serif;color:#24344d;max-width:1000px;margin:40px auto;line-height:1.9}h1{font-size:22px;font-weight:400}h2{font-size:16px;font-weight:400;color:#0879ff;margin-top:30px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8e5f4;padding:10px;text-align:left;font-weight:400}th{background:#eef6ff}@media print{body{margin:15mm}}</style><h1>'+esc(r.name)+'</h1><p>'+esc(E.day(new Date(r.range[0])))+' 至 '+esc(E.day(new Date(r.range[1])))+' · 生成时间 '+esc(r.generated)+'</p><h2>关键指标</h2>'+table(['报警总量','确认违规','误报','计划内事件','疑似','准确率','已闭环','闭环率','待复核','处置超期'],[[m.total,m.confirmed,m.mis,m.planned??'—',m.suspected??'—',E.fmt(m.accuracy),m.closed,E.fmt(m.closeRate),m.pending,m.disposalLate]])+'<h2>一、总体情况与改进建议</h2><ol>'+r.notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ol><h2>二、ai重点区域 TOP 5</h2>'+table(['区域','确认违规','已闭环','闭环率'],r.areas.map(a=>[a.name,a.confirmed,a.closed,E.fmt(a.closeRate)]))+'<h2>三、消防重点区域 TOP 5</h2>'+table(['区域','已闭环','闭环率'],(r.fireAreas||[]).map(a=>[a.name,a.closed,E.fmt(a.closeRate)]))+'<h2>四、ai报警违规事件类型表现</h2>'+table(['违规事件类型','报警量','确认违规','误报','计划内事件','疑似','准确率'],r.types.map(a=>[a.name,a.total,a.confirmed,a.mis,a.planned??'—',a.suspected??'—',E.fmt(a.accuracy)]))+'<h2>统计口径</h2><p>按报警发生时间归属周期，处置状态为生成时快照。准确率=确认违规/(确认违规+误报)，排除待复核、计划内事件和疑似。闭环率=（消防已闭环数+AI预警已闭环数）/（消防预警数+AI预警数）。AI识别准确率仅计算AI数据。无有效分母显示“—”。报告采用规则分析，不构成自动安全结论。</p></html>';
      E.download(r.name+'-'+E.day(new Date(r.range[0]))+'.html',new Blob([html],{type:'text/html;charset=utf-8'}));
    };
    const handleStorage=()=>{refresh();if(pageMode==='management'){reports.value=E.read(reportKey,[]);}};
    const seedReportRecords=()=>{
      if(localStorage.getItem('safety-report-demo-records-v2'))return;
      const added=[];
      for(const [kind,offset,auto] of [['daily',0,true],['daily',1,false],['weekly',0,true],['weekly',1,false],['monthly',0,true],['monthly',1,false]]){
        const at=new Date();if(kind==='daily')at.setDate(at.getDate()-offset);if(kind==='weekly')at.setDate(at.getDate()-offset*7);if(kind==='monthly'){at.setDate(1);at.setMonth(at.getMonth()-offset);}
        const period=E.completedPeriod(kind,at);
        if(reports.value.some(r=>r.kind===kind&&r.range[0]===period[0]&&!!r.auto===auto))continue;
        const report=buildReport(kind,period,'demo',auto);report.id='REPORT-DEMO-'+kind+'-'+period[0]+'-'+(auto?'auto':'manual');added.push(report);
      }
      const next=[...reports.value,...added].map(r=>{const {example,...rest}=r;return rest;}).sort((a,b)=>b.range[1]-a.range[1]||b.generated.localeCompare(a.generated));
      localStorage.setItem(reportKey,JSON.stringify(next));reports.value=next;localStorage.setItem('safety-report-demo-records-v2','1');
    };
    onMounted(()=>{const chart=document.querySelector('.st-rate-card');if(chart){rateObserver=new ResizeObserver(entries=>{rateWidth.value=Math.max(320,Math.round(entries[0].contentRect.width));});rateObserver.observe(chart);}window.addEventListener('storage',handleStorage);if(pageMode==='management'){try{seedReportRecords();}catch{notify('报告演示数据未保存，请检查浏览器存储','error');}checkSchedules();timer=setInterval(checkSchedules,60000);}});
    onBeforeUnmount(()=>{rateObserver?.disconnect();clearInterval(timer);clearTimeout(noticeTimer);window.removeEventListener('storage',handleStorage);});
    const theme={common:{primaryColor:'#0879ff',primaryColorHover:'#3d8fff',primaryColorPressed:'#065fd4',fontSize:'14px',fontWeightStrong:'400',borderRadius:'8px',textColorBase:'#24344d'},Button:{heightMedium:'36px',heightSmall:'30px',fontWeight:'400'},Input:{heightMedium:'36px',border:'1px solid #d8e2ef'}};
    watch(analysisSource,()=>{area.value=[];type.value=null;level.value=null;detailShow.value=false;});
    return {fireStatus:window.AlarmSourceRules.fireStatus,analysisSource,rateWidth,rateTicks,distribution,insight,openInsight,E,title,pageMode,source,refreshed,refresh,quick,range,area,type,level,department,tab,dimension,page,pageSize,notice,noticeType,quickOptions,selectQuick,selectRange,withinYear,validRange,rows,summary,prev,change,options,metricCards,dimensionOptions,tableGroups,tableTotals,visibleGroups,areaRanks,typeRanks,personRanks,series,points,rateSegments,chartMax,lineTicks,notes,detailShow,detailTitle,detailRows,detailPage,drill,visibleDetails,exportDetails,exportTable,reset,reports,reportPage,reportKeyword,reportKind,reportPreview,activeReport,generateShow,generateKind,generateRange,generateSource,reportDateDisabled,reportError,kinds,schedules,kindName,generate,chooseGenerateKind,openGenerate,saveSchedule,filteredReports,visibleReports,previewReport,exportReport,theme};
  },template:`
  <n-config-provider :theme-overrides="theme"><n-alert v-if="notice" :type="noticeType" class="st-toast" closable @close="notice=''">{{notice}}</n-alert><div :class="['st-stack',{'st-analysis-page':pageMode==='analysis'}]">
    <div class="st-header"><div><h1 class="st-title">{{title}}</h1><div class="st-aux st-heading-meta">平湖物流中心 · {{pageMode==='management'?'周期报告与生成记录':'报警识别与闭环处置统计'}}</div></div><div class="st-source"><n-button v-if="pageMode==='management'" class="hz-primary-btn" @click="openGenerate">生成报告</n-button></div></div>
    <template v-if="pageMode!=='management'">
      <n-tabs v-if="pageMode==='analysis'" v-model:value="analysisSource" type="line"><n-tab name="ai">AI报警</n-tab><n-tab name="fire">消防报警</n-tab></n-tabs>
      <div class="st-time-row"><div class="st-filter-top"><div class="st-time-controls"><n-radio-group :value="quick" @update:value="selectQuick"><n-radio-button v-for="o in quickOptions" :key="o.value" :value="o.value">{{o.label}}</n-radio-button></n-radio-group><n-date-picker class="st-inline-range" :value="range" type="datetimerange" clearable @update:value="selectRange" start-placeholder="开始时间" end-placeholder="结束时间" aria-label="报警时间范围" to="body" /></div><span class="st-aux">更新于 {{refreshed}}</span></div></div>
      <n-tabs v-if="pageMode==='reports'" v-model:value="tab" type="line"><n-tab name="alarm">报警报表</n-tab><n-tab name="case">AI查处报表</n-tab><n-tab name="fireCase">消防查处报表</n-tab></n-tabs>
      <section class="prod-surface-card st-filter"><div class="st-filter-line"><div class="st-field"><label>责任区域</label><area-cascader v-model:value="area" :options="options('area')" multiple cascade check-strategy="parent" clearable filterable placeholder="请选择责任区域（可多选）" to="body" /></div><div v-if="pageMode!=='reports'||tab==='alarm'" class="st-field"><label>{{pageMode==='analysis'&&analysisSource==='fire'?'消防报警类型':'违规事件类型'}}</label><n-select v-model:value="type" :options="options('type')" clearable filterable :placeholder="pageMode==='analysis'&&analysisSource==='fire'?'全部消防报警类型':'全部违规事件类型'" to="body" consistent-menu-width /></div><div v-if="(pageMode!=='reports'||tab==='alarm')&&!(pageMode==='analysis'&&analysisSource==='fire')" class="st-field"><label>报警等级</label><n-select v-model:value="level" :options="['一级','二级','三级','四级'].map(v=>({label:v,value:v}))" clearable placeholder="全部等级" to="body" consistent-menu-width /></div><n-button class="hz-soft-btn" @click="reset">重置</n-button></div></section>
      <template v-if="pageMode==='reports'">
        <section class="prod-surface-card st-table-shell"><div class="st-table-head"><h2 class="st-title">{{tab==='alarm'?'报警统计明细':tab==='fireCase'?'消防查处闭环明细':'AI查处闭环明细'}}</h2><n-space><n-select v-model:value="dimension" :options="dimensionOptions" style="width:155px" to="body" /><n-button class="hz-soft-btn" :disabled="!tableGroups.length" @click="exportTable">导出报表</n-button></n-space></div><div class="st-table-scroll"><table class="st-table"><thead><tr><th>统计分组<field-hint label="统计分组" /></th><template v-if="tab==='alarm'"><th>报警总量<field-hint label="报警总量" /></th><th>确认违规<field-hint label="确认违规" /></th><th>误报<field-hint label="误报" /></th><th>计划内事件<field-hint label="计划内事件" /></th><th>疑似<field-hint label="疑似" /></th><th>待复核<field-hint label="待复核" /></th><th>复核超期<field-hint label="复核超期" /></th><th>准确率<field-hint label="准确率" /></th><th>复核率<field-hint label="复核率" /></th></template><template v-else><th>{{tab==='fireCase'?'报警总量':'确认违规'}}<field-hint :label="tab==='fireCase'?'报警总量':'确认违规'" /></th><th>待处置<field-hint label="待处置" /></th><th>已闭环<field-hint label="已闭环" /></th><th>闭环率<field-hint label="闭环率" /></th><th>处置超期<field-hint label="处置超期" /></th><template v-if="tab!=='fireCase'"><th>平均时长 / 分钟<field-hint label="平均时长 / 分钟" /></th></template></template><th>操作</th></tr></thead><tbody><tr v-for="g in visibleGroups" :key="g.name"><td>{{g.name}}</td><template v-if="tab==='alarm'"><td>{{g.total}}</td><td>{{g.confirmed}}</td><td>{{g.mis}}</td><td>{{g.planned}}</td><td>{{g.suspected}}</td><td>{{g.pending}}</td><td>{{g.reviewLate}}</td><td>{{E.fmt(g.accuracy)}}</td><td>{{E.fmt(g.reviewRate)}}</td></template><template v-else><td>{{tab==='fireCase'?g.total:g.confirmed}}</td><td>{{g.processing}}</td><td>{{g.closed}}</td><td>{{E.fmt(g.closeRate)}}</td><td>{{g.disposalLate}}</td><template v-if="tab!=='fireCase'"><td>{{g.avgMinutes??'—'}}</td></template></template><td><n-button class="prod-row-action" size="small" @click="drill(g.rows,g.name,'total',{dimension:dimension,name:g.name})">查看明细</n-button></td></tr></tbody><tfoot class="st-report-totals"><tr><td>合计<div class="st-aux">全部筛选结果</div></td><template v-if="tab==='alarm'"><td>{{tableTotals.total}}</td><td>{{tableTotals.confirmed}}</td><td>{{tableTotals.mis}}</td><td>{{tableTotals.planned}}</td><td>{{tableTotals.suspected}}</td><td>{{tableTotals.pending}}</td><td>{{tableTotals.reviewLate}}</td><td>{{E.fmt(tableTotals.accuracy)}}</td><td>{{E.fmt(tableTotals.reviewRate)}}</td></template><template v-else><td>{{tab==='fireCase'?tableTotals.total:tableTotals.confirmed}}</td><td>{{tableTotals.processing}}</td><td>{{tableTotals.closed}}</td><td>{{E.fmt(tableTotals.closeRate)}}</td><td>{{tableTotals.disposalLate}}</td><template v-if="tab!=='fireCase'"><td>{{tableTotals.avgMinutes??'—'}}</td></template></template><td><n-button class="prod-row-action" size="small" :disabled="!tableTotals.total" @click="drill(tab!=='alarm'?rows.filter(E.caseEligible):rows,'全部筛选结果')">查看明细</n-button></td></tr></tfoot></table><prod-empty-state v-if="!tableGroups.length" /></div><div class="st-page"><span>共 {{tableGroups.length}} 组</span></div></section>
      </template>
      <template v-else>
        <div class="st-grid"><section class="prod-surface-card st-card"><div class="st-card-head"><h2 class="st-title">{{analysisSource==='fire'?'消防报警与已处置趋势':'AI报警与确认违规趋势'}}</h2><span class="st-aux">每日 / 条</span></div><svg v-if="rows.length" class="st-line-svg" viewBox="0 0 730 225" role="img" aria-label="报警与确认违规日趋势"><line v-for="i in 4" :key="i" x1="45" :y1="30+(i-1)*50" x2="695" :y2="30+(i-1)*50" stroke="#e7eef8"/><text x="8" y="35" fill="#8190a5" font-size="12">{{chartMax}}</text><text x="20" y="184" fill="#8190a5" font-size="12">0</text><polyline :points="points('total',chartMax)" fill="none" stroke="#0879ff" stroke-width="3"/><polyline :points="points(analysisSource==='fire'?'closed':'confirmed',chartMax)" fill="none" stroke="#12a36a" stroke-width="2"/><text v-for="(t,i) in lineTicks" :key="t.name" :x="45+series.findIndex(s=>s.name===t.name)*650/Math.max(1,series.length-1)" y="210" :text-anchor="i===0?'start':i===lineTicks.length-1?'end':'middle'" fill="#8190a5" font-size="12">{{t.name.slice(5)}}</text></svg><prod-empty-state v-else /><div class="st-line-legend"><span><i class="st-dot"></i>{{analysisSource==='fire'?'消防报警总量':'AI报警总量'}}</span><span><i class="st-dot green"></i>{{analysisSource==='fire'?'已处置':'确认违规'}}</span></div></section><section class="prod-surface-card st-card"><div class="st-card-head"><h2 class="st-title">{{analysisSource==='fire'?'消防处置状态分布':'复核结果分布'}}</h2><n-button text type="primary" @click="drill(rows,'全部报警')">查看明细</n-button></div><div v-if="summary.total" class="st-donut-layout"><svg class="st-donut" viewBox="0 0 220 220" role="img" aria-label="复核结果占比"><circle cx="110" cy="110" r="82" fill="none" stroke="#eef6ff" stroke-width="24"/><circle v-for="d in distribution.filter(d=>d.value)" :key="d.key" cx="110" cy="110" r="82" fill="none" :stroke="d.color" stroke-width="24" pathLength="100" :stroke-dasharray="d.share+' '+(100-d.share)" :stroke-dashoffset="-d.offset" transform="rotate(-90 110 110)"><title>{{d.name}} {{d.value}} 条 · {{E.fmt(E.percent(d.value,summary.total))}}</title></circle><text x="110" y="103" text-anchor="middle" fill="#8190a5" font-size="12">报警总量</text><text x="110" y="135" text-anchor="middle" fill="#172033" font-size="30" font-family="D-DIN-PRO, Microsoft YaHei">{{summary.total}}</text></svg><div class="st-donut-legend"><button v-for="d in distribution" :key="d.key" class="st-donut-item" @click="drill(rows,d.name,d.key)"><span class="st-donut-label"><i :style="{background:d.color}"></i>{{d.name}}<field-hint :label="d.key==='distributionConfirmed'?'确认违规':d.name" /></span><span class="st-donut-values"><strong>{{d.value}}</strong><span>{{E.fmt(E.percent(d.value,summary.total))}}</span></span></button></div></div><prod-empty-state v-else /></section></div>
        <div class="st-grid equal"><section class="prod-surface-card st-card"><div class="st-card-head"><h2 class="st-title">{{analysisSource==='fire'?'消防报警类型排行':'违规事件类型排行'}}</h2><n-button text type="primary" @click="E.csv(analysisSource==='fire'?'消防报警类型分析.csv':'违规事件类型分析.csv',analysisSource==='fire'?['消防报警类型','报警总量']:['违规事件类型','报警总量','准确率'],typeRanks.map(g=>analysisSource==='fire'?[g.name,g.total]:[g.name,g.total,E.fmt(g.accuracy)]))">导出</n-button></div><div v-if="typeRanks.length" class="st-type-ranks"><button v-for="(g,i) in typeRanks" :key="g.name" class="st-type-rank" @click="drill(g.rows,g.name)"><span class="st-type-order">{{i+1}}</span><span class="st-type-info"><span class="st-type-name">{{g.name}}</span><span class="st-type-progress"><i :style="{width:(g.total/Math.max(1,...typeRanks.map(t=>t.total))*100)+'%'}"></i></span></span><span class="st-type-count">{{g.total}}<small>条</small></span><span v-if="analysisSource!=='fire'" class="st-type-accuracy">准确率<field-hint label="准确率" /><strong>{{E.fmt(g.accuracy)}}</strong></span></button></div><prod-empty-state v-else /></section><section class="prod-surface-card st-card"><div class="st-card-head"><h2 class="st-title">{{analysisSource==='fire'?'消防报警区域分布':'确认违规区域分布'}}</h2><span class="st-aux">TOP 10</span></div><stats-bars :rows="areaRanks" field="confirmed" :limit="10" /></section></div>
        <div class="st-analysis-effects"><section v-for="field in (analysisSource==='fire'?['closeRate']:['accuracy','closeRate'])" :key="field" class="prod-surface-card st-card st-rate-card"><div class="st-card-head"><h2 class="st-title">{{field==='accuracy'?'识别准确率趋势':'处置闭环率趋势'}}<field-hint :label="field==='accuracy'?'识别准确率趋势':'处置闭环率趋势'" /></h2><span class="st-aux">每日 / %</span></div><svg v-if="series.some(s=>s[field]!==null)" class="st-line-svg st-rate-svg" :viewBox="'0 0 '+rateWidth+' 225'" role="img" :aria-label="field==='accuracy'?'识别准确率日趋势':'处置闭环率日趋势'"><g v-for="value in [0,25,50,75,100]" :key="value"><line x1="45" :y1="180-value*1.5" :x2="rateWidth-35" :y2="180-value*1.5" stroke="#e7eef8"/><text x="34" :y="184-value*1.5" text-anchor="end" fill="#8190a5" font-size="12">{{value}}</text></g><polyline v-for="(segment,j) in rateSegments(field)" :key="j" :points="segment" fill="none" :stroke="field==='accuracy'?'#0879ff':'#12a36a'" stroke-width="2"/><circle v-for="s in series.filter(s=>s[field]!==null)" :key="s.name" :cx="45+series.findIndex(t=>t.name===s.name)*(rateWidth-80)/Math.max(1,series.length-1)" :cy="180-s[field]*1.5" r="4" tabindex="0" :fill="field==='accuracy'?'#0879ff':'#12a36a'"><title>{{s.name}} · {{field==='accuracy'?'识别准确率':'处置闭环率'}} {{E.fmt(s[field])}}
{{field==='accuracy'?'确认违规 '+s.confirmed+' 条 · 误报 '+s.mis+' 条 · 有效样本 '+(s.confirmed+s.mis)+' 条':'已闭环 '+s.closed+' 条 · 应处置 '+(analysisSource==='fire'?s.total:s.confirmed)+' 条 · 待闭环 '+((analysisSource==='fire'?s.total:s.confirmed)-s.closed)+' 条'}}</title></circle><text v-for="(t,i) in rateTicks" :key="t.name" :x="45+series.findIndex(s=>s.name===t.name)*(rateWidth-80)/Math.max(1,series.length-1)" y="210" :text-anchor="i===0?'start':i===rateTicks.length-1?'end':'middle'" fill="#8190a5" font-size="12">{{t.name.slice(5)}}</text></svg><prod-empty-state v-else :description="field==='accuracy'?'暂无有效识别样本':'暂无确认违规记录'" /><div class="st-line-legend"><span><i :class="['st-dot',{green:field==='closeRate'}]"></i>{{field==='accuracy'?'识别准确率':'处置闭环率'}}</span></div></section><section v-if="analysisSource!=='fire'" class="prod-surface-card st-card st-ai-analysis"><div class="st-ai-heading"><div class="st-ai-brand"><span class="st-ai-icon"><i class="fa fa-magic" aria-hidden="true"></i></span><div><h2 class="st-title">智能分析</h2><span class="st-aux">围绕当前查询结果的综合研判与行动建议</span></div></div></div><div class="st-ai-conclusion"><div><span class="st-ai-eyebrow">综合研判</span><h3>{{insight.headline}}</h3><p>{{insight.narrative}}</p></div><div class="st-ai-evidence"><span :class="['st-chip',{orange:insight.late}]">{{insight.priority}}</span><div><span>分析记录<field-hint label="分析记录" /></span><strong>{{summary.total}}<small>条</small></strong></div><div><span>待闭环事件<field-hint label="待闭环事件" /></span><strong>{{summary.waiting+summary.processing}}<small>条</small></strong></div><div><span>未完成处置超期<field-hint label="未完成处置超期" /></span><strong>{{insight.late}}<small>条</small></strong></div></div></div><div v-if="insight.actions.length" class="st-ai-strategies"><article v-for="(action,i) in insight.actions" :key="action.key" :class="['st-ai-strategy',action.tone]"><div class="st-ai-strategy-top"><span>0{{i+1}}</span><h3>{{action.title}}</h3></div><div class="st-ai-strategy-evidence">{{action.evidence}}</div><p>{{action.advice}}</p><n-button text type="primary" @click="openInsight(action)">{{action.button}} <i class="fa fa-angle-right" style="margin-left:6px" aria-hidden="true"></i></n-button></article></div></section></div>
      </template>
      
    </template>
    <template v-else>
      <section class="prod-surface-card st-card"><div class="st-card-head"><h2 class="st-title">周期自动生成<field-hint label="周期自动生成" /></h2></div><div class="st-schedule"><div v-for="kind in kinds.filter(k=>k.value!=='custom')" :key="kind.value" class="st-schedule-item"><div class="st-schedule-title"><span>{{kind.label}}<field-hint :label="kind.label" /></span><n-switch :value="schedules[kind.value]" @update:value="v=>saveSchedule(kind.value,v)" :aria-label="'自动生成'+kind.label" /></div><div class="st-aux">{{kind.value==='daily'?'前一自然日':kind.value==='weekly'?'前一完整自然周（周一至周日）':'前一完整自然月'}}</div><div class="st-aux">开启后，页面在线时于{{kind.value==='daily'?'每日':kind.value==='weekly'?'每周一':'每月1日'}} 09:00 后自动生成。<br>当前状态：{{schedules[kind.value]?'已开启':'未开启'}}</div></div></div></section>
      <section class="prod-surface-card st-table-shell"><div class="st-table-head"><h2 class="st-title">报告记录</h2><n-space><n-input v-model:value="reportKeyword" placeholder="搜索报告名称" clearable style="width:220px" /><n-select v-model:value="reportKind" :options="kinds" placeholder="全部报告类型" clearable style="width:160px" to="body" /></n-space></div><div class="st-table-scroll"><table class="st-table"><thead><tr><th>报告名称</th><th>统计周期<field-hint label="统计周期" /></th><th>报告类型<field-hint label="报告类型" /></th><th>生成时间<field-hint label="生成时间" /></th><th>操作</th></tr></thead><tbody><tr v-for="r in visibleReports" :key="r.id"><td>{{r.name}}</td><td class="nowrap">{{E.day(new Date(r.range[0]))}}<br>{{E.day(new Date(r.range[1]))}}</td><td>{{kindName(r.kind)}}</td><td>{{r.generated}}</td><td><n-space :wrap="false" :size="8"><n-button class="prod-row-action" size="small" @click="previewReport(r)">预览</n-button><n-button class="prod-row-action" size="small" @click="exportReport(r)">下载报告</n-button></n-space></td></tr></tbody></table><prod-empty-state v-if="!filteredReports.length" description="暂无报告，点击“生成报告”或开启周期自动生成" /></div><div class="st-page"><span>共 {{filteredReports.length}} 份</span><n-pagination v-model:page="reportPage" :page-size="10" :item-count="filteredReports.length" /></div></section>
    </template>
  </div>
  <n-drawer v-model:show="detailShow" width="min(1100px,100vw)" class="st-drawer"><n-drawer-content :title="detailTitle+' · 明细'" closable><div class="st-table-scroll" style="max-height:none"><table class="st-table"><thead><tr><th>报警ID / 时间</th><th>{{analysisSource==='fire'?'区域 / 消防报警类型':'区域 / 违规事件类型'}}</th><th>部门 / 责任人</th><th v-if="analysisSource!=='fire'">复核结果</th><th>查处状态</th><th>处置超期<field-hint label="处置超期" /></th></tr></thead><tbody><tr v-for="r in visibleDetails" :key="r.id"><td>{{r.id}}<div class="st-aux">{{r.time}}</div></td><td>{{r.area}}<div class="st-aux">{{r.type}}</div></td><td>{{r.department}}<div class="st-aux">{{r.owner}}</div></td><td v-if="analysisSource!=='fire'">{{r.status==='已复核'?r.result:'待复核'}}</td><td>{{analysisSource==='fire'?fireStatus(r):r.caseStatus}}</td><td>{{r.disposalLate?'是':'否'}}</td></tr></tbody></table><prod-empty-state v-if="!detailRows.length" /></div><div class="st-page"><span>共 {{detailRows.length}} 条</span><n-pagination v-model:page="detailPage" :page-size="10" :item-count="detailRows.length" /></div><template #footer><n-space justify="center"><n-button class="hz-soft-btn" @click="detailShow=false">关闭</n-button><n-button class="hz-primary-btn" :disabled="!detailRows.length" @click="exportDetails(detailRows)">导出明细</n-button></n-space></template></n-drawer-content></n-drawer>

  <n-modal v-model:show="generateShow" preset="card" title="生成安全管理报告" class="st-modal" :mask-closable="false"><div class="st-form-field"><label>报告类型</label><n-select value="custom" :options="[{label:'自定义报告',value:'custom'}]" disabled to="body" /></div><div class="st-form-field"><label>统计周期</label><n-date-picker v-model:value="generateRange" :is-date-disabled="reportDateDisabled" type="datetimerange" @update:value="generateKind='custom'" to="body" style="width:100%" /></div><p class="st-aux">仅支持选择昨日及之前的日期。按整个平湖物流中心生成关键指标、AI与消防区域排行、AI违规事件类型表现及改进建议，保存为独立快照。</p><n-alert v-if="reportError" type="error">{{reportError}}</n-alert><template #footer><n-space justify="center"><n-button class="hz-soft-btn" @click="generateShow=false">取消</n-button><n-button class="hz-primary-btn" @click="generate">立即生成报告</n-button></n-space></template></n-modal>
  <n-drawer v-model:show="reportPreview" width="min(1000px,100vw)" class="st-drawer"><n-drawer-content title="安全管理报告预览" closable><template v-if="activeReport"><section class="st-report-cover"><h2>{{activeReport.name}}</h2><div class="st-aux">{{E.day(new Date(activeReport.range[0]))}} 至 {{E.day(new Date(activeReport.range[1]))}}</div><div class="st-aux">生成于 {{activeReport.generated}} · {{activeReport.auto?'自动生成':'手动生成'}}</div><div v-if="activeReport.demoMix" class="st-aux">模拟数据：AI预警与消防报警数量约为7:3，消防区域汇总到二级。</div><div class="st-report-metrics"><div><span class="st-aux">报警总量<field-hint label="报警总量" /></span><strong>{{activeReport.metrics.total}}</strong></div><div><span class="st-aux">ai预警识别准确率<field-hint label="ai预警识别准确率" /></span><strong>{{E.fmt(activeReport.metrics.accuracy)}}</strong></div><div><span class="st-aux">闭环率<field-hint label="闭环率" /></span><strong>{{E.fmt(activeReport.metrics.closeRate)}}</strong></div><div><span class="st-aux">处置超期<field-hint label="处置超期" /></span><strong>{{activeReport.metrics.disposalLate}}</strong></div></div></section><section class="st-section"><h3 class="st-section-title">一、总体情况与改进建议</h3><ul class="st-notes"><li v-for="n in activeReport.notes" :key="n">{{n}}</li></ul></section><section class="st-section"><h3 class="st-section-title">二、ai重点区域 TOP 5</h3><table class="st-table"><thead><tr><th>区域</th><th>确认违规<field-hint label="确认违规" /></th><th>已闭环<field-hint label="已闭环" /></th><th>闭环率<field-hint label="AI区域闭环率" /></th></tr></thead><tbody><tr v-for="a in activeReport.areas" :key="a.name"><td>{{a.name}}</td><td>{{a.confirmed}}</td><td>{{a.closed}}</td><td>{{E.fmt(a.closeRate)}}</td></tr></tbody></table><prod-empty-state v-if="!activeReport.areas.length" /></section><section class="st-section"><h3 class="st-section-title">三、消防重点区域 TOP 5</h3><table class="st-table"><thead><tr><th>区域</th><th>已闭环<field-hint label="已闭环" /></th><th>闭环率<field-hint label="消防区域闭环率" /></th></tr></thead><tbody><tr v-for="a in activeReport.fireAreas" :key="a.name"><td>{{a.name}}</td><td>{{a.closed}}</td><td>{{E.fmt(a.closeRate)}}</td></tr></tbody></table><prod-empty-state v-if="!activeReport.fireAreas?.length" /></section><section class="st-section"><h3 class="st-section-title">四、ai报警违规事件类型表现</h3><table class="st-table"><thead><tr><th>违规事件类型</th><th>报警量<field-hint label="报警量" /></th><th>确认违规<field-hint label="确认违规" /></th><th>误报<field-hint label="误报" /></th><th>计划内事件<field-hint label="计划内事件" /></th><th>疑似<field-hint label="疑似" /></th><th>准确率<field-hint label="准确率" /></th></tr></thead><tbody><tr v-for="a in activeReport.types" :key="a.name"><td>{{a.name}}</td><td>{{a.total}}</td><td>{{a.confirmed}}</td><td>{{a.mis}}</td><td>{{a.planned??'—'}}</td><td>{{a.suspected??'—'}}</td><td>{{E.fmt(a.accuracy)}}</td></tr></tbody></table><prod-empty-state v-if="!activeReport.types.length" /></section><p class="st-aux">统计按报警发生时间归属周期，不含今日数据；处置超期仅统计未完成处理的超期报警，状态截至报告生成时。</p></template><template #footer><n-space justify="center"><n-button class="hz-soft-btn" @click="reportPreview=false">关闭</n-button><n-button class="hz-primary-btn" v-if="activeReport" @click="exportReport(activeReport)">下载报告</n-button></n-space></template></n-drawer-content></n-drawer>
  </n-config-provider>`}).component('area-cascader',window.AreaCascade.cascader()).use(naive).mount('#statisticsApp');
})();
