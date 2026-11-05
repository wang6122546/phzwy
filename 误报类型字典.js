(() => {
const key = 'industrial-misreport-types-v1';
const defaults = [
  {
    "id": "MT001",
    "name": "动物闯入",
    "description": "鸟类、猫犬等被识别为人员或其他目标"
  },
  {
    "id": "MT002",
    "name": "昆虫或蛛网干扰",
    "description": "飞虫贴近镜头、蛛网摆动引发误识别"
  },
  {
    "id": "MT003",
    "name": "雨雪雾天气影响",
    "description": "雨雪、浓雾等导致目标或场景识别错误"
  },
  {
    "id": "MT004",
    "name": "光照或阴影变化",
    "description": "车灯、强光、光照突变或移动阴影引发误识别"
  },
  {
    "id": "MT005",
    "name": "反光或倒影干扰",
    "description": "玻璃、金属、地面积水的反射或倒影"
  },
  {
    "id": "MT006",
    "name": "植被或悬挂物摆动",
    "description": "树枝、旗帜、帘布等摆动被识别为目标"
  },
  {
    "id": "MT007",
    "name": "粉尘或蒸汽干扰",
    "description": "工业粉尘、水汽等被误识别为烟雾或其他目标"
  },
  {
    "id": "MT008",
    "name": "镜头污损或遮挡",
    "description": "镜头污渍、水滴、遮挡影响画面识别"
  },
  {
    "id": "MT009",
    "name": "摄像头抖动或偏移",
    "description": "设备振动或视角变化导致误识别"
  },
  {
    "id": "MT010",
    "name": "画面模糊或低照度",
    "description": "失焦、运动模糊、夜间噪点等影响识别"
  },
  {
    "id": "MT011",
    "name": "目标遮挡或重叠",
    "description": "人员、车辆或货物重叠导致识别错误"
  },
  {
    "id": "MT012",
    "name": "目标外观相似误识别",
    "description": "服装、物品或背景外形与检测目标相似"
  },
  {
    "id": "MT013",
    "name": "检测区域或规则配置不当",
    "description": "检测边界、方向、阈值等设置不符合现场"
  },
  {
    "id": "MT014",
    "name": "其他误报",
    "description": "不属于以上类型的误识别原因"
  }
];
const read = () => { const raw = localStorage.getItem(key); if(raw === null) return defaults.map(x=>({...x})); const rows = JSON.parse(raw); if(!Array.isArray(rows)) throw Error('误报类型数据格式异常'); return rows; };
const save = rows => { localStorage.setItem(key, JSON.stringify(rows)); window.dispatchEvent(new Event('misreport-types-change')); };
window.MisreportTypes = { key, read, save };
})();
