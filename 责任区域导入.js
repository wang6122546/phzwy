(() => {
  const D=window.ResponsibilityData;
  const str=v=>String(v??'').trim();
  const headers={department:['部门名称','部门','所属部门'],name:['人员姓名','姓名'],phone:['手机号','手机号码','联系电话'],mode:['管辖方式'],building:['楼栋/场所','楼栋 / 场所','楼栋','场所','楼栋名称'],floor:['楼层','楼层名称'],area:['区域','区域名称']};
  const csv=text=>{
    const rows=[];let row=[],cell='',quoted=false;
    text=text.replace(/^\uFEFF/,'');
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!cell||quoted)quoted=!quoted;else cell+=ch;}
      else if(ch===','&&!quoted){row.push(cell);cell='';}
      else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
      else cell+=ch;
    }
    if(quoted)throw Error('CSV 引号未闭合，请检查文件');
    if(cell||row.length){row.push(cell);rows.push(row);}return rows;
  };
  const plan=(matrix,type)=>{
    if(!['department','person'].includes(type))throw Error('请选择导入类型');
    if(matrix.length>2001)throw Error('单次最多导入 2000 行，请拆分文件');
    const first=matrix[0]||[],columns={};
    for(const [field,aliases] of Object.entries(headers)){
      const matches=first.map((v,i)=>aliases.includes(str(v))?i:-1).filter(i=>i>=0);
      if(matches.length>1)throw Error('表头重复：'+aliases[0]);columns[field]=matches[0]??-1;
    }
    const required=type==='department'?['department','building','floor','area']:['name','building','floor','area'];
    const missing=required.filter(k=>columns[k]<0);if(missing.length)throw Error('缺少表头：'+missing.map(k=>headers[k][0]).join('、'));
    const preview=[],groups=new Map();
    matrix.slice(1).forEach((values,index)=>{
      if(!values.some(v=>str(v)))return;
      const get=k=>columns[k]<0?'':str(values[columns[k]]),messages=[];
      const row={line:index+2,department:get('department'),name:get('name'),phone:get('phone'),mode:type==='person'?(columns.mode<0?'独立配置':get('mode')):'部门管辖',building:get('building'),floor:get('floor'),area:get('area'),errors:messages,places:[]};
      const depts=D.departments.filter(d=>d.type==='department'&&d.name===row.department);
      if(type==='department'&&depts.length!==1)messages.push(depts.length?'部门名称不唯一':'部门不存在，请使用已有部门名称');
      let person;
      if(type==='person'){
        const matches=D.people.filter(p=>(!row.department||p.departmentId===depts[0]?.id)&&p.name===row.name&&(!row.phone||p.phone===row.phone));
        if(matches.length!==1)messages.push(matches.length?'人员重名，请填写手机号':'人员与所属部门或手机号不匹配');
        person=matches[0];
        if(person&&!row.department)row.department=D.departments.find(d=>d.id===person.departmentId)?.name||'';
        const modes={'跟随部门':'department','按部门':'department','独立配置':'personal','按个人':'personal'};
        row.modeValue=modes[row.mode];if(!row.modeValue)messages.push('管辖方式请填写“跟随部门”或“独立配置”');
      }
      if(type==='person'&&row.modeValue==='department'){
        if(row.building||row.floor||row.area)messages.push('跟随部门时请留空楼栋、楼层和区域');
      }else{
        const building=D.buildings.find(b=>b.name===row.building);
        if(!building)messages.push('楼栋/场所不存在');
        else if(!row.floor||['全部','全部楼层'].includes(row.floor)){
          if(row.area&&!['全部','全部区域'].includes(row.area))messages.push('指定区域时必须填写楼层');
          else row.places=D.descendants(building.id);
        }else{
          const floor=D.floors.find(f=>f.buildingId===building.id&&f.name===row.floor);
          if(!floor)messages.push('该楼栋下不存在此楼层');
          else if(!row.area||['全部','全部区域'].includes(row.area))row.places=D.descendants(floor.id);
          else{
            const names=[...new Set(row.area.split(/[、;；|\n]/).map(str).filter(Boolean))];
            names.forEach(name=>{const a=D.areas.find(a=>a.floorId===floor.id&&a.name===name);if(a)row.places.push(a.id);else messages.push('该楼层下不存在区域：'+name);});
          }
        }
      }
      row.targetId=type==='department'?depts[0]?.id:person?.id;
      if(row.targetId){
        const key=row.targetId;
        if(!groups.has(key))groups.set(key,{id:key,name:type==='department'?row.department:row.name,mode:row.modeValue,places:new Set(),rows:[]});
        const group=groups.get(key);group.rows.push(row);row.places.forEach(id=>group.places.add(id));
      }
      preview.push(row);
    });
    if(!preview.length)throw Error('文件中没有可导入的数据');
    for(const group of groups.values()){
      if(new Set(group.rows.map(r=>r.modeValue)).size>1)group.rows.forEach(r=>r.errors.push('同一人员不能同时使用跟随部门和独立配置'));
    }
    return {type,rows:preview,groups:[...groups.values()].map(g=>({...g,places:[...g.places]})),errors:preview.filter(r=>r.errors.length).length};
  };
  const apply=(state,result,strategy='merge')=>{
    if(!result?.rows?.length||result.errors||result.rows.some(r=>r.errors.length))throw Error('请先修正全部错误再导入');
    if(!['merge','replace'].includes(strategy))throw Error('请选择导入方式');
    const next=JSON.parse(JSON.stringify(state));
    for(const g of result.groups){
      if(result.type==='department'){
        const prev=next.departments[g.id]||D.blank();
        next.departments[g.id]=strategy==='replace'?{places:g.places,devices:[],videos:[]}:{...prev,places:[...new Set([...(prev.places||[]),...g.places])]};
      }else if(g.mode==='department')next.people[g.id]={mode:'department',scope:next.people[g.id]?.scope||D.blank()};
      else{
        const prev=next.people[g.id]?.mode==='personal'?next.people[g.id].scope:D.blank();
        next.people[g.id]={mode:'personal',scope:strategy==='replace'?{places:g.places,devices:[],videos:[]}:{...prev,places:[...new Set([...(prev.places||[]),...g.places])]}};
      }
    }
    return next;
  };
  const download=(name,rows)=>{
    const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    const safe=v=>/^[=+@\-\t\r]/.test(String(v??''))?"'"+v:v;
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(v=>quote(safe(v))).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const template=type=>download(type==='department'?'部门管辖导入模板.csv':'人员管辖导入模板.csv',type==='department'?
    [['楼栋/场所','楼层','区域','部门名称'],['1#仓库','1层','全部区域','安全环保部'],['1#仓库','2层','货架区、装卸作业区','安全环保部']]:
    [['楼栋/场所','楼层','区域','人员姓名','手机号码'],['1#仓库','1层','货架区','李强','13800001002'],['1#仓库','2层','装卸作业区','王敏','13800001003']]);
  const directory=()=>download('管辖导入名称对照表.csv',[['楼栋/场所','楼层','区域'],...D.areas.map(a=>{const f=D.floors.find(f=>f.id===a.floorId),b=D.buildings.find(b=>b.id===f.buildingId);return [b.name,f.name,a.name];})]);
  let libraryPromise;
  const excel=()=>{
    if(window.XLSX)return Promise.resolve(window.XLSX);
    if(libraryPromise)return libraryPromise;
    libraryPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='assets/vendor/xlsx.full.min.js';
      const timer=setTimeout(()=>{script.remove();libraryPromise=null;reject(Error('Excel 解析组件加载超时，可将表格另存为 CSV 后导入'));},20000);
      script.onload=()=>{clearTimeout(timer);if(window.XLSX)resolve(window.XLSX);else{libraryPromise=null;reject(Error('Excel 解析组件不可用'));}};
      script.onerror=()=>{clearTimeout(timer);libraryPromise=null;reject(Error('Excel 解析组件加载失败，可将表格另存为 CSV 后导入'));};document.head.appendChild(script);
    });return libraryPromise;
  };
  const read=async file=>{
    if(file.size>5*1024*1024)throw Error('文件不能超过 5 MB');
    const ext=file.name.split('.').pop().toLowerCase();if(!['xlsx','xls','csv'].includes(ext))throw Error('请选择 XLSX、XLS 或 CSV 文件');
    const buffer=await file.arrayBuffer();
    if(ext==='csv'){
      let text=new TextDecoder('utf-8').decode(buffer);if(text.includes('\uFFFD'))text=new TextDecoder('gb18030').decode(buffer);return csv(text);
    }
    const X=await excel(),book=X.read(buffer,{type:'array',sheetRows:2002,cellFormula:true});
    const name=book.SheetNames[0];if(!name)throw Error('工作簿没有工作表');const sheet=book.Sheets[name];
    if(Object.values(sheet).some(cell=>cell&&typeof cell==='object'&&cell.f))throw Error('导入表中包含公式，请复制并粘贴为数值后再导入');
    return X.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,blankrows:true});
  };
  window.ResponsibilityImport={csv,plan,apply,download,template,directory,read};
})();
