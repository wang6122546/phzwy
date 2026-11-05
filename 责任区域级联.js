(() => {
  const path = value => String(value || '').split(/\s*\/\s*|\s*>\s*|-/).map(part => part.trim()).filter(Boolean).join(' / ');
  const selection = value => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(path).filter(Boolean);
    try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.map(path).filter(Boolean); } catch {}
    return [path(value)];
  };
  const matches = (selected, value) => {
    const list = selection(selected), current = path(value);
    return !list.length || list.some(item => current === item || current.startsWith(item + ' / '));
  };
  const options = values => {
    const roots = [];
    [...new Set(values.filter(Boolean).map(path))].sort().forEach(value => {
      let children = roots, prefix = '';
      value.split(' / ').forEach(label => {
        prefix = prefix ? prefix + ' / ' + label : label;
        let node = children.find(item => item.value === prefix);
        if (!node) { node = {label, value:prefix, children:[]}; children.push(node); }
        children = node.children;
      });
    });
    const prune = nodes => nodes.forEach(node => node.children.length ? prune(node.children) : delete node.children);
    prune(roots); return roots;
  };
  const leaves = (node, field) => node.children?.length ? node.children.flatMap(child => leaves(child, field)) : [node[field]];
  const expand = (values, nodes, field) => {
    const index = new Map();
    const visit = list => list.forEach(node => { index.set(node[field], node); if(node.children)visit(node.children); });
    visit(nodes);
    return new Set((Array.isArray(values)?values:values?[values]:[]).flatMap(value => index.has(value)?leaves(index.get(value),field):[]));
  };
  const decorate = (nodes, field) => {
    const groups = [];
    const visit = (list, depth) => list.map(node => {
      if(!node.children?.length)return {...node};
      let children = visit(node.children,depth+1);
      if(depth===2){
        const allKey = '__area_all__:'+node[field];
        groups.push({allKey, keys:leaves(node,field)});
        children = [{label:'全部',[field]:allKey},...children];
      }
      return {...node,children};
    });
    return {nodes:visit(nodes,1),groups};
  };
  const compact = (selected, nodes, field) => nodes.flatMap(node => {
    const keys = leaves(node,field);
    if(keys.every(key=>selected.has(key)))return [node[field]];
    return node.children?.length?compact(selected,node.children,field):[];
  });
  const displayed = (value, nodes, field, groups) => {
    const selected = expand(value,nodes,field);
    groups.forEach(group => {if(group.keys.every(key=>selected.has(key)))selected.add(group.allKey);});
    return [...selected];
  };
  const update = (next, previous, original, decorated, field) => {
    const selected = expand(next,decorated.nodes,field);
    const before = new Set(displayed(previous,original,field,decorated.groups));
    decorated.groups.forEach(group => {
      if(selected.has(group.allKey)&&!before.has(group.allKey))group.keys.forEach(key=>selected.add(key));
      if(!selected.has(group.allKey)&&before.has(group.allKey))group.keys.forEach(key=>selected.delete(key));
      selected.delete(group.allKey);
    });
    return compact(selected,original,field);
  };
  let component;
  const cascader = () => component || (component = Vue.defineComponent({
    name:'AreaCascader',inheritAttrs:false,
    props:{value:{default:null},options:{type:Array,default:()=>[]},valueField:{type:String,default:'value'}},
    emits:['update:value'],
    setup(props,{attrs,emit}){
      const tree=Vue.computed(()=>decorate(props.options,props.valueField));
      return ()=>Vue.h(naive.NCascader,{...attrs,valueField:props.valueField,options:tree.value.nodes,value:displayed(props.value,props.options,props.valueField,tree.value.groups),'onUpdate:value':value=>emit('update:value',update(value,props.value,props.options,tree.value,props.valueField))});
    }
  }));
  window.AreaCascade = {path, selection, matches, options, cascader, decorate, displayed, update};
})();
