(() => {
  const buildings = [], floors = [], areas = [], devices = [], videos = [];
  const addArea = (id, name, floorId, videoNames) => {
    areas.push({id, name, floorId});
    videoNames.forEach((name, i) => videos.push({id: 'video-' + id + '-' + i, name, areaId: id, code: 'SP-' + String(videos.length + 1).padStart(3, '0')}));
  };
  for (let b = 1; b <= 4; b++) {
    const buildingId = 'warehouse-' + b;
    buildings.push({id: buildingId, name: b + '#仓库'});
    for (let f = 1; f <= 3; f++) {
      const floorId = buildingId + '-f' + f;
      floors.push({id: floorId, name: f + '层', buildingId});
      addArea(floorId + '-rack', '货架区', floorId, [b + '库' + f + '楼A区货架通道摄像头', b + '库' + f + '楼B区货架通道摄像头']);
      addArea(floorId + '-passage', '人行通廊', floorId, [b + '库' + f + '楼人行通廊摄像头']);
      addArea(floorId + '-loading', '装卸作业区', floorId, [b + '库' + f + '楼装卸作业区摄像头']);
    }
    floors.push({id: buildingId + '-roof', name: '屋顶', buildingId});
    addArea(buildingId + '-roof-pv', '屋顶光伏区', buildingId + '-roof', [b + '#仓库屋顶监控1']);
  }
  buildings.push({id:'support',name:'园区配套区域'});
  floors.push({id:'support-ground',name:'地面区域',buildingId:'support'},{id:'support-office',name:'办公楼3层',buildingId:'support'});
  [
    ['ring-1','1号交通环',['1号交通环三层到二层','1号交通环二层到一层']],
    ['ring-2','2号交通环',['2号交通环一层到二层','2号交通环二层到三层']],
    ['power','配电房',['变压房3','高压房2']],['generator','发电机房',['发电房1']],
    ['pump','水泵房',['水泵房','水泵控制室']],['charging','叉车充电间',['充电间固定01','新充电间01']],
    ['kitchen','厨房',['厨房烹饪区1']],['parking','停车场',['停车场出入口摄像头']]
  ].forEach(([id,name,names]) => addArea(id,name,'support-ground',names));
  addArea('it','IT机房','support-office',['办公三楼机房内','UPS房1']);
  [['power','配电房环境监测设备'],['pump','水泵房水位监测设备'],['charging','充电间烟感设备'],['kitchen','厨房燃气监测设备']].forEach(([areaId,name],i)=>devices.push({id:'device-'+i,name,areaId,code:'SB-'+String(i+1).padStart(3,'0')}));
  const departments=[{id:'company',name:'深圳中外运物流有限公司',type:'company'},{id:'pinghu',name:'平湖物流中心',parentId:'company',type:'group'}, {id:'safety',name:'安全环保部',parentId:'pinghu',type:'department'}, {id:'general',name:'综合管理部',parentId:'pinghu',type:'department'}, {id:'production',name:'生产计划部',parentId:'pinghu',type:'department'}];
  const people=[['张安全','安全管理'],['李强','安全巡查'],['王敏','安全管理专员'],['王值守','值守'],['张三','现场处置'],['王伟','现场处置'],['刘刚','现场处置'],['赵强','现场处置'],['李四','现场处置']].map(([name,post],i)=>({id:'person-'+i,name,post,departmentId:i<4?'safety':i<6?'general':'production',phone:'1380000'+String(1001+i).padStart(4,'0')}));
  const blank=()=>({places:[],devices:[],videos:[]});
  const initial=()=>({version:3,departments:{safety:{places:['warehouse-1-f1','warehouse-1-f2-rack','power','pump'],devices:[],videos:[]},general:{places:['kitchen','parking','it'],devices:[],videos:[]},production:{places:['warehouse-1','warehouse-2','ring-1','ring-2'],devices:[],videos:[]}},people:Object.fromEntries(people.map(p=>[p.id,p.id==='person-1'?{mode:'personal',scope:{places:['warehouse-1-f1-rack'],devices:[],videos:[]}}:p.id==='person-2'?{mode:'personal',scope:{places:['power','pump'],devices:[],videos:[]}}:{mode:'department',scope:blank()}]))});
  const placeNodes=[...buildings,...floors,...areas];
  const descendants=id=>areas.filter(a=>a.id===id||a.floorId===id||floors.some(f=>f.id===a.floorId&&f.buildingId===id)).map(a=>a.id);
  // Spatial assets and explicitly linked assets form a union, so statistics never double-count.
  const resolve=scope=>{
    const s=scope||blank(), areaIds=new Set((s.places||[]).flatMap(descendants));
    const ds=devices.filter(d=>areaIds.has(d.areaId)||(s.devices||[]).includes(d.id));
    const vs=videos.filter(v=>areaIds.has(v.areaId)||(s.videos||[]).includes(v.id));
    const floorIds=new Set(areas.filter(a=>areaIds.has(a.id)).map(a=>a.floorId));
    const buildingIds=new Set(floors.filter(f=>floorIds.has(f.id)).map(f=>f.buildingId));
    return {areas:[...areaIds],floors:[...floorIds],buildings:[...buildingIds],devices:ds.map(d=>d.id),videos:vs.map(v=>v.id)};
  };
  const path=areaId=>{const a=areas.find(a=>a.id===areaId),f=floors.find(f=>f.id===a?.floorId),b=buildings.find(b=>b.id===f?.buildingId);return [b?.name,f?.name,a?.name].filter(Boolean).join(' / ');};
  const tree=buildings.map(b=>({key:b.id,label:b.name,children:floors.filter(f=>f.buildingId===b.id).map(f=>({key:f.id,label:f.name,children:areas.filter(a=>a.floorId===f.id).map(a=>({key:a.id,label:a.name}))}))}));
  window.ResponsibilityData={buildings,floors,areas,devices,videos,departments,people,placeNodes,blank,initial,descendants,resolve,path,tree,key:'sinotrans-responsibility-v1'};
})();
