//! XNWebglGlobal.js
//！ 仙女颜色选择器
//! https://github.com/fanaiai/xnwebglglobal
//! version : 1.0.0
//! authors : 范媛媛
//! create date:2021/03/10
//! update date:2021/03/10 v1.0.0发布
import './xnquery.js'
import './xnwebglglobal.css'
import * as THREE from './three/three.module.js'
import {OrbitControls} from './three/OrbitControls.js';
import polygonData from "../static/polygonData";
import Delaunator from 'delaunator';
import {BufferGeometryUtils} from './three/BufferGeometryUtils.js';
import {CSS2DRenderer, CSS2DObject} from './three/CSS2DRenderer.js';

let earthtexture = require('./img/earthtexture.png');
let light = require('./img/light.png');
(function (window, $) {
    // var that;
    var option = {
        R: 100,
        width: 500,
        height: 500,
        backgroundColor: '#000000',
        type: 'area',//hot,fly
        baseGlobal: {
            color: '#cccccc',
            opacity: 1
        },
        attr: {
            area: {
                colors: ['#ff0000', '#ffffff'],
                lineColor: '#888888'
            },
            hot:{

            }
        },
    }

    function XNWebglGlobal(dom, options) {
        this.dom = dom;
        this.option = $.extend(true, {}, option, options);
        this.chooseMesh = null;
        this.calcMeshArry = null;
        this.setLabelRender();
        this.initThree();
        this.addControl();
        this.addGlobal();

        this.addArea();
        this.label = this.addlabel();

        this.addEvent();

        // this.addPolygon();
        // this.addAllCountTryPolygon()
        // this.addBar();
        // this._DrawCurveLine();
        // this._DrawBez()
        // this.addCurves(this.option.R)
    }

    XNWebglGlobal.prototype = {
        addArea() {
            this.calcMeshArry = [];
            this.getWorldData(data => {
                var dataColor = this.calcAreaCountryColor(this.option.data);
                data.features.forEach((country) => {
                    // "Polygon"：国家country有一个封闭轮廓
                    //"MultiPolygon"：国家country有多个封闭轮廓
                    if (country.geometry.type === "Polygon") {
                        // 把"Polygon"和"MultiPolygon"的geometry.coordinates数据结构处理为一致
                        country.geometry.coordinates = [country.geometry.coordinates];
                    }
                    // 解析所有封闭轮廓边界坐标country.geometry.coordinates
                    // R * 1.001比地球R稍大，以免深度冲突
                    var line = this.countryLine(this.option.R * 1.002, country.geometry.coordinates);//国家边界
                    var mesh = this.countryMesh(this.option.R * 1.001, country.geometry.coordinates);//国家轮廓mesh
                    this.earth.add(line);//国家边界集合插入earth中
                    this.earth.add(mesh);//国家Mesh集合插入earth中
                    this.calcMeshArry.push(mesh);
                    // mesh.name = country.properties.name;//设置每个国家mesh对应的国家英文名
                    mesh.name = country.properties.nameZh;//设置每个国家mesh对应的中文名
                    // console.log(dataColor)
                    if (dataColor[mesh.name]) {//worldZh.json部分国家或地区在gdp.json文件中不存在，判断下，以免报错
                        mesh.material.color.copy(dataColor[mesh.name].color);
                        mesh.color = dataColor[mesh.name].color;//自定义颜色属性 用于射线拾取交互
                        mesh.origindata = dataColor[mesh.name].origindata;//自定义颜色属性 用于射线拾取HTML标签显示
                    } else {
                        mesh.material.color.set(0xffffff);
                        mesh.color = mesh.material.color.clone();//自定义颜色属性 用于射线拾取交互
                    }
                });
            })
        },
        countryMesh(R, polygonArr) {
            var geometryArr = [];//一个国家多个轮廓，每个轮廓对应的所有几何体
            polygonArr.forEach(obj => {
                var polygon = obj[0];//获取多边形轮廓数据polygon
                //gridPoint(polygon):多边形轮廓polygon内填充等间距点
                // pointsArr表示polygon边界上顶点坐标和polygon内填充的顶点坐标
                var pointsArr = this.gridPoint(polygon);
                // 三角剖分生成顶点坐标对应三角形索引
                var trianglesIndexArr = this.delaunay(pointsArr, polygon)
                //三角形顶点经纬度坐标转化为球面坐标
                var spherePointsArr = [];//所有三角形球面坐标
                pointsArr.forEach((item, i) => {
                    // 经纬度坐标转球面坐标
                    var pos = this.lon2xyz(R, item[0], item[1])
                    spherePointsArr.push(pos.x, pos.y, pos.z)
                });
                var geometry = new THREE.BufferGeometry();//创建一个几何体
                // 设置几何体顶点索引
                geometry.index = new THREE.BufferAttribute(new Uint16Array(trianglesIndexArr), 1)
                // 设置几何体顶点位置坐标
                geometry.attributes.position = new THREE.BufferAttribute(new Float32Array(spherePointsArr), 3)
                geometryArr.push(geometry);//geometryArr：一个国家多个轮廓，每个轮廓对应的所有几何体
            });
            // 合并几何体
            var newGeometry = null;
            if (geometryArr.length == 1) {
                newGeometry = geometryArr[0];//如果一个国家只有一个多边形轮廓，不用进行几何体合并操作
            } else {// 所有几何体合并为一个几何体
                newGeometry = BufferGeometryUtils.mergeBufferGeometries(geometryArr);
            }
            newGeometry.computeVertexNormals();//如果使用受光照影响材质，需要计算生成法线
            // MeshLambertMaterial   MeshBasicMaterial
            var material = new THREE.MeshLambertMaterial({
                color: 0x002222,
                // side: THREE.BackSide, //背面可见，默认正面可见   THREE.DoubleSide：双面可见
            })
            var mesh = new THREE.Mesh(newGeometry, material)
            return mesh
        },
        countryLine(R, polygonArr) {
            var group = new THREE.Group();//一个国家多个轮廓线条line的父对象
            polygonArr.forEach(polygon => {
                var pointArr = [];//边界线顶点坐标
                polygon[0].forEach(elem => {
                    // 经纬度转球面坐标
                    var coord = this.lon2xyz(R, elem[0], elem[1])
                    pointArr.push(coord.x, coord.y, coord.z);
                });
                group.add(this.line(pointArr));
            });
            return group;
        },
        line(pointArr) {
            /**
             * 通过BufferGeometry构建一个几何体，传入顶点数据
             * 通过Line模型渲染几何体，连点成线
             * LineLoop和Line功能一样，区别在于首尾顶点相连，轮廓闭合
             */
            var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
            //类型数组创建顶点数据
            var vertices = new Float32Array(pointArr);
            // 创建属性缓冲区对象
            var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组，表示一个顶点的xyz坐标
            // 设置几何体attributes属性的位置属性
            geometry.attributes.position = attribue;
            // 线条渲染几何体顶点数据
            var material = new THREE.LineBasicMaterial({
                color: this.option.attr.area.lineColor //线条颜色
            });//材质对象
            // var line = new THREE.Line(geometry, material);//线条模型对象
            var line = new THREE.LineLoop(geometry, material);//首尾顶点连线，轮廓闭合
            return line;
        },
        calcAreaCountryColor(data) {
            var json = {};
            var color1 = new THREE.Color(this.option.attr.area.colors[0]);
            var color2 = new THREE.Color(this.option.attr.area.colors[1]);
            var [min, max] = this.getMaxMin(data, this.option.valueName);
            var maxNum = max['value'];
            data.forEach(obj => {
                var name = obj[this.option.countryName];
                var value = obj[this.option.valueName];
                var color = null;
                if (!value) {
                    value = 0;
                }
                color = color1.clone().lerp(color2.clone(), Math.sqrt(value / maxNum));
                json[name] = {
                    color: color,
                    origindata: obj
                }
            })
            return json;
        },
        getMaxMin(data, name) {
            data.sort((d1, d2) => {
                if (d1[name] > d2[name]) {
                    return 1;
                } else {
                    return -1;
                }
            })
            return [data[0], data[data.length - 1]]
        },
        addGlobal() {
            this.earth = new THREE.Group();
            this.addGlobalBase();
            this.scene.add(this.earth)
        },
        getWorldData(callback) {
            var loader = new THREE.FileLoader()
            loader.setResponseType('json')
            loader.load('/static/worldZh.json', (data) => {
                if (typeof callback == 'function') {
                    callback(data)
                }
            })
        },
        addGlobalBase() {
            var geo = new THREE.SphereBufferGeometry(this.option.R, 40, 40)
            var material = new THREE.MeshLambertMaterial({
                color: this.option.baseGlobal.color,
                transparent: true,
                opacity: this.option.baseGlobal.opacity
            })
            var mesh = new THREE.Mesh(geo, material);
            this.earth.add(mesh)
        },
        initThree() {
            var scene = new THREE.Scene();
            var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(400, 200, 300);
            scene.add(directionalLight);
            var directionLight2 = new THREE.DirectionalLight(0xffffff, 0.6)
            directionLight2.position.set(-400, -200, -300);
            scene.add(directionLight2);
            var ambient = new THREE.AmbientLight(0xffffff, 0.6)
            scene.add(ambient);
            var axesHelper = new THREE.AxesHelper(250);
            scene.add(axesHelper)
            var width = this.option.width;
            var height = this.option.height;
            var k = width / height;
            var s = 180;
            var camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
            camera.position.set(103, 45, 200); //相机在Three.js坐标系中的位置
            camera.lookAt(103, 45, 0);//注意多边形轮廓不居中问题
            // camera.position.set(-102, 205, -342); //相机在Three.js坐标系中的位置
            // camera.lookAt(0, 0, 0); //相机指向Three.js坐标系原点
            var renderer = new THREE.WebGLRenderer({
                antialias: true, //开启锯齿
            });
            renderer.setPixelRatio(window.devicePixelRatio);//设置设备像素比率,防止Canvas画布输出模糊。
            renderer.setSize(width, height); //设置渲染区域尺寸
            renderer.setClearColor(this.option.backgroundColor, 1); //设置背景颜色
            // renderer.domElement表示Three.js渲染结果,也就是一个HTML元素(Canvas画布)
            this.dom.appendChild(renderer.domElement); //body元素中插入canvas画布
            //执行渲染操作   指定场景、相机作为参数
            this.renderer = renderer;
            // this.mesh=mesh;
            // this.WaveMeshArr=WaveMeshArr;
            this.camera = camera;
            this.scene = scene;
            this.renderer.render(this.scene, this.camera);
            this.render();

        },
        render() {

            // this.WaveMeshArr.children.forEach(mesh=>{
            //     mesh._s += 0.007;
            //     if(mesh._s>2){
            //         mesh._s=1;
            //     }
            //     mesh.scale.set(mesh.size*mesh._s,mesh.size*mesh._s,mesh.size*mesh._s);
            //     if (mesh._s <= 1.5) {
            //         mesh.material.opacity = (mesh._s-1) * 2;//2等于1/(1.5-1.0)，保证透明度在0~1之间变化
            //     } else if (mesh._s > 1.5 && mesh._s <= 2) {
            //         // console.log(mesh._s)
            //         mesh.material.opacity =  1 - (mesh._s - 1.5)*2;//2等于1/(2.0-1.5) mesh缩放2倍对应0 缩放1.5被对应1
            //     } else {
            //         mesh._s = 1.0;
            //     }
            // })
            // if(!this.chooseMesh){
            if(this.earth){
            this.earth.rotateY(0.001);}
            // this.WaveMeshArr.rotateY(0.001);}
            this.labelRenderer.render(this.scene, this.camera)
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(this.render.bind(this))
        },
        addControl() {
            var controls = new OrbitControls(this.camera, this.renderer.domElement);
            // controls.target.set(103, 45, 0);
            controls.update();
        },
        lon2xyz(R, longitude, latitude) {
            // return {
            //     x:longitude,
            //     y:latitude,
            //     z:0
            // }
            var lon = longitude * Math.PI / 180;//转弧度值
            var lat = latitude * Math.PI / 180;//转弧度值
            lon = -lon;// three.js坐标系z坐标轴对应经度-90度，而不是90度

            // 经纬度坐标转球面坐标计算公式
            var x = R * Math.cos(lat) * Math.cos(lon);
            var y = R * Math.sin(lat);
            var z = R * Math.cos(lat) * Math.sin(lon);
            // 返回球面坐标
            return {
                x: x,
                y: y,
                z: z,
            };
        },
        pointInPolygon(point, vs) {
            var x = point[0],
                y = point[1];
            var inside = false;
            for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                var xi = vs[i][0],
                    yi = vs[i][1];
                var xj = vs[j][0],
                    yj = vs[j][1];
                var intersect = ((yi > y) != (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        },
        gridPoint(polygon) {
            var lonArr = [];//polygon的所有经度坐标
            var latArr = [];//polygon的所有纬度坐标
            polygon.forEach(elem => {
                lonArr.push(elem[0])
                latArr.push(elem[1])
            });
            // minMax()计算polygon所有经纬度返回的极大值、极小值
            var [lonMin, lonMax] = this.minMax(lonArr);
            var [latMin, latMax] = this.minMax(latArr);
            // 经纬度极小值和极大值构成一个矩形范围，可以包裹多边形polygon，在矩形范围内生成等间距顶点
            //  设置均匀填充点的间距
            var 间隔 = 3; //polygon轮廓内填充顶点的经纬度间隔距离，选择一个合适的值，太小，计算量大，太大，国家球面不够光滑
            var 行 = Math.ceil((lonMax - lonMin) / 间隔);//经度方向填充多少行的顶点
            var 列 = Math.ceil((latMax - latMin) / 间隔)//纬度方向填充多少列的顶点
            var rectPointsArr = [];//polygon对应的矩形轮廓内生成均匀间隔的矩形网格数据rectPointsArr
            for (var i = 0; i < 行 + 1; i++) {
                for (var j = 0; j < 列 + 1; j++) {
                    //两层for循环在矩形范围内批量生成等间距的网格顶点数据
                    rectPointsArr.push([lonMin + i * 间隔, latMin + j * 间隔])
                }
            }
            // 处理矩形网格顶点数据rectPointsArr，仅仅保留多边形轮廓polygon内的顶点数据
            var polygonPointsArr = [];//polygon轮廓内的网格顶点数据
            rectPointsArr.forEach((coord) => {//coord:点经纬度坐标
                if (this.pointInPolygon(coord, polygon)) {//判断点coord是否位于多边形中
                    polygonPointsArr.push(coord)
                }
            })
            //polygon：多边形轮廓边界顶点数据
            // polygonPointsArr：polygon内部的等间距顶点数据
            // 多边形polygon边界坐标和polygon内等间距顶点坐标合并返回
            return [...polygon, ...polygonPointsArr];
        },
        minMax(arr) {
            // 数组元素排序
            arr.sort((num1, num2) => {
                if (num1 < num2) {
                    return -1;
                } else if (num1 > num2) {
                    return 1;
                } else {
                    return 0;
                }
            });
            // 通过向两侧取整，把经纬度的方位稍微扩大
            return [Math.floor(arr[0]), Math.ceil(arr[arr.length - 1])]
        },
        delaunay(pointsArr, polygon) {
            //.from(pointsArr).triangles：平面上一系列点集三角剖分，并获取三角形索引值
            var indexArr = Delaunator.from(pointsArr).triangles;

            /**三角剖分获得的三角形索引indexArr需要进行二次处理，删除多边形polygon轮廓外面的三角形对应索引 */
            var usefulIndexArr = [];//二次处理后三角形索引，也就是保留多边形polygon内部三角形对应的索引
            // 删除多边形polygon外面三角形，判断方法非常简单，判断一个三角形的质心是否在多边形轮廓内部
            for (var i = 0; i < indexArr.length; i += 3) {
                // 三角形三个顶点坐标p1, p2, p3
                var p1 = pointsArr[indexArr[i]];
                var p2 = pointsArr[indexArr[i + 1]];
                var p3 = pointsArr[indexArr[i + 2]];
                // 三角形重心坐标计算
                var 三角形重心 = [(p1[0] + p2[0] + p3[0]) / 3, (p1[1] + p2[1] + p3[1]) / 3];
                if (this.pointInPolygon(三角形重心, polygon)) {//pointInPolygon()函数判断三角形的重心是在多边形polygon内
                    // 保留复合条件三角形对应的索引：indexArr[i], indexArr[i+1],indexArr[i+2]
                    // usefulIndexArr.push(indexArr[i], indexArr[i+1],indexArr[i+2]);//这种情况需要设置three.js材质背面可见THREE.BackSide才能看到球面国家Mesh
                    // 有一点需要注意，一个三角形索引逆时针和顺时针顺序对应three.js三角形法线方向相反，或者说Mesh正面、背面方向不同
                    usefulIndexArr.push(indexArr[i + 2], indexArr[i + 1], indexArr[i]);
                }
            }
            return usefulIndexArr
        },
        setLabelRender() {
            var labelRenderer = new CSS2DRenderer();
            labelRenderer.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.domElement.style.position = 'absolute';
// 相对鼠标单击位置偏移
            labelRenderer.domElement.style.top = '-16px';
            labelRenderer.domElement.style.left = '0px';
// //设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
            labelRenderer.domElement.style.pointerEvents = 'none';
            this.labelRenderer = labelRenderer;
            document.body.appendChild(labelRenderer.domElement);
        },
        addlabel() {
// 创建div元素(作为标签)
            var div = document.createElement('div');
            div.style.visibility = 'hidden';
            div.innerHTML = 'GDP';
            div.style.padding = '4px 10px';
            div.style.color = '#fff';
            div.style.fontSize = '16px';
            div.style.position = 'absolute';
            div.style.backgroundColor = 'rgba(25,25,25,0.5)';
            div.style.borderRadius = '5px';
            //div元素包装为CSS2模型对象CSS2DObject
            var label = new CSS2DObject(div);
            div.style.pointerEvents = 'none';//避免HTML标签遮挡三维场景的鼠标事件
            // 设置HTML元素标签在three.js世界坐标中位置
            // label.position.set(x, y, z);
            return label;//返回CSS2模型标签
        },
        addEvent() {
            var choosePointMesh = e => {
                if (this.chooseMesh) {
                    this.chooseMesh.material.color.set('#ffffff')
                }
                var Sx = event.clientX; //鼠标单击位置横坐标
                var Sy = event.clientY; //鼠标单击位置纵坐标
                //屏幕坐标转WebGL标准设备坐标
                var x = (Sx / window.innerWidth) * 2 - 1; //WebGL标准设备横坐标
                var y = -(Sy / window.innerHeight) * 2 + 1; //WebGL标准设备纵坐标
                //创建一个射线投射器`Raycaster`
                var raycaster = new THREE.Raycaster();
                //通过鼠标单击位置标准设备坐标和相机参数计算射线投射器`Raycaster`的射线属性.ray
                raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
                //返回.intersectObjects()参数中射线选中的网格模型对象
                // 未选中对象返回空数组[],选中一个数组1个元素，选中两个数组两个元素
                var intersects = raycaster.intersectObjects(this.calcMeshArry);
                // console.log("射线器返回的对象", intersects);
                // console.log("射线投射器返回的对象 点point", intersects[0].point);
                // console.log("射线投射器的对象 几何体",intersects[0].object.geometry.vertices)
                // intersects.length大于0说明，说明选中了模型
                if (intersects.length > 0) {
                    this.chooseMesh = intersects[0].object;
                    this.label.position.copy(intersects[0].point);
                    this.label.element.innerHTML = this.chooseMesh.origindata[this.option.countryName];
                    this.label.element.style.visibility = 'visible';
                } else {
                    this.chooseMesh = null;
                }
            }
            // addEventListener('mousemove',choosePointMesh)

            addEventListener('click', e => {
                choosePointMesh(e)
                if (this.chooseMesh) {
                    // this.chooseMesh.material.color.set('#ffaa00')
                }
            })
        },
//         addCurves(R){
//             var num = 10//批量绘制多组
//             /*所有飞线弧线顶部距离地球球面的距离和夹角大小成正比，(飞线起点-球心-飞线结束点构成的夹角)
//             夹角均匀变化，飞线之间的间距自然均匀变化*/
//             for (var i = 1; i < num; i++) {
//                 var startAngle = Math.PI/2/num*i;//圆弧起点和坐标原点构成的角度
//                 var x = R * Math.cos(startAngle); //飞线圆弧起点横坐标
//                 var y = R * Math.sin(startAngle); //飞线圆弧起点纵坐标
//                 // 飞线圆弧起点坐标startPoint、结束点坐标endPoint
//                 var startPoint = new THREE.Vector3(x, y, 0)
//                 var endPoint = new THREE.Vector3(-x, y, 0)
//
//                 // 调用arcXOY函数绘制一条圆弧飞线轨迹，你可以通过修改上面的角度startAngle查看不同起点、结束点对应飞线效果
//                 var arcline = this._arcXOY(startPoint, endPoint);
//                 this.scene.add(arcline); //飞线插入场景中
//
//                 /*为了方便你观察和学习，下面通过球和箭头对一些几何数据进行标注
//                 arcline.center属性表示飞线圆弧的圆心
//                 arcline.topCoord属性表示飞线圆弧中间也就是顶部坐标*/
//                 // this.scene.add(this.helpView(startPoint, endPoint, arcline.center, arcline.topCoord));
//             }
//         },
//         _arcXOY(startPoint,endPoint){
//             var middleV3=new THREE.Vector3().addVectors(startPoint,endPoint).multiplyScalar(0.5);
//             var dir=middleV3.clone().normalize();
//             var earthRadianAngle=this.radianAOB(startPoint,endPoint,new THREE.Vector3(0,0,0));
//             var arcTopCoord=dir.multiplyScalar(this.option.R+earthRadianAngle*this.option.R*0.2);
//             var flyArcCenter=this.threePointCenter(startPoint,endPoint,arcTopCoord);
//             var flyArcR=Math.abs(flyArcCenter.y-arcTopCoord.y);
//
//             var flyRadianAngle=this.radianAOB(startPoint,new THREE.Vector3(0,-1,0),flyArcCenter);
//
//             var startAngle=-Math.PI/2+flyRadianAngle;
//             var endAngle=Math.PI-startAngle;
//
//             var arcline = this.circleLine(flyArcCenter.x, flyArcCenter.y, flyArcR, startAngle, endAngle)
//             arcline.center = flyArcCenter;//飞线圆弧自定一个属性表示飞线圆弧的圆心
//             arcline.topCoord = arcTopCoord;//飞线圆弧自定一个属性表示飞线圆弧中间也就是顶部坐标
//             return arcline
//         },
//         circleLine(x, y, r, startAngle, endAngle) {
//             var geometry = new THREE.Geometry(); //声明一个几何体对象Geometry
//             // THREE.ArcCurve创建圆弧曲线
//             var arc = new THREE.ArcCurve(x, y, r, startAngle, endAngle, false);
//             //getSpacedPoints是基类Curve的方法，返回一个vector2对象作为元素组成的数组
//             var points = arc.getSpacedPoints(50); //分段数50，返回51个顶点
//             geometry.setFromPoints(points);// setFromPoints方法从points中提取数据改变几何体的顶点属性vertices
//             var material = new THREE.LineBasicMaterial({color: 0x00ffff,});//线条材质
//             var line = new THREE.Line(geometry, material);//线条模型对象
//             return line;
//         },
//         threePointCenter(p1,p2,p3){
//             var L1=p1.lengthSq();
//             var L2=p2.lengthSq();
//             var L3=p3.lengthSq();
//             var x1=p1.x,y1=p1.y,x2=p2.x,y2=p2.y,x3=p3.x,y3=p3.y;
//             var S = x1 * y2 + x2 * y3 + x3 * y1 - x1 * y3 - x2 * y1 - x3 * y2;
//             var x = (L2 * y3 + L1 * y2 + L3 * y1 - L2 * y1 - L3 * y2 - L1 * y3) / S / 2;
//             var y = (L3 * x2 + L2 * x1 + L1 * x3 - L1 * x2 - L2 * x3 - L3 * x1) / S / 2;
//             // 三点外接圆圆心坐标
//             var center = new THREE.Vector3(x, y, 0);
//             return center
//         },
//         radianAOB(A,B,O){
//             var dir1=A.clone().normalize();
//             var dir2=B.clone().normalize();
//             var cosAngle=dir1.clone().dot(dir2);
//             var radianAngle=Math.acos(cosAngle);
//             return radianAngle;
//         },
//         _DrawCurveLine(){
//             // var pos1=[123,39];
//             // var pos2=[0,0];
//             // var v1=this.lon2xyz(this.option.R,pos1[0],pos1[1]);
//             // var v2=this.lon2xyz(this.option.R,pos2[0],pos2[1]);
//             // var vect1=new THREE.Vector3(v1.x,v1.y,v1.z)
//             // var vect2=new THREE.Vector3(v2.x,v2.y,v2.z)
//             // var curve=new THREE.LineCurve3(vect1,vect2);
//             // console.log(curve);
//
//             var geometry=new THREE.BufferGeometry();
//             var arc=new THREE.ArcCurve(0,0,50,0,Math.PI/4,true);
//
//             var points=arc.getSpacedPoints(30);
//             geometry.setFromPoints(points);
//
//             var material=new THREE.LineBasicMaterial({
//                 color:'#ffff00'
//             })
//
//             var line=new THREE.Line(geometry,material)
//             this.scene.add(line)
//
//
//         },
//         addBar(){
//             this._DrawBar(0,0);
//         },
//         _DrawBar(x,y){
//             var height=100;
//             var geometry=new THREE.BoxBufferGeometry(10,10,100);
//             var SphereCoord=this.lon2xyz(this.option.R,30,60)
//             geometry.lookAt(new THREE.Vector3(SphereCoord.x,SphereCoord.y,SphereCoord.z))
//
//             var v3 = new THREE.Vector3(SphereCoord.x, SphereCoord.y, SphereCoord.z).normalize().multiplyScalar(this.option.R+height / 2);
//             geometry.translate(v3.x, v3.y,  v3.z);
//
//             // geometry.computeFlatVertexNormals();//一种计算顶点法线方式，非光滑渲染
//             // geometry.rotateX(Math.PI / 2);//高度方向旋转到z轴上
//             var material=new THREE.MeshLambertMaterial({
//                 color:'#fff000'
//             })
//             var mesh=new THREE.Mesh(geometry,material);
//             // geometry.translate(0,0,50)
//             var position=this.lon2xyz(this.option.R,x,y);
//             // mesh.position.set(position.x,position.y,position.z)
//
//             // var coordVec3=new THREE.Vector3(position.x,position.y,position.z).normalize()
//             // var orginCoordVec3=new THREE.Vector3(0,0,1);
//             // mesh.quaternion.setFromUnitVectors(orginCoordVec3,coordVec3)
//             this.scene.add(mesh)
//             return mesh;
//         },


//         addMarks(){
//             var group=new THREE.Group();
//             var WaveMeshArr=new THREE.Group();
//             var loader=new THREE.FileLoader();
//             var [material]=this._getMarkMaterial('/static/dot.png');
//             var [material1]=this._getMarkMaterial('/static/光柱.png');
//             var [material2]=this._getMarkMaterial('/static/光圈贴图.png');
//             var totalHeight=this.option.R*0.4;
//             this.calcMeshArry=[];
//             hotnews.forEach((ele,index)=>{
//                 var lightBar=this._addLigthBar([ele.E,ele.N],material1.clone(),totalHeight*(hotnews.length-index)/hotnews.length)
//                 var baseCircle=this._addMark([ele.E,ele.N],material.clone(),this.option.R*0.0005,ele)//material不复制的话，大家共用一个material所以后面做动画的时候一改就都改了
//
//                 var waveCircle=this._addMark([ele.E,ele.N],material2.clone(),this.option.R*0.0012,ele)
//                 group.add(lightBar)
//                 group.add(baseCircle)
//                 WaveMeshArr.add(waveCircle)
//                 this.calcMeshArry.push(waveCircle)
//                 var color='#FFff00'
//                 if(index<4){
//                     color='#ff0000'
//                 }
//                 lightBar.children[0].material.color.set(color)
//                 baseCircle.material.color.set(color)
//                 waveCircle.material.color.set(color)
//             })
//             // WaveMeshArr.children.forEach(mesh=>{
//             //
//             // })
//             return [group,WaveMeshArr];
//         },
//         _getMarkMaterial(src){
//             var textureLoader=new THREE.TextureLoader();
//             var material=new THREE.MeshBasicMaterial({
//                 color:0x22ffcc,//填充白色的图片
//                 map:textureLoader.load(src),
//                 transparent: true,
//                 side:THREE.DoubleSide,
//                 opacity:1,
//                 depthWrite:false,
//             })
//             return [material]
//         },
//         _addLigthBar(coord,material,height){
//             var group=new THREE.Group();
//             var geometry=new THREE.PlaneBufferGeometry(this.option.R*0.05,height);
//             geometry.rotateX(Math.PI / 2);//光柱高度方向旋转到z轴上
//             geometry.translate(0, 0, height / 2);//平移使光柱底部与XOY平面重合
//
//             var mesh=new THREE.Mesh(geometry,material);
//
//             group.add(mesh,mesh.clone().rotateZ(Math.PI / 2));
//
//             var position=this.lon2xyz(this.option.R,coord[0],coord[1]);
//             group.position.set(position.x,position.y,position.z);
//
//             var coordVec3=new THREE.Vector3(position.x,position.y,position.z).normalize();
//             var meshNormal=new THREE.Vector3(0,0,1);
//
//             group.quaternion.setFromUnitVectors(meshNormal,coordVec3)
//             return group;
//         },
//         _addMark(coord,material,size,data){
//             var geometry=new THREE.PlaneBufferGeometry(this.option.R,this.option.R);
//             var mesh=new THREE.Mesh(geometry,material);
//             var position=this.lon2xyz(this.option.R*1.002,coord[0],coord[1]);
//             mesh.position.set(position.x,position.y,position.z);
//             // mesh.scale.set(size,size,size)
//             mesh._s=Math.random()*1.0 + 1.0;
//             mesh.size=size;
//             mesh.scale.set(mesh.size*mesh._s,mesh.size*mesh._s,mesh.size*mesh._s);
//             mesh._origindata=data;
//             var coordVec3=new THREE.Vector3(position.x,position.y,position.z).normalize();
//             var meshNormal=new THREE.Vector3(0,0,1);
//
//             mesh.quaternion.setFromUnitVectors(meshNormal,coordVec3)
//             return mesh;
//         },
//         addLine(){//添加线数据
//             var group=new THREE.Group();
//             var allPointArr=[];
//             var fileloader=new THREE.FileLoader();
//             fileloader.setResponseType('json');
//             fileloader.load('/static/公路.json',data=>{
//                 // var a=[[[-74.75920259253698,39.14301326086365],[-74.67358541644307,39.23361784527367],[-74.64579990459447,39.31002800285745]],[[-74.64406331010395,39.31002800285745],[-74.61627779825528,39.34649648715862],[-74.55376039659603,39.410750483308504]]]
//                 data.features.forEach(obj=>{
//                     if(obj.geometry.type=='LineString'){
//                         obj.geometry.coordinates=[obj.geometry.coordinates]
//                     }
//                     obj.geometry.coordinates.forEach(arr=>{
//                         var pointArr=[];
//                         arr.forEach(elem=>{
//                             var coord = this.lon2xyz(this.option.R, elem[0], elem[1])
//                             pointArr.push(coord.x, coord.y, coord.z);
//                         })
//                         allPointArr.push(pointArr[0],pointArr[1],pointArr[2],)
//                         for(let i=3;i<pointArr.length-3;i+=3){
//                             allPointArr.push(pointArr[i], pointArr[i + 1], pointArr[i + 2], pointArr[i], pointArr[i + 1], pointArr[i + 2]);
//                         }
//                         var index = pointArr.length-3;
//                         // 获取后三个数据
//                         allPointArr.push(pointArr[index], pointArr[index+1], pointArr[index+2]);
//                         // group.add(this._getLineGeo(pointArr));
//                     })
//                 })
//                 group.add(this._getLineGeo(allPointArr));
//             })
//             return group;
//         },
//         _getLineGeo(pointArr){
//             var geometry=new THREE.BufferGeometry();
//             var vertices=new Float32Array(pointArr);
//             var attribue = new THREE.BufferAttribute(vertices, 3);
//             geometry.attributes.position=attribue;
//             var material=new THREE.LineBasicMaterial({
//                 // color: 0x33ff99//线条颜色
//                 color: 0xffff00
//             });//材质对象
//             // var line = new THREE.Line(geometry, material);//线条模型对象  使用非闭合
//             // var line = new THREE.LineLoop(geometry, material);//首尾顶点连线，轮廓闭合
//             var line = new THREE.LineSegments(geometry, material);//间隔绘制直线
//             return line;
//         },
//         addPolygon(){
//             var pointArr=[];
//             polygonData.forEach(e=>{
//                 let p=this.lon2xyz(this.option.R,e[0],e[1])
//                 pointArr.push(p.x,p.y,p.z);
//             })
//             var geometry=new THREE.BufferGeometry();
//             var vertices=new Float32Array(pointArr)
//             var attribute=new THREE.BufferAttribute(vertices,3);
//             geometry.attributes.position=attribute;
//
//             var material=new THREE.LineBasicMaterial({
//                 color:'#aa44cc'
//             })
//             var line=new THREE.LineLoop(geometry,material);
//
//             var pointsMaterial=new THREE.PointsMaterial({
//                 color:'#00ffcc',
//                 size:3
//             })
//
//             var points=new THREE.Points(geometry,pointsMaterial);
//             var group=new THREE.Group();
//             group.add(line)
//             group.add(points);
//             this.scene.add(group)
//             var allPoints=this.addPolygonGripPoint();
//             // var allPoints=[...polygonData,...rectPoints];
//             this.addTrangle(allPoints);
//             return group;
//         },
//         addTrangle(allPoints){
//             var posArry=[];
//             for(let i=0;i<allPoints.length;i++){
//                 let p=this.lon2xyz(this.option.R,allPoints[i][0],allPoints[i][1])
//                 posArry.push(p.x,p.y,p.z)
//             }
//             var indexArr = Delaunator.from(allPoints).triangles;//获取的是索引值
//             // console.log(indexArr)
//
//             var innerIndex=[];
//             for(let i=0;i<indexArr.length; i+=3){
//                 let p1 = allPoints[indexArr[i]];
//                 let p2 = allPoints[indexArr[i + 1]];
//                 let p3 = allPoints[indexArr[i + 2]];
//                 // 三角形重心坐标计算
//                 let 三角形重心 = [(p1[0] + p2[0] + p3[0]) / 3, (p1[1] + p2[1] + p3[1]) / 3];
//                 if (this.pointInPolygon(三角形重心, polygonData)) {//pointInPolygon()函数判断三角形的重心是在多边形polygon内
//                     // 保留复合条件三角形对应的索引：indexArr[i], indexArr[i+1],indexArr[i+2]
//                     innerIndex.push(indexArr[i], indexArr[i+1],indexArr[i+2]);//这种情况需要设置three.js材质背面可见THREE.BackSide才能看到球面国家Mesh
//                 }
//             }
//             var geometry=new THREE.BufferGeometry();
//             geometry.index=new THREE.BufferAttribute(new Uint16Array(innerIndex),1);
//
//
//
//
//             geometry.attributes.position=new THREE.BufferAttribute(new Float32Array(posArry),3)
//             var material=new THREE.MeshBasicMaterial({
//                 color:'#87aacc',
//                 side:THREE.DoubleSide,
//                 // wireframe:true
//             })
//             var mesh=new THREE.Mesh(geometry,material);
//             mesh.position.z=-0.01;
//             this.scene.add(mesh)
//         },
//         addPolygonGripPoint(polygonData){
//             var lon=[];
//             var lat=[];
//             polygonData.forEach(e=>{
//                 lon.push(e[0]);
//                 lat.push(e[1]);
//             })
//             var gridSize=1;
//             var [lonMin,lonMax]=this.calcMaxMin(lon,gridSize)
//             var [latMin,latMax]=this.calcMaxMin(lat,gridSize)
//             var pointArr=[];
//             var rectPoints=[];
//             for(let i=lonMin;i<=lonMax;i+=gridSize){
//                 for(let j=latMin;j<=latMax;j+=gridSize){
//                     if(this.pointInPolygon([i,j],polygonData)){
//                         let coord=this.lon2xyz(this.option.R,i,j)
//                         pointArr.push(coord.x,coord.y,coord.z)
//                         rectPoints.push([i,j])
//                     }
//                 }
//             }
//             this._addPoint(pointArr)
//             return [...polygonData,...rectPoints];
//         },
//         addAllCountTryPolygon(){
//             this.calcMeshArry=[];
//             var loader = new THREE.FileLoader();//three.js文件加载类FileLoader：封装了XMLHttpRequest
//             loader.setResponseType('json');
//             var group = new THREE.Group();
//             loader.load('/static/gdp.json',gdp=>{
//                 var gdpColor=this.getGdpColor(gdp)
//                 loader.load('/static/worldZh.json',  (data)=> {
//                     data.features.forEach(ele=>{
//                         if(ele.geometry.type=='Polygon'){
//                             ele.geometry.coordinates=[ele.geometry.coordinates]
//                         }
//                         var line=this.MulcountryLine(this.option.R * 1.002,ele.geometry.coordinates)
//                         // var bar=this._DrawBar(ele.geometry.coordinates[0],ele.geometry.coordinates[1])
//                         var mesh=this.countryMesh(this.option.R,ele.geometry.coordinates)
//                         if(gdpColor[ele.properties.nameZh]){
//                             mesh.material.color.set(gdpColor[ele.properties.nameZh].color)
//                         }
//                         mesh._origindata=ele.properties
//                         this.calcMeshArry.push(mesh)
//                         group.add(mesh);
//                         // group.add(bar)
//                         // group.add(line);
//                     })
//                 })
//             })
//
//             this.label=this.addlabel();
//             group.add(this.label)
//             this.scene.add(group)
//         },
//         getGdpColor(data){
//             var json={
//                 '中国':{
//                     color:'#ff0000'
//                 },
//                 '缅甸':{
//                     color:'#ffff00'
//                 }
//             }
//             return json;
//         },


//         _addPoint(pointArr){
//             var geometry=new THREE.BufferGeometry();
//             var vertices=new Float32Array(pointArr)
//             var attribute=new THREE.BufferAttribute(vertices,3);
//             geometry.attributes.position=attribute
//             var material=new THREE.PointsMaterial({
//                 color:'#997722',
//                 size:2
//             })
//             var mesh=new THREE.Points(geometry,material);
//             this.scene.add(mesh)
//
//         },
//         calcMaxMin(arry,gridSize){
//             var min,max;
//             arry=arry.sort((num1, num2) =>{
//                 if (num1 < num2) {
//                     return -1;
//                 } else if (num1 > num2) {
//                     return 1;
//                 } else {
//                     return 0;
//                 }
//             });
//             min=(arry[0]%gridSize>0)?parseInt(arry[0]/gridSize)*gridSize:arry[0];
//             max=(arry[arry.length-1]%gridSize>0)?(parseInt(arry[arry.length-1]/gridSize)*gridSize+gridSize):arry[arry.length-1];
//             return [min,max]
//         },
//         countryLine(){//添加国家边界数据
//             var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
//             //类型数组创建顶点数据
//             var vertices = new Float32Array(worlddata);
//             // 创建属性缓冲区对象
//             var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组，表示一个顶点的xyz坐标
//             // 设置几何体attributes属性的位置属性
//             geometry.attributes.position = attribue;
//             // 线条渲染几何体顶点数据
//             var material = new THREE.LineBasicMaterial({
//                 color: '#f4cefb' //线条颜色
//             });//材质对象
//             var line = new THREE.LineSegments(geometry, material);//间隔绘制直线
//             line.scale.set(this.option.R,this.option.R,this.option.R);//lineData.js对应球面半径是1，需要缩放R倍
//             return line;
//         },
//         MulcountryLine(R,polygonArr) {
//             var group = new THREE.Group();//一个国家多个轮廓线条line的父对象
//             polygonArr.forEach(polygon => {
//                 var pointArr = [];//边界线顶点坐标
//                 polygon[0].forEach(elem => {
//                     // 经纬度转球面坐标
//                     var coord = this.lon2xyz(R, elem[0], elem[1])
//                     pointArr.push(coord.x, coord.y, coord.z);
//                 });
//                 group.add(this.line(pointArr));
//             });
//             return group;
//         },
//         line(pointArr){
//             /**
//              * 通过BufferGeometry构建一个几何体，传入顶点数据
//              * 通过Line模型渲染几何体，连点成线
//              * LineLoop和Line功能一样，区别在于首尾顶点相连，轮廓闭合
//              */
//             var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
//             //类型数组创建顶点数据
//             var vertices = new Float32Array(pointArr);
//             // 创建属性缓冲区对象
//             var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组，表示一个顶点的xyz坐标
//             // 设置几何体attributes属性的位置属性
//             geometry.attributes.position = attribue;
//             // 线条渲染几何体顶点数据
//             var material = new THREE.LineBasicMaterial({
//                 color: 0x00aaaa, //线条颜色
//                 transparent:true,
//                 opacity:0.5
//             });//材质对象
//             // var line = new THREE.Line(geometry, material);//线条模型对象
//             var line = new THREE.LineLoop(geometry, material);//首尾顶点连线，轮廓闭合
//             return line;
//         },
//         createSphereMesh(r) {
//             // TextureLoader创建一个纹理加载器对象，可以加载图片作为纹理贴图
//             var textureLoader = new THREE.TextureLoader();
//             var texture = textureLoader.load('./img/earthtexture.png');//加载纹理贴图
//             var geometry = new THREE.SphereBufferGeometry(r, 40, 40);
//             //创建一个球体几何对象
//             //材质对象Material
//             // MeshLambertMaterial  MeshBasicMaterial
//             var material = new THREE.MeshLambertMaterial({
//                 // color: 0x00ffff,
//                 map:texture,//设置地球0颜色贴图map
//                 // transparent:true,
//                 // opacity:0.5,//半透明效果
//             });
//             var mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh
//             return mesh
//         },
//         addLigthRing(){//添加光圈
//             var textureLoader = new THREE.TextureLoader();
//             var texture = textureLoader.load('./img/light.png');//加载纹理贴图
// // 创建精灵材质对象SpriteMaterial
//             var spriteMaterial = new THREE.SpriteMaterial({
//                 map: texture, //设置精灵纹理贴图
//                 transparent: true,//开启透明
//                 // opacity: 0.5,//可以通过透明度整体调节光圈
//             });
// // 创建表示地球光圈的精灵模型
//             var sprite = new THREE.Sprite(spriteMaterial);
//             sprite.scale.set(this.option.R * 3.0, this.option.R * 3.0, 1);//适当缩放精灵
//             // sprite.scale.set(R*4.0, R*4.0, 1);//光圈相比较地球偏大
//             return sprite;
//         },
//         drawPoints(){//添加点数据
//             var loader = new THREE.FileLoader();//three.js文件加载类FileLoader：封装了XMLHttpRequest
//             loader.setResponseType('json');
//             var group = new THREE.Group();
//             loader.load('/static/airports_color.json',  (data)=> {
//                 var coordArr = data.points;//所有经纬度坐标数据
//                 var numArr = data.num;
//                 var numMax = numArr.slice().sort((num1, num2) => {
//                     if (num1 < num2) {
//                         return -1;
//                     } else if (num1 > num2) {
//                         return 1;
//                     } else {
//                         return 0;
//                     }
//                 })[numArr.length - 1];
//
//                 var verticeArr = [];
//                 var colorArr = [];
//                 var color2 = new THREE.Color('#ee21dd');
//                 var color1 = new THREE.Color('#f4cefb');
//                 for (let i = 0; i < coordArr.length; i += 2) {
//                     let coord = this.lon2xyz(this.option.R, coordArr[i], coordArr[i + 1]);
//                     verticeArr.push(coord.x, coord.y, coord.z)
//                     var percent = numArr[i / 2] / numMax * 100;
//                     if (percent > 1.0) percent = 1.0;
//                     var color = color1.clone().lerp(color2.clone(), percent);
//                     colorArr.push(color.r, color.g, color.b);
//                 }
//                 var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
//                 //3个为一组，表示一个顶点的xyz坐标
//                 var attribute = new THREE.BufferAttribute(new Float32Array(verticeArr), 3);
//                 geometry.attributes.position = attribute;
//                 geometry.attributes.color = new THREE.BufferAttribute(new Float32Array(colorArr), 3);
//                 // 点渲染模式
//                 var material = new THREE.PointsMaterial({
//                     // color: 0x22ffee,
//                     vertexColors: THREE.VertexColors, //使用顶点颜色插值计算
//                     size: 1.5 //点尺寸
//                 }); //材质对象
//                 var points = new THREE.Points(geometry, material); //点模型对象
//                 group.add(points);
//             })
//             return group;
//         },

    }
    window.XNWebglGlobal = XNWebglGlobal;
})(window, XNQuery)
