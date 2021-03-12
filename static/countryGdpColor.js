// 引入three.js
import * as THREE from '../../../three.js-r123/build/three.module.js';
// 解析gdp.json加载完成后回调函数返回的数据，生成一个对象，对象具有系列属性，属性名称是国家名称，属性值是gdp和颜色
function getCountryGdpColor(data) {
  // data.Root.data.record //所有国家相关的数据
  // 所有国家的数据没有集中放在一起，data.Root.data.record的一个元素是一个对象，包含国家名称、gdp数据、对应年份
  var countryGdpColor = {};//每个国家的名字作为属性，属性值是国家对应GDP和可视化颜色值
  // GDP最高对应红色，GDP最低对应白色
  var color1 = new THREE.Color(0xffffff);
  var color2 = new THREE.Color(0xff0000);
  var gdpMax = 18219297584000//设置一个基准值,以最高的美国gdp为准
  data.Root.data.record.forEach(function (obj) {
    if (obj.field[2].text == 2015) {//获取所有国家2015gdp等数据
      var name = obj.field[0].text;//国家名称
      var gdp = obj.field[3].text;//2015年该国家gdp
      var color = null;
      if (gdp) {// 部分国家2015数据残缺，意味着gdp未定义 
        // 颜色插值计算
        // var color = color1.clone().lerp(color2.clone(), gdp / gdpMax);
        // 国家gdp差距太大，可以使用平方根比值进行颜色插值
        color = color1.clone().lerp(color2.clone(), Math.sqrt(gdp / gdpMax));
      }else{
        color = new THREE.Color(0xffffff);
      }
      //国家名字作为对象属性名          
      countryGdpColor[name] = {
        gdp:gdp,//国家name对应GDP
        color:color,//国家name对应颜色值
      };
    }
  })

return countryGdpColor;
}
export { getCountryGdpColor }