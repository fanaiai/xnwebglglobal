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
import {OrbitControls}  from './three/OrbitControls.js';
let earthtexture = require('./img/earthtexture.png');
let light = require('./img/light.png');
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
            // earth.add(this.drawPoints())
            // earth.add(this.addLine())
            var [points,WaveMeshArr]=this.addMarks()

            earth.add(points)
            return [earth,WaveMeshArr];
        },
        addMarks(){
            var group=new THREE.Group();
            var WaveMeshArr=new THREE.Group();
            var loader=new THREE.FileLoader();
            var [material]=this._getMarkMaterial('/static/dot.png');
            var [material1]=this._getMarkMaterial('/static/光柱.png');
            var [material2]=this._getMarkMaterial('/static/光圈贴图.png');
            hotnews.forEach(ele=>{
                group.add(this._addLigthBar([ele.N,ele.E],material1))
                group.add(this._addMark([ele.N,ele.E],material,this.option.R*0.0005))
                WaveMeshArr.add(this._addMark([ele.N,ele.E],material2,this.option.R*0.001))
            })
            WaveMeshArr.children.forEach(mesh=>{
                mesh._s=Math.random()*1.0 + 1.0;
            })
            return [group,WaveMeshArr];
        },
        _getMarkMaterial(src){
            var textureLoader=new THREE.TextureLoader();
            var material=new THREE.MeshBasicMaterial({
                // color:'#ff993d',//填充白色的图片
                map:textureLoader.load(src),
                transparent: true,
                side:THREE.DoubleSide,
                depthWrite:false,
            })
            return [material]
        },
        _addLigthBar(coord,material){
            var group=new THREE.Group();
            var height=this.option.R*0.3;
            var geometry=new THREE.PlaneBufferGeometry(this.option.R*0.05,height);
            geometry.rotateX(Math.PI / 2);//光柱高度方向旋转到z轴上
            geometry.translate(0, 0, height / 2);//平移使光柱底部与XOY平面重合

            var mesh=new THREE.Mesh(geometry,material);

            group.add(mesh,mesh.clone().rotateZ(Math.PI / 2));

            var position=this.lon2xyz(this.option.R,coord[0],coord[1]);
            group.position.set(position.x,position.y,position.z);

            var coordVec3=new THREE.Vector3(position.x,position.y,position.z).normalize();
            var meshNormal=new THREE.Vector3(0,0,1);

            group.quaternion.setFromUnitVectors(meshNormal,coordVec3)
            return group;
        },
        _addMark(coord,material,size){
            var geometry=new THREE.PlaneBufferGeometry(this.option.R,this.option.R);
            var mesh=new THREE.Mesh(geometry,material);
            var position=this.lon2xyz(this.option.R,coord[0],coord[1]);
            mesh.position.set(position.x,position.y,position.z);
            mesh.scale.set(size,size,size)
            mesh.size=size;
            var coordVec3=new THREE.Vector3(position.x,position.y,position.z).normalize();
            var meshNormal=new THREE.Vector3(0,0,1);

            mesh.quaternion.setFromUnitVectors(meshNormal,coordVec3)
            return mesh;
        },
        addLine(){//添加线数据
            var group=new THREE.Group();
            var allPointArr=[];
            var fileloader=new THREE.FileLoader();
            fileloader.setResponseType('json');
            fileloader.load('/static/公路.json',data=>{
                // var a=[[[-74.75920259253698,39.14301326086365],[-74.67358541644307,39.23361784527367],[-74.64579990459447,39.31002800285745]],[[-74.64406331010395,39.31002800285745],[-74.61627779825528,39.34649648715862],[-74.55376039659603,39.410750483308504]]]
                data.features.forEach(obj=>{
                    if(obj.geometry.type=='LineString'){
                        obj.geometry.coordinates=[obj.geometry.coordinates]
                    }
                    obj.geometry.coordinates.forEach(arr=>{
                        var pointArr=[];
                        arr.forEach(elem=>{
                            var coord = this.lon2xyz(this.option.R, elem[0], elem[1])
                            pointArr.push(coord.x, coord.y, coord.z);
                        })
                        allPointArr.push(pointArr[0],pointArr[1],pointArr[2],)
                        for(let i=3;i<pointArr.length-3;i+=3){
                            allPointArr.push(pointArr[i], pointArr[i + 1], pointArr[i + 2], pointArr[i], pointArr[i + 1], pointArr[i + 2]);
                        }
                        var index = pointArr.length-3;
                        // 获取后三个数据
                        allPointArr.push(pointArr[index], pointArr[index+1], pointArr[index+2]);
                        // group.add(this._getLineGeo(pointArr));
                    })
                })
                group.add(this._getLineGeo(allPointArr));
            })
            return group;
        },
        _getLineGeo(pointArr){
            var geometry=new THREE.BufferGeometry();
            var vertices=new Float32Array(pointArr);
            var attribue = new THREE.BufferAttribute(vertices, 3);
            geometry.attributes.position=attribue;
            var material=new THREE.LineBasicMaterial({
                // color: 0x33ff99//线条颜色
                color: 0xffff00
            });//材质对象
            // var line = new THREE.Line(geometry, material);//线条模型对象  使用非闭合
            // var line = new THREE.LineLoop(geometry, material);//首尾顶点连线，轮廓闭合
            var line = new THREE.LineSegments(geometry, material);//间隔绘制直线
            return line;
        },
        countryLine(){//添加国家边界数据
            var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
            //类型数组创建顶点数据
            var vertices = new Float32Array(worlddata);
            // 创建属性缓冲区对象
            var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组，表示一个顶点的xyz坐标
            // 设置几何体attributes属性的位置属性
            geometry.attributes.position = attribue;
            // 线条渲染几何体顶点数据
            var material = new THREE.LineBasicMaterial({
                color: '#f4cefb' //线条颜色
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
        addLigthRing(){//添加光圈
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
        drawPoints(){//添加点数据
            var loader = new THREE.FileLoader();//three.js文件加载类FileLoader：封装了XMLHttpRequest
            loader.setResponseType('json');
            var group = new THREE.Group();
            loader.load('/static/airports_color.json',  (data)=> {
                var coordArr = data.points;//所有经纬度坐标数据
                var numArr = data.num;
                var numMax = numArr.slice().sort((num1, num2) => {
                    if (num1 < num2) {
                        return -1;
                    } else if (num1 > num2) {
                        return 1;
                    } else {
                        return 0;
                    }
                })[numArr.length - 1];

                var verticeArr = [];
                var colorArr = [];
                var color2 = new THREE.Color('#ee21dd');
                var color1 = new THREE.Color('#f4cefb');
                for (let i = 0; i < coordArr.length; i += 2) {
                    let coord = this.lon2xyz(this.option.R, coordArr[i], coordArr[i + 1]);
                    verticeArr.push(coord.x, coord.y, coord.z)
                    var percent = numArr[i / 2] / numMax * 100;
                    if (percent > 1.0) percent = 1.0;
                    var color = color1.clone().lerp(color2.clone(), percent);
                    colorArr.push(color.r, color.g, color.b);
                }
                var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
                //3个为一组，表示一个顶点的xyz坐标
                var attribute = new THREE.BufferAttribute(new Float32Array(verticeArr), 3);
                geometry.attributes.position = attribute;
                geometry.attributes.color = new THREE.BufferAttribute(new Float32Array(colorArr), 3);
                // 点渲染模式
                var material = new THREE.PointsMaterial({
                    // color: 0x22ffee,
                    vertexColors: THREE.VertexColors, //使用顶点颜色插值计算
                    size: 1.5 //点尺寸
                }); //材质对象
                var points = new THREE.Points(geometry, material); //点模型对象
                group.add(points);
            })
            return group;
        },
        initThree(){
            var scene=new THREE.Scene();
            // var mesh=this.addGlobalMesh(100);
            // scene.add(mesh)
            // var lon2xyz=this.lon2xyz(100,113.5,34.5);
            // var sphere=this.addSphere(100,10,lon2xyz);
            // scene.add(sphere)
            var [mesh,WaveMeshArr]=this.addEarth(scene);
            scene.add(WaveMeshArr)


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
            this.WaveMeshArr=WaveMeshArr;
            this.camera=camera;
            this.scene=scene;
            this.renderer.render(this.scene, this.camera);

            this.render();
            console.log(mesh)

        },
        render(){
            this.mesh.rotateY(0.001);
            this.WaveMeshArr.rotateY(0.001);
            this.WaveMeshArr.children.forEach(mesh=>{
                mesh._s += 0.007;
                mesh.scale.set(mesh.size*mesh._s,mesh.size*mesh._s,mesh.size*mesh._s);
                if (mesh._s <= 1.5) {
                    mesh.material.opacity = (mesh._s-1) * 2;//2等于1/(1.5-1.0)，保证透明度在0~1之间变化
                } else if (mesh._s > 1.5 && mesh._s <= 2) {
                    mesh.material.opacity =  1 - (mesh._s - 1.5)*2;//2等于1/(2.0-1.5) mesh缩放2倍对应0 缩放1.5被对应1
                } else {
                    mesh._s = 1.0;
                }
            })
            this.renderer.render(this.scene,this.camera);
            requestAnimationFrame(this.render.bind(this))
        },
        addControl(){
            var controls = new OrbitControls(this.camera, this.renderer.domElement);
        },
        lon2xyz(R,longitude,latitude) {
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
                x:x,
                y:y,
                z:z,
            };
        }
    }
    window.XNWebglGlobal = XNWebglGlobal;
})(window, XNQuery)
