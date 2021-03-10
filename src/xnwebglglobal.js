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
import { OrbitControls } from './three/OrbitControls.js';
let earthimg = require('./img/earth1.jpg');
let earthtexture = require('./img/earthtexture.png');
let light = require('./img/light.png');
import worlddata from './img/worlddata.js';
// var GIO = require('giojs');
// console.log(Gio);
(function (window, $) {
    // var that;
    var option = {
        R:100
    }

    function XNWebglGlobal(dom,options) {
        this.dom=dom;
        this.option = $.extend(true,{}, option, options);
        // this.init();
        this.initThree();
        this.addControl();
    }

    XNWebglGlobal.prototype = {
        addEarth(scene){
            var earth=new THREE.Group();
            scene.add(earth);
            earth.add(this.countryLine());
            earth.add(this.createSphereMesh(this.option.R));
            earth.add(this.drawPoints())
            return earth;
        },
        countryLine(){
            var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
            //类型数组创建顶点数据
            var vertices = new Float32Array(worlddata);
            // 创建属性缓冲区对象
            var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组，表示一个顶点的xyz坐标
            // 设置几何体attributes属性的位置属性
            geometry.attributes.position = attribue;
            // 线条渲染几何体顶点数据
            var material = new THREE.LineBasicMaterial({
                color: 0x00aaaa //线条颜色
            });//材质对象
            var line = new THREE.LineSegments(geometry, material);//间隔绘制直线
            line.scale.set(this.option.R,this.option.R,this.option.R);//lineData.js对应球面半径是1，需要缩放R倍
            return line;
        },
        createSphereMesh(r) {
            // TextureLoader创建一个纹理加载器对象，可以加载图片作为纹理贴图
            var textureLoader = new THREE.TextureLoader();
            var texture = textureLoader.load('./img/earthtexture.png');//加载纹理贴图
            var geometry = new THREE.SphereBufferGeometry(r, 40, 40);
            //创建一个球体几何对象
            //材质对象Material
            // MeshLambertMaterial  MeshBasicMaterial
            var material = new THREE.MeshLambertMaterial({
                // color: 0x00ffff,
                map:texture,//设置地球0颜色贴图map
                // transparent:true,
                // opacity:0.5,//半透明效果
            });
            var mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh
            return mesh
        },
        addLigthRing(){
            var textureLoader = new THREE.TextureLoader();
            var texture = textureLoader.load('./img/light.png');//加载纹理贴图
// 创建精灵材质对象SpriteMaterial
            var spriteMaterial = new THREE.SpriteMaterial({
                map: texture, //设置精灵纹理贴图
                transparent: true,//开启透明
                // opacity: 0.5,//可以通过透明度整体调节光圈
            });
// 创建表示地球光圈的精灵模型
            var sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(this.option.R * 3.0, this.option.R * 3.0, 1);//适当缩放精灵
            // sprite.scale.set(R*4.0, R*4.0, 1);//光圈相比较地球偏大
            return sprite;
        },
        drawPoints(){
            var loader = new THREE.FileLoader();//three.js文件加载类FileLoader：封装了XMLHttpRequest
            loader.setResponseType('json');
            var group = new THREE.Group();
            loader.load('../airports.json', function (data) {
                var coordArr = data;//所有经纬度坐标数据
                var verticesArr = [];//所有顶点数据，三个元素为一组
                for (var i = 0; i < coordArr.length; i++) {
                    var lon = coordArr[i].longitude_deg;//经度
                    var lat = coordArr[i].latitude_deg//纬度
                    // 经纬度转球面坐标
                    var coord = lon2xyz(R*1.001, lon, lat)
                    verticesArr.push(coord.x, coord.y, coord.z);

                    // 实际开发中遇到几何体顶点坐标NaN报错问题
                    // if(!coordArr[i].longitude_deg)console.log('存在空数据')
                    // if(coordArr[i].longitude_deg){
                    //   var lon = coordArr[i].longitude_deg;//经度
                    //   var lat = coordArr[i].latitude_deg//纬度
                    //   var coord = lon2xyz(R*1.001, lon, lat)
                    //   verticesArr.push(coord.x, coord.y, coord.z);
                    // }
                }
                var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
                //3个为一组，表示一个顶点的xyz坐标
                var attribute = new THREE.BufferAttribute(new Float32Array(verticesArr), 3);
                // console.log('顶点数据',attribute.count);//接近6万个点
                // 设置几何体attributes属性的位置属性
                geometry.attributes.position = attribute;
                // 点渲染模式
                var material = new THREE.PointsMaterial({
                    // color: 0x33ffcc,
                    color: 0xffff00,
                    size: 1.0, //点尺寸
                    // size: 1.5, //点尺寸
                }); //材质对象
                var points = new THREE.Points(geometry, material); //点模型对象
                group.add(points);
            })
            return group;



            var group = new THREE.Group();
            var coordArr=this.option.data;
            var verticesArr = [];//所有顶点数据，三个元素为一组
            for (var i = 0; i < coordArr.length; i++) {
                var lon = coordArr[i].longitude_deg;//经度
                var lat = coordArr[i].latitude_deg//纬度
                // 经纬度转球面坐标
                var coord = this.lon2xyz(this.option.R*1.001, lon, lat)
                verticesArr.push(coord.x, coord.y, coord.z);

                // 实际开发中遇到几何体顶点坐标NaN报错问题
                // if(!coordArr[i].longitude_deg)console.log('存在空数据')
                // if(coordArr[i].longitude_deg){
                //   var lon = coordArr[i].longitude_deg;//经度
                //   var lat = coordArr[i].latitude_deg//纬度
                //   var coord = lon2xyz(R*1.001, lon, lat)
                //   verticesArr.push(coord.x, coord.y, coord.z);
                // }
            }
            var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
            //3个为一组，表示一个顶点的xyz坐标
            var attribute = new THREE.BufferAttribute(new Float32Array(verticesArr), 3);
            // console.log('顶点数据',attribute.count);//接近6万个点
            // 设置几何体attributes属性的位置属性
            geometry.attributes.position = attribute;
            // 点渲染模式
            var material = new THREE.PointsMaterial({
                // color: 0x33ffcc,
                color: 0xffff00,
                size: 10.0, //点尺寸
                // size: 1.5, //点尺寸
            }); //材质对象
            var points = new THREE.Points(geometry, material); //点模型对象
            group.add(points);
            return group;
        },
        initThree(){
            var scene=new THREE.Scene();
            // var mesh=this.addGlobalMesh(100);
            // scene.add(mesh)
            // var lon2xyz=this.lon2xyz(100,113.5,34.5);
            // var sphere=this.addSphere(100,10,lon2xyz);
            // scene.add(sphere)
            var mesh=this.addEarth(scene);

            // scene.add(points)


            var lightring=this.addLigthRing();
            scene.add(lightring)
            var directionalLight=new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(400,200,300);
            scene.add(directionalLight);
            var directionLight2=new THREE.DirectionalLight(0xffffff, 0.6)
            directionLight2.position.set(-400,-200,-300);
            scene.add(directionLight2);
            var ambient=new THREE.AmbientLight(0xffffff, 0.6)
            scene.add(ambient);
            var axesHelper=new THREE.AxesHelper(250);
            scene.add(axesHelper)
            var width = window.innerWidth;
            var height = window.innerHeight;
            var k = width / height;
            var s=180;

            var camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
            camera.position.set(-102, 205, -342); //相机在Three.js坐标系中的位置
            camera.lookAt(0, 0, 0); //相机指向Three.js坐标系原点
            var renderer = new THREE.WebGLRenderer({
                antialias: true, //开启锯齿
            });
            renderer.setPixelRatio(window.devicePixelRatio);//设置设备像素比率,防止Canvas画布输出模糊。
            renderer.setSize(width, height); //设置渲染区域尺寸
            renderer.setClearColor(0x000000, 1); //设置背景颜色
            // renderer.domElement表示Three.js渲染结果,也就是一个HTML元素(Canvas画布)
            this.dom.appendChild(renderer.domElement); //body元素中插入canvas画布
            //执行渲染操作   指定场景、相机作为参数
            this.renderer=renderer;
            this.mesh=mesh;
            this.camera=camera;
            this.scene=scene;
            this.renderer.render(this.scene, this.camera);

            this.render();

        },
        render(){
            this.mesh.rotateY(0.001);
            this.renderer.render(this.scene,this.camera);
            requestAnimationFrame(this.render.bind(this))
        },
        addControl(){
            var controls = new OrbitControls(this.camera, this.renderer.domElement);
        },
        lon2xyz(R,longitude,latitude) {
            var lon = longitude * Math.PI / 180;//转弧度值
            var lat = latitude * Math.PI / 180;//转弧度值
            lon = -lon;// three.js坐标系z坐标轴对应经度-90度，而不是90度

            // 经纬度坐标转球面坐标计算公式
            var x = R * Math.cos(lat) * Math.cos(lon);
            var y = R * Math.sin(lat);
            var z = R * Math.cos(lat) * Math.sin(lon);
            // 返回球面坐标
            return {
                x:x,
                y:y,
                z:z,
            };
        }
    }
    window.XNWebglGlobal = XNWebglGlobal;
})(window, XNQuery)
