//! XNWebglGlobal.js
//！ 仙女座threejs地球可视化
//! https://github.com/fanaiai/xnwebglglobal
//! version : 1.0.0
//! authors : 范媛媛
//! create date:2021/03/10
//! update date:2021/03/10 v1.0.0发布
import './xnquery.js'
import './xnwebglglobal.css'
import * as THREE from './three/three.module.js'
import {OrbitControls} from './three/OrbitControls.js';
import Delaunator from 'delaunator';
import {BufferGeometryUtils} from './three/BufferGeometryUtils.js';
import {CSS2DRenderer, CSS2DObject} from './three/CSS2DRenderer.js';

(function (window, $) {
    // var that;
    var option = {
        R: '100',
        backgroundColor: '#000000',
        backgroundOpacity: 1,
        type: 'area',//hot,fly
        baseGlobal: {
            color: '#000000',
            opacity: 1,
            countryPolygonType: 'grid',//grid,area
            gridSize: 2,
            gridStep: 2,
            gridColor: '#00ccc2',
            areaColor: '#071c1c',
            areaLine: '#00ccc2',
            showLine: false,
            showArea: true,
            hoverColor: '#ffffff',//鼠标移动至区域时的颜色
            texture: {
                show: false,
                img: ''
            },
            "areaOpacity":1,
            "areaLineOpacity":1,
            "gridOpacity":1
        },
        tooltip: {
            "show": true,
            "content": "",
            "backgroundColor": "rgba(8,85,139,.8)",
            "backgroundImage": "",
            "backgroundSize": "",
            "borderColor": "#00B4FF",
            "color": "#fff",
            "borderRadius": 4,
            "borderWidth": 1,
            "fontSize": 12,
            "borderStyle": "solid",
            "padding": 4,
        },
        "label": {
            "start": {
                "backgroundColor": "rgba(8,85,139,.8)",
                "backgroundImage": "",
                "backgroundSize": "",
                "borderColor": "#00B4FF",
                "color": "#fff",
                "borderRadius": 4,
                "borderWidth": 1,
                "show": true,
                "fontSize": 12,
                "borderStyle": "solid",
                "padding": 4,
                "content": "",
            },
            "end": {
                "backgroundColor": "rgba(8,85,139,.8)",
                "backgroundImage": "",
                "backgroundSize": "",
                "borderColor": "#00B4FF",
                "color": "#fff",
                "borderRadius": 4,
                "borderWidth": 1,
                "show": true,
                "fontSize": 12,
                "borderStyle": "solid",
                "padding": 4,
                "content": "<p class=\"paragraph\" style='padding:4px 6px'><span class=\"bi-label-field\" data-key=\"ZKUNNR_ZLANDX\" contenteditable=\"false\">money</span> <span class=\"bi-label-field\" data-key=\"money$$_sum\" contenteditable=\"false\">money</span>元<br></p>"
            },
        },
        lightSphere: {
            show: true,
            color: '#048989',
            opacity: 2
        },
        attr: {
            area: {
                colors: ['#ff0000', '#ffffff'],
            },
            hot: {
                type: {
                    'circleLight': {
                        show: true,
                        width: .12,ratio:1
                    },
                    'lightBar': {
                        show: true,
                        width: .12,ratio:1
                    },
                    'bar': {
                        show: false,
                        segments: 4,
                        radiusTop: 4,
                        radiusBottom: 4
                    },
                    'wave': {
                        show: true,
                        width: .22,
                    },
                    'cone': {
                        show: false,
                        height: 1 / 16,
                        ratio: 3,
                        segments: 4,
                    }
                },//都添加什么元素
                colors: ['#2c8ad7', '#3bd5ac', '#d5860c'],
            },
            fly: {
                type: {
                    'circleLight': {
                        show: true,
                        width: .12,ratio:1
                    },
                    'lightBar': {
                        show: true,
                        width: .12,ratio:1
                    },
                    'bar': {
                        show: false,
                        segments: '4',
                        radiusTop: 2,
                        radiusBottom: 2
                    },
                    'wave': {
                        show: true,
                        width: .22,
                    },
                    'flyLine': {
                        show: true,
                        color: '#00ccc2',
                        width: 2,
                        lineType: 'Basic',//Dashed
                        dashSize: 3,
                        gapSize: 1
                    },
                    'flyPoint': {
                        show: true,
                        color: '#ffaa00',
                        len: .2,
                        pointSize: 6
                    },
                    'cone': {
                        show: true,
                        height: 1 / 16,
                        ratio: 3,
                        segments: 4,
                    }
                },//都添加什么元素
                colors: ['#00ccc2', '#ffff4a',],
            }
        },
        animate: {
            open: true,
            rotateStep: 0.002
        },
    }

    function XNWebglGlobal(dom, options) {
        this.dom = dom;
        this.dom.innerHTML = ''
        dom.classList.add("xnglobal-container");
        this.id = this.getRandomString();
        dom.setAttribute('data-id', this.id);
        this.option = $.extend(true, {}, option, options);
        this.option.R = parseFloat(this.option.R)
        this.option.width = this.dom.offsetWidth;
        this.option.height = this.dom.offsetHeight;
        this.labelArry = [];
        this.chooseMesh = null;
        this.calcMeshArry = null;
        this.mouseoverearth = false;
        this.setLabelRender();
        this.initThree();
        this.addControl();
        this.addGlobal();


        this['add' + this.option.type]()
        this.eventList = {}
        if (this.option.tooltip.show) {
            this.tooltip = this.addtooltip();
            this.scene.add(this.tooltip);
        }
        this.addEvent();
    }

    XNWebglGlobal.prototype = {
        getRandomString(len) {
            len = len || 8;
            var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz';
            /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
            var maxPos = $chars.length;
            var pwd = '';
            for (let i = 0; i < len; i++) {
                pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
            }
            return pwd;
        },
        addLabel(position, data, content) {
            if (!this.option.label[content].show) {
                return;
            }
            var div = document.createElement('div');
            div.classList.add('xnwebglobal-label')
            var worldVector = new THREE.Vector3(
                position.x,
                position.y,
                position.z
            );
            var standardVector = worldVector.project(this.camera);//世界坐标转标准设备坐标
            var a = this.option.width / 2;
            var b = this.option.height / 2;
            var x = Math.round(standardVector.x * a + a);//标准设备坐标转屏幕坐标
            var y = Math.round(-standardVector.y * b + b);//标准设备坐标转屏幕坐标
            /**
             * 更新立方体元素位置
             */
            div.style.left = x + 'px';
            div.style.top = y + 'px';
            this._setLabelStyle(div, this.option.label[content]);

            // var coor=this.lon2xyz(this.option.R*1.01,lon,lat);
            if (position.z < 0) {
                div.style.display = 'none'
                // console.log(coor,cont)
            } else {
                div.style.display = 'block'
            }
            div.innerHTML = this.calcTextLabel(this.option.label[content].content, data);
            this.dom.appendChild(div)
            this.labelArry.push({
                dom: div,
                position: position
            })
        },
        calcTextLabel: function (content, v) {
            var that = this;
            var html = document.createElement('div')
            html.innerHTML = content;
            html.querySelectorAll(".bi-label-field").forEach(function (el) {
                var field = el.getAttribute("data-key");
                if (field == that.option.valueName && that.option.formatValue) {
                    field = that.option.formatValue;
                }
                if (el && el.children) {
                    while (el && el.children.length >= 1) {
                        el = el.children[0]
                    }
                }
                if (v[field] != undefined) {
                    el.innerText = (v[field]);
                } else {
                    el.innerText = ''
                }
            })
            return html.innerHTML;
        },
        _setLabelStyle(div, css) {
            div.style.backgroundColor = css.backgroundColor;
            div.style.backgroundImage = 'url(' + css.backgroundImage + ')';
            div.style.backgroundSize = css.backgroundSize;
            div.style.fontSize = css.fontSize;
            div.style.lineHeight = css.lineHeight;
            div.style.color = css.color;
            div.style.borderRadius = css.borderRadius + 'px';
            div.style.borderWidth = css.borderWidth + 'px';
            div.style.borderStyle = css.borderStyle;
            div.style.borderColor = css.borderColor;
            div.style.padding = css.padding;
        },
        updataLabelPos() {
            // if (!this.option.label.show) {
            //     return;
            // }
            this.labelArry.forEach((ele) => {
                var div = ele.dom;
                var position = ele.position;
                var quaternion = new THREE.Quaternion();
                var quaternion1 = new THREE.Quaternion();
                quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rotate);
                var rotateY = this.controls.getAzimuthalAngle() > 0 ? (Math.PI * 2 - this.controls.getAzimuthalAngle()) : this.controls.getAzimuthalAngle()
                quaternion1.setFromEuler(new THREE.Euler(-this.controls.getPolarAngle() + Math.PI / 2, rotateY, 0, 'XYZ'))
                var worldVector = new THREE.Vector3(
                    position.x,
                    position.y,
                    position.z
                );
                var worldVector1 = new THREE.Vector3(
                    position.x,
                    position.y,
                    position.z
                );
                worldVector1.applyQuaternion(quaternion).applyQuaternion(quaternion1)
                worldVector.applyQuaternion(quaternion);
                if (worldVector1.z < 0) {
                    div.style.display = 'none'
                } else {
                    div.style.display = 'block'
                }
                var standardVector = worldVector.project(this.camera);//世界坐标转标准设备坐标
                var a = this.option.width / 2;
                var b = this.option.height / 2;
                var x = Math.round(standardVector.x * a + a);//标准设备坐标转屏幕坐标
                var y = Math.round(-standardVector.y * b + b);//标准设备坐标转屏幕坐标
                /**
                 * 更新立方体元素位置
                 */
                div.style.left = x + 20 + 'px';
                div.style.top = y - 20 + 'px';
                // div.innerHTML = standardVector.z
            })
        },
        _addEarthItem(attr, isFly) {
            var textureLoader = new THREE.TextureLoader(); // TextureLoader创建一个纹理加载器对象
            var basetexture = textureLoader.load(staticpath + '/static/标注.png');
            var lightbartexture = textureLoader.load(staticpath + '/static/光柱.png');
            var wavetexture = textureLoader.load(staticpath + '/static/光圈贴图.png');
            this.calcMeshArry = [];
            this.WaveMeshArr = [];
            this.flyArr = [];
            this.ConeMeshArry = []
            var hotDataMesh = new THREE.Group();
            var [min, max] = this.getMaxMin(this.option.data, this.option.valueName);
            var maxNum = max[this.option.valueName];
            var minNum = min[this.option.valueName];
            if (!isFly) {
                this.option.data.forEach((obj, i) => {
                    var value=obj[this.option.valueName];
                    if(this.isLog){
                        value=Math.log(value);
                    }
                    if(!obj[this.option.lonlat]){
                        return;
                    }
                    var lonlat = obj[this.option.lonlat].split(',');//经度
                    var lon = lonlat[0]
                    var lat = lonlat[1]//纬度
                    this.addBaseItem(hotDataMesh, attr, lon, lat, basetexture, lightbartexture, wavetexture, value, minNum, maxNum, obj, isFly,this.isLog)
                })
            }
            if (isFly) {//飞线时需要重新计算起点和终点的值
                var endData = {};
                var startData = {};
                this.option.data.forEach((obj, i) => {
                    var endName = obj[this.option.toCountryName];
                    var startName = obj[this.option.countryName];
                    if (!endData[endName]) {
                        endData[endName] = {value: 0};
                    }
                    endData[endName].value += obj[this.option.valueName];

                    if (!startData[startName]) {
                        startData[startName] = {value: 0};
                    }
                    startData[startName].value += obj[this.option.valueName];
                })
                var [endMin, endMax,endisLog] = this.getMaxMinFromJSON(endData);
                var [startMin, startMax,startisLog] = this.getMaxMinFromJSON(startData);
                this.option.data.forEach((obj, i) => {
                    var lonlat = obj[this.option.lonlat].split(',');//经度
                    var lon = lonlat[0]
                    var lat = lonlat[1]//纬度
                    var tlonlat = obj[this.option.toLonlat].split(',');//经度
                    var tlon = tlonlat[0]
                    var tlat = tlonlat[1]//纬度
                    if(lon!=tlon || lat!=tlat){
                    var flyLine = this.flyArc(lon, lat, tlon, tlat)
                    hotDataMesh.add(flyLine); //飞线插入flyArcGroup中
                    this.calcMeshArry.push(flyLine);

                    this.flyArr.push(flyLine.flyLine);//获取飞线段
                    flyLine.meshType = 'flyline'
                    flyLine.origindata = obj;
                    }
                    obj.$$_endData = endData[obj[this.option.toCountryName]];
                    obj.$$_startData = startData[obj[this.option.countryName]];
                    var endValue=obj.$$_endData.value;
                    if(endisLog){
                        endValue=Math.log(endValue);
                    }
                    this.addBaseItem(hotDataMesh, attr, tlon, tlat, basetexture, lightbartexture, wavetexture, endValue, endMin, endMax, obj, isFly)
                    var SphereCoord = this.lon2xyz(this.option.R * 1.001, tlon, tlat);//SphereCoord球面坐标
                    this.addLabel(SphereCoord, obj, 'end')
                    if (obj.$$_startData && !obj.$$_startData.rendered) {//是起始点的时候画棱锥
                        if (!endData[obj[this.option.countryName]]) {
                            var SphereCoord = this.lon2xyz(this.option.R * 1.001, lon, lat);//SphereCoord球面坐标
                            var startValue=obj.$$_startData.value;
                            if(startisLog){
                                startValue=Math.log(startValue);
                            }
                            var color = this._calcColorSeg(startValue, startMin, startMax, attr.colors)
                            // var startheight = 5 + this.option.R  * (startValue-startMin) / (startMax-startMin);// 热度越高，光柱高度越高
                            if (attr.type.cone.show) {
                                var ConeMesh = this.createConeMesh(attr, this.option.R * obj.$$_startData.value * attr.type['cone'].height / (startMax), SphereCoord);//棱锥
                                hotDataMesh.add(ConeMesh);
                                ConeMesh.material.color.set(color)
                                this.ConeMeshArry.push(ConeMesh)
                            }
                            this.addLabel(SphereCoord, obj, 'start')
                            if (attr.type['circleLight'].show) {
                                var circleLight = this.createPointBaseMesh(attr, this.option.R, SphereCoord, basetexture);//光柱底座矩形平面
                                circleLight.material.color.set(color)
                                hotDataMesh.add(circleLight);
                            }
                            if (attr.type['wave'].show) {
                                var wave = this.createWaveMesh(attr, this.option.R * 1.1, SphereCoord, wavetexture);//波动光圈
                                hotDataMesh.add(wave);
                                wave.material.color.set(color)
                                this.WaveMeshArr.push(wave);
                            }
                            obj.$$_startData.rendered = true;
                        }
                    }
                })
            }
            this.earth.add(hotDataMesh)
        },
        getMaxMinFromJSON(json) {
            var min, max;
            for (let i in json) {
                if (json[i].value < min || min == undefined) {
                    min = json[i].value
                }
                if (json[i].value > max || max == undefined) {
                    max = json[i].value
                }
            }

            var isLog=false;
            if(Math.log(max)/Math.log(min)>1){
                min=Math.log(min);
                max=Math.log(max);
                isLog=true;
            }
            return [min,max,isLog]
            //
            //
            // if (Math.log10(max - min) > 2) {
            //     max = max * Math.pow(10, Math.log10(max - min) - 1)
            // }
            // return [min, max]
        },
        addBaseItem(hotDataMesh, attr, lon, lat, basetexture, lightbartexture, wavetexture, value, minNum, maxNum, origindata, isFly,isLog) {
            var circleLight, lightBar, wave, bar, ConeMesh
            var SphereCoord = this.lon2xyz(this.option.R, lon, lat);//SphereCoord球面坐标
            var SphereCoord1 = this.lon2xyz(this.option.R * 1.003, lon, lat);//SphereCoord球面坐标
            if (attr.type['circleLight'].show) {
                circleLight = this.createPointBaseMesh(attr, this.option.R, SphereCoord1, basetexture);//光柱底座矩形平面
                hotDataMesh.add(circleLight);
                !isFly && (this.calcMeshArry.push(circleLight))
                circleLight.origindata = origindata;
            }
            if((maxNum-minNum)==0){
                var height = 5
            }
            else{
            var height = 5 + this.option.R  * (value-minNum) / (maxNum-minNum);// 热度越高，光柱高度越高
                }
            if (attr.type['lightBar'].show) {
                height=height*parseFloat(this.option.attr[this.option.type].type.lightBar.ratio);
                lightBar = this.createLightPillar(attr, this.option.R, SphereCoord, height, lightbartexture);//光柱
                hotDataMesh.add(lightBar);
                !isFly && (this.calcMeshArry.push(lightBar))
                lightBar.origindata = origindata;
            }

            if (attr.type['wave'].show) {
                wave = this.createWaveMesh(attr, this.option.R, SphereCoord1, wavetexture);//波动光圈
                hotDataMesh.add(wave);
                this.WaveMeshArr.push(wave);
                !isFly && (this.calcMeshArry.push(wave))
                // this.calcMeshArry.push(wave)
                wave.origindata = origindata;
            }

            if (attr.type['bar'].show) {
                height=height*parseFloat(this.option.attr[this.option.type].type.bar.ratio);
                bar = this.createPrism(this.option.R, SphereCoord, height, attr)
                hotDataMesh.add(bar)
                !isFly && (this.calcMeshArry.push(bar))
                // this.calcMeshArry.push(bar)
                bar.origindata = origindata;
            }
            if (attr.type['cone'].show && !isFly) {
                ConeMesh = this.createConeMesh(this.option.R * (value-minNum) * attr.type['cone'].height / (maxNum), SphereCoord);//棱锥
                hotDataMesh.add(ConeMesh);
                this.ConeMeshArry.push(ConeMesh)
                !isFly && (this.calcMeshArry.push(ConeMesh))
                // this.calcMeshArry.push(ConeMesh)
                ConeMesh.origindata = origindata;
            }
            if (!isFly) {
                this.addLabel(SphereCoord1, origindata, 'start')
            }
            this.changeColor(attr, lightBar, circleLight, wave, bar, ConeMesh, value, minNum, maxNum);//设置热点Mesh颜色
        },
        createConeMesh(attr, radius, SphereCoord) {
            if (radius < 1) {
                radius = 1;
            }
            // var radius = R / 32;//圆锥半径  和地球半径建立尺寸关系
            var height = radius * attr.type.cone.ratio;//棱锥高度
            // 圆锥体几何体API(ConeGeometry)圆周方向四等分实现四棱锥效果
            var geometry = new THREE.ConeGeometry(radius, height, attr.type.cone.segments);
            // 缓冲类型几何体BufferGeometry没有computeFlatVertexNormals方法
            geometry.computeFlatVertexNormals();//一种计算顶点法线方式，非光滑渲染
            // 可以根据需要旋转到特定角度
            // geometry.rotateX(Math.PI);
            geometry.rotateX(-Math.PI / 2);
            geometry.translate(0, 0, height / 2);
            // MeshBasicMaterial MeshLambertMaterial
            var material = new THREE.MeshLambertMaterial({
                color: 0x00ffff,
            });
            var mesh = new THREE.Mesh(geometry, material);

            // 棱锥上在叠加一个棱锥
            var mesh2 = mesh.clone();
            mesh2.scale.z = 0.5;
            mesh2.position.z = height * (1 + mesh2.scale.z);
            mesh2.rotateX(Math.PI);
            mesh.add(mesh2);

            // 经纬度转球面坐标
            // var coord = this.lon2xyz(this.option.R * 1.001, lon, lat)
            //设置mesh位置
            mesh.position.set(SphereCoord.x, SphereCoord.y, SphereCoord.z);
            // mesh姿态设置
            // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
            var coordVec3 = new THREE.Vector3(SphereCoord.x, SphereCoord.y, SphereCoord.z).normalize();
            // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
            var meshNormal = new THREE.Vector3(0, 0, 1);
            // 四元数属性.quaternion表示mesh的角度状态
            //.setFromUnitVectors();计算两个向量之间构成的四元数值
            mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);

            return mesh;
        },
        changeColor(attr, LightPillar, mesh, WaveMesh, barMesh, ConMesh, value, minNum, maxNum) {
            var color = this._calcColorSeg(value, minNum, maxNum, attr.colors)
            // 光柱颜色设置
            LightPillar && (LightPillar.children[0].material.color.set(color));
            // 光柱底座颜色设置
            mesh && (mesh.material.color.set(color));
            // 波动光圈颜色设置
            WaveMesh && (WaveMesh.material.color.set(color));
            barMesh && (barMesh.material.color.set(color));
            ConMesh && (ConMesh.material.color.set(color));
        },
        addfly() {
            this.addarea(true)
            this._addEarthItem(this.option.attr.fly, true)
        },
        flyArc(lon1, lat1, lon2, lat2) {
            var R = this.option.R;
            var sphereCoord1 = this.lon2xyz(R, lon1, lat1);//经纬度坐标转球面坐标
            // startSphereCoord：轨迹线起点球面坐标
            var startSphereCoord = new THREE.Vector3(sphereCoord1.x, sphereCoord1.y, sphereCoord1.z);
            var sphereCoord2 = this.lon2xyz(R, lon2, lat2);
            // startSphereCoord：轨迹线结束点球面坐标
            var endSphereCoord = new THREE.Vector3(sphereCoord2.x, sphereCoord2.y, sphereCoord2.z);

            //计算绘制圆弧需要的关于y轴对称的起点、结束点和旋转四元数
            var startEndQua = this._3Dto2D(startSphereCoord, endSphereCoord)
            // 调用arcXOY函数绘制一条圆弧飞线轨迹
            var arcline = this.arcXOY(startEndQua.startPoint, startEndQua.endPoint);
            arcline.quaternion.multiply(startEndQua.quaternion)
            return arcline;
        },
        _3Dto2D(startSphere, endSphere) {
            /*计算第一次旋转的四元数：表示从一个平面如何旋转到另一个平面*/
            var origin = new THREE.Vector3(0, 0, 0);//球心坐标
            var startDir = startSphere.clone().sub(origin);//飞线起点与球心构成方向向量
            var endDir = endSphere.clone().sub(origin);//飞线结束点与球心构成方向向量
            // dir1和dir2构成一个三角形，.cross()叉乘计算该三角形法线normal
            var normal = startDir.clone().cross(endDir).normalize();
            var xoyNormal = new THREE.Vector3(0, 0, 1);//XOY平面的法线
            //.setFromUnitVectors()计算从normal向量旋转达到xoyNormal向量所需要的四元数
            // quaternion表示把球面飞线旋转到XOY平面上需要的四元数
            var quaternion3D_XOY = new THREE.Quaternion().setFromUnitVectors(normal, xoyNormal);
            /*第一次旋转：飞线起点、结束点从3D空间第一次旋转到XOY平面*/
            var startSphereXOY = startSphere.clone().applyQuaternion(quaternion3D_XOY);
            var endSphereXOY = endSphere.clone().applyQuaternion(quaternion3D_XOY);

            /*计算第二次旋转的四元数*/
            // middleV3：startSphereXOY和endSphereXOY的中点
            var middleV3 = startSphereXOY.clone().add(endSphereXOY).multiplyScalar(0.5);
            var midDir = middleV3.clone().sub(origin).normalize();// 旋转前向量midDir，中点middleV3和球心构成的方向向量
            var yDir = new THREE.Vector3(0, 1, 0);// 旋转后向量yDir，即y轴
            // .setFromUnitVectors()计算从midDir向量旋转达到yDir向量所需要的四元数
            // quaternion2表示让第一次旋转到XOY平面的起点和结束点关于y轴对称需要的四元数
            var quaternionXOY_Y = new THREE.Quaternion().setFromUnitVectors(midDir, yDir);

            /*第二次旋转：使旋转到XOY平面的点再次旋转，实现关于Y轴对称*/
            var startSpherXOY_Y = startSphereXOY.clone().applyQuaternion(quaternionXOY_Y);
            var endSphereXOY_Y = endSphereXOY.clone().applyQuaternion(quaternionXOY_Y);

            /**一个四元数表示一个旋转过程
             *.invert()方法表示四元数的逆，简单说就是把旋转过程倒过来
             * 两次旋转的四元数执行.invert()求逆，然后执行.multiply()相乘
             *新版本.invert()对应旧版本.invert()
             */
            var quaternionInverse = quaternion3D_XOY.clone().invert().multiply(quaternionXOY_Y.clone().invert())
            return {
                // 返回两次旋转四元数的逆四元数
                quaternion: quaternionInverse,
                // 范围两次旋转后在XOY平面上关于y轴对称的圆弧起点和结束点坐标
                startPoint: startSpherXOY_Y,
                endPoint: endSphereXOY_Y,
            }
        },
        arcXOY(startPoint, endPoint) {
            var R = this.option.R;
            // 计算两点的中点
            var middleV3 = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
            // 弦垂线的方向dir(弦的中点和圆心构成的向量)
            var dir = middleV3.clone().normalize()
            // 计算球面飞线的起点、结束点和球心构成夹角的弧度值
            var earthRadianAngle = this.radianAOB(startPoint, endPoint, new THREE.Vector3(0, 0, 0))
            /*设置飞线轨迹圆弧的中间点坐标
            弧度值 * R * 0.2：表示飞线轨迹圆弧顶部距离地球球面的距离
            起点、结束点相聚越远，构成的弧线顶部距离球面越高*/
            var arcTopCoord = dir.multiplyScalar(R + earthRadianAngle * R * 0.2)
            //求三个点的外接圆圆心(飞线圆弧轨迹的圆心坐标)
            var flyArcCenter = this.threePointCenter(startPoint, endPoint, arcTopCoord)
            // 飞线圆弧轨迹半径flyArcR
            var flyArcR = Math.abs(flyArcCenter.y - arcTopCoord.y);
            /*坐标原点和飞线起点构成直线和y轴负半轴夹角弧度值
            参数分别是：飞线圆弧起点、y轴负半轴上一点、飞线圆弧圆心*/
            var flyRadianAngle = this.radianAOB(startPoint, new THREE.Vector3(0, -1, 0), flyArcCenter);
            var startAngle = -Math.PI / 2 + flyRadianAngle;//飞线圆弧开始角度
            var endAngle = Math.PI - startAngle;//飞线圆弧结束角度
            // 调用圆弧线模型的绘制函数
            if (this.option.attr.fly.type.flyLine.show) {
                var arcline = this.circleLine(flyArcCenter.x, flyArcCenter.y, flyArcR, startAngle, endAngle)
            } else {
                var arcline = new THREE.Group();
            }
            // var arcline = new THREE.Group();// 不绘制轨迹线，使用THREE.Group替换circleLine()即可
            arcline.center = flyArcCenter;//飞线圆弧自定一个属性表示飞线圆弧的圆心
            arcline.topCoord = arcTopCoord;//飞线圆弧自定一个属性表示飞线圆弧中间也就是顶部坐标

            if (this.option.attr.fly.type.flyPoint.show) {
                // var flyAngle = Math.PI/ 10; //飞线圆弧固定弧度
                var flyAngle = this.option.attr.fly.type.flyPoint.len; //飞线圆弧的弧度和轨迹线弧度相关
                // 绘制一段飞线，圆心做坐标原点
                var flyLine = this.createFlyLine(flyArcR, startAngle, startAngle + flyAngle);
                flyLine.position.y = flyArcCenter.y;//平移飞线圆弧和飞线轨迹圆弧重合

                //飞线段运动范围startAngle~flyEndAngle
                flyLine.flyEndAngle = endAngle - startAngle - flyAngle;
                flyLine.startAngle = startAngle;
                // arcline.flyEndAngle：飞线段当前角度位置，这里设置了一个随机值用于演示
                flyLine.AngleZ = arcline.flyEndAngle * Math.random();
                // flyLine.rotation.z = arcline.AngleZ;
                // arcline.flyLine指向飞线段,便于设置动画是访问飞线段

                //飞线段flyLine作为飞线轨迹arcLine子对象，继承飞线轨迹平移旋转等变换
                arcline.add(flyLine);
            }
            arcline.flyLine = flyLine;

            return arcline
        },
        createFlyLine(r, startAngle, endAngle) {
            var geometry = new THREE.BufferGeometry(); //声明一个几何体对象BufferGeometry
            // THREE.ArcCurve创建圆弧曲线
            var arc = new THREE.ArcCurve(0, 0, r, startAngle, endAngle, false);
            //getSpacedPoints是基类Curve的方法，返回一个vector2对象作为元素组成的数组
            var pointsArr = arc.getSpacedPoints(80); //分段数80，返回81个顶点
            geometry.setFromPoints(pointsArr);// setFromPoints方法从pointsArr中提取数据改变几何体的顶点属性vertices
            // 每个顶点对应一个百分比数据attributes.percent 用于控制点的渲染大小
            var percentArr = []; //attributes.percent的数据
            for (var i = 0; i < pointsArr.length; i++) {
                percentArr.push(i / pointsArr.length);
            }
            var percentAttribue = new THREE.BufferAttribute(new Float32Array(percentArr), 1);
            // 通过顶点数据percent点模型从大到小变化，产生小蝌蚪形状飞线
            geometry.attributes.percent = percentAttribue;
            // 批量计算所有顶点颜色数据
            var colorArr = [];
            for (var i = 0; i < pointsArr.length; i++) {
                var color1 = new THREE.Color(this.option.attr.fly.type.flyLine ? this.option.attr.fly.type.flyLine.color : this.option.attr.fly.type.flyPoint.color); //轨迹线颜色 青色
                var color2 = new THREE.Color(this.option.attr.fly.type.flyPoint.color); //黄色
                var color = color1.lerp(color2, i / pointsArr.length)
                colorArr.push(color.r, color.g, color.b);
            }
            // 设置几何体顶点颜色数据
            geometry.attributes.color = new THREE.BufferAttribute(new Float32Array(colorArr), 3);
            // 点模型渲染几何体每个顶点
            var material = new THREE.PointsMaterial({
                // color: 0xffff00,
                size: this.option.attr.fly.type.flyPoint.pointSize, //点大小
                vertexColors: THREE.VertexColors, //使用顶点颜色渲染
            });
            // 修改点材质的着色器源码(注意：不同版本细节可能会稍微会有区别，不过整体思路是一样的)
            material.onBeforeCompile = function (shader) {
                // 顶点着色器中声明一个attribute变量:百分比
                shader.vertexShader = shader.vertexShader.replace(
                    'void main() {',
                    [
                        'attribute float percent;', //顶点大小百分比变量，控制点渲染大小
                        'void main() {',
                    ].join('\n') // .join()把数组元素合成字符串
                );
                // 调整点渲染大小计算方式
                shader.vertexShader = shader.vertexShader.replace(
                    'gl_PointSize = size;',
                    [
                        'gl_PointSize = percent * size;',
                    ].join('\n') // .join()把数组元素合成字符串
                );
            };
            var FlyLine = new THREE.Points(geometry, material);
            // var material = new THREE.LineBasicMaterial({color: 0xffff00,});//线条材质
            // var line = new THREE.Line(geometry, material);//线条模型对象
            return FlyLine;
        },
        radianAOB(A, B, O) {
            // dir1、dir2：球面上两个点和球心构成的方向向量
            var dir1 = A.clone().sub(O).normalize();
            var dir2 = B.clone().sub(O).normalize();
            //点乘.dot()计算夹角余弦值
            var cosAngle = dir1.clone().dot(dir2);
            var radianAngle = Math.acos(cosAngle);//余弦值转夹角弧度值,通过余弦值可以计算夹角范围是0~180度
            return radianAngle
        },
        circleLine(x, y, r, startAngle, endAngle) {
            var geometry = new THREE.Geometry(); //声明一个几何体对象Geometry
            // THREE.ArcCurve创建圆弧曲线
            var arc = new THREE.ArcCurve(x, y, r, startAngle, endAngle, false);
            //getSpacedPoints是基类Curve的方法，返回一个vector2对象作为元素组成的数组
            var points = arc.getSpacedPoints(50); //分段数50，返回51个顶点
            geometry.setFromPoints(points);// setFromPoints方法从points中提取数据改变几何体的顶点属性vertices
            var attr = this.option.attr.fly.type.flyLine
            var type = attr.lineType;
            var dashSize = attr.dashSize;
            var gapSize = attr.gapSize;
            var materialoption = {
                color: attr.color || '#ffffff',
            }
            if (type == 'Dashed') {
                var materialoption = {
                    color: attr.color || '#ffffff',
                    dashSize: dashSize,
                    gapSize: gapSize,
                    scale: 1,
                }
            }
            var material = new THREE['Line' + type + 'Material'](
                materialoption
            );//线条材质
            if (type == 'Dashed') {
                var line = new THREE.LineSegments(geometry, material);//线条模型对象
            } else {
                var line = new THREE.Line(geometry, material);//线条模型对象
            }
            return line;
        },
        threePointCenter(p1, p2, p3) {
            var L1 = p1.lengthSq();//p1到坐标原点距离的平方
            var L2 = p2.lengthSq();
            var L3 = p3.lengthSq();
            var x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y;
            var S = x1 * y2 + x2 * y3 + x3 * y1 - x1 * y3 - x2 * y1 - x3 * y2;
            var x = (L2 * y3 + L1 * y2 + L3 * y1 - L2 * y1 - L3 * y2 - L1 * y3) / S / 2;
            var y = (L3 * x2 + L2 * x1 + L1 * x3 - L1 * x2 - L2 * x3 - L3 * x1) / S / 2;
            // 三点外接圆圆心坐标
            var center = new THREE.Vector3(x, y, 0);
            return center
        },
        addhot() {
            this.addarea(true)
            this._addEarthItem(this.option.attr.hot)
        },
        createPrism(R, SphereCoord, height, attr) {

            // var geometry = new THREE.BoxBufferGeometry(3, 3, height);// 长方体 也就是四棱柱
            var geometry = new THREE.CylinderGeometry(attr.type.bar.radiusTop, attr.type.bar.radiusBottom, height, attr.type.bar.segments);//正六棱柱
            geometry.computeFlatVertexNormals();//一种计算顶点法线方式，非光滑渲染
            geometry.rotateX(Math.PI / 2);//高度方向旋转到z轴上

            geometry.translate(0, 0, height / 2);//平移使柱子底部与XOY平面重合
            var material = new THREE.MeshLambertMaterial({
                color: '#ffffff',
            });
            var mesh = new THREE.Mesh(geometry, material);
            // 经纬度转球面坐标
            // var SphereCoord = this.lon2xyz(R, lon, lat);//SphereCoord球面坐标
            mesh.position.set(SphereCoord.x, SphereCoord.y, SphereCoord.z);//设置mesh位置
            // mesh姿态设置
            // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
            var coordVec3 = new THREE.Vector3(SphereCoord.x, SphereCoord.y, SphereCoord.z).normalize();
            // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
            var meshNormal = new THREE.Vector3(0, 0, 1);
            // 四元数属性.quaternion表示mesh的角度状态
            //.setFromUnitVectors();计算两个向量之间构成的四元数值
            mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
            return mesh;
        },
        _calcColorSeg(value, min, max, colors) {
            var step = (max - min) / colors.length;
            // var colorArry=[];
            for (let i = 0; i < colors.length; i++) {
                let min1 = i * step + min;
                let max1 = min1 + step;
                if (value >= min1 && value < max1) {
                    // console.log(value,min1,max1)
                    return colors[i]
                }
                // colorArry.push({
                //     color:colors[i],
                //     scope:[min,max]
                // })
            }
            return colors[colors.length - 1]
        },
        createWaveMesh(attr, R, SphereCoord, texture) {
            var geometry = new THREE.PlaneBufferGeometry(1, 1); //默认在XOY平面上
            // 如果不同mesh材质的透明度、颜色等属性不同，材质不能共享
            var material = new THREE.MeshBasicMaterial({
                color: 0x22ffcc,
                map: texture,
                transparent: true, //使用背景透明的png贴图，注意开启透明计算
                opacity: 1.0,
                // side: THREE.DoubleSide, //双面可见
                depthWrite: false,//禁止写入深度缓冲区数据
            });
            var mesh = new THREE.Mesh(geometry, material);
            // 经纬度转球面坐标
            // var coord = this.lon2xyz(R * 1.001, lon, lat)
            var size = R * attr.type.wave.width;//矩形平面Mesh的尺寸
            mesh.size = size;//自顶一个属性，表示mesh静态大小
            mesh.scale.set(size, size, size);//设置mesh大小
            mesh._s = Math.random() * 1.0 + 1.0;//自定义属性._s表示mesh在原始大小基础上放大倍数  光圈在原来mesh.size基础上1~2倍之间变化
            // mesh.scale.set(mesh.size*mesh._s,mesh.size*mesh._s,mesh.size*mesh._s);
            //设置mesh位置
            mesh.position.set(SphereCoord.x, SphereCoord.y, SphereCoord.z);

            // mesh姿态设置
            // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
            var coordVec3 = new THREE.Vector3(SphereCoord.x, SphereCoord.y, SphereCoord.z).normalize();
            // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
            var meshNormal = new THREE.Vector3(0, 0, 1);
            // 四元数属性.quaternion表示mesh的角度状态
            //.setFromUnitVectors();计算两个向量之间构成的四元数值
            mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);

            return mesh;
        },
        createLightPillar(attr, R, SphereCoord, height, texture) {
            // 矩形平面网格模型设置背景透明的png贴图
            // var height = R*0.3;//光柱高度，和地球半径相关，这样调节地球半径，光柱尺寸跟着变化
            var geometry = new THREE.PlaneBufferGeometry(R * attr.type.lightBar.width, height); //默认在XOY平面上
            geometry.rotateX(Math.PI / 2);//光柱高度方向旋转到z轴上
            geometry.translate(0, 0, height / 2);//平移使光柱底部与XOY平面重合
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                //color: 0x44ffaa, //光柱颜色，光柱map贴图是白色，可以通过color调节颜色
                transparent: true, //使用背景透明的png贴图，注意开启透明计算
                side: THREE.DoubleSide, //双面可见
                depthWrite: false,//是否对深度缓冲区有任何的影响
            });
            var mesh = new THREE.Mesh(geometry, material);
            var group = new THREE.Group();
            // 两个光柱交叉叠加
            // group.add(mesh, mesh.clone().rotateY(Math.PI / 2))
            group.add(mesh, mesh.clone().rotateZ(Math.PI / 2));//几何体绕x轴旋转了，所以mesh旋转轴变为z
            // 经纬度转球面坐标
            // var SphereCoord = this.lon2xyz(R, lon, lat);//SphereCoord球面坐标
            group.position.set(SphereCoord.x, SphereCoord.y, SphereCoord.z);//设置mesh位置
            // mesh姿态设置
            // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
            var coordVec3 = new THREE.Vector3(SphereCoord.x, SphereCoord.y, SphereCoord.z).normalize();
            // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
            var meshNormal = new THREE.Vector3(0, 0, 1);
            // 四元数属性.quaternion表示mesh的角度状态
            //.setFromUnitVectors();计算两个向量之间构成的四元数值
            group.quaternion.setFromUnitVectors(meshNormal, coordVec3);
            return group;
        },
        createPointBaseMesh(attr, R, SphereCoord, texture) {
            var geometry = new THREE.PlaneBufferGeometry(1, 1); //默认在XOY平面上
            var material = new THREE.MeshBasicMaterial({
                color: '#ffffff',
                map: texture,
                transparent: true, //使用背景透明的png贴图，注意开启透明计算
                // side: THREE.DoubleSide, //双面可见
                depthWrite: false,//禁止写入深度缓冲区数据
            });
            var mesh = new THREE.Mesh(geometry, material);
            // 经纬度转球面坐标
            // var SphereCoord1 = this.lon2xyz(R * 1.001, lon, lat)
            var size = R * attr.type.circleLight.width;//矩形平面Mesh的尺寸
            mesh.scale.set(size, size, size);//设置mesh大小

            //设置mesh位置
            mesh.position.set(SphereCoord.x, SphereCoord.y, SphereCoord.z);

            // mesh姿态设置
            // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
            var coordVec3 = new THREE.Vector3(SphereCoord.x, SphereCoord.y, SphereCoord.z).normalize();
            // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
            var meshNormal = new THREE.Vector3(0, 0, 1);
            // 四元数属性.quaternion表示mesh的角度状态
            //.setFromUnitVectors();计算两个向量之间构成的四元数值
            mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);

            return mesh;
        },
        addarea(isNotArea) {
            this.calcMeshArry = [];
            this.getWorldData(data => {
                var dataColor = !isNotArea ? this.calcAreaCountryColor(this.option.data) : null;
                data.features.forEach((country) => {
                    // "Polygon"：国家country有一个封闭轮廓
                    //"MultiPolygon"：国家country有多个封闭轮廓
                    if (country.geometry.type === "Polygon") {
                        // 把"Polygon"和"MultiPolygon"的geometry.coordinates数据结构处理为一致
                        country.geometry.coordinates = [country.geometry.coordinates];
                    }
                    // 解析所有封闭轮廓边界坐标country.geometry.coordinates
                    if (this.option.baseGlobal.showLine) {
                        var line = this.countryLine(this.option.R * 1.002, country.geometry.coordinates);//国家边界

                        this.earth.add(line);//国家边界集合插入earth中
                    }
                    if (this.option.baseGlobal.showArea) {
                        var mesh = this.countryMesh(this.option.R * 1.001, country.geometry.coordinates);//国家轮廓mesh
                        this.earth.add(mesh);//国家Mesh集合插入earth中
                        this.calcMeshArry.push(mesh);
                        mesh.name = country.properties.nameZh;//设置每个国家mesh对应的中文名
                        mesh.meshType = 'area'
                        if (!isNotArea) {
                            if (dataColor[mesh.name]) {//worldZh.json部分国家或地区在gdp.json文件中不存在，判断下，以免报错
                                mesh.material.color.copy(dataColor[mesh.name].color);
                                mesh.color = dataColor[mesh.name].color;//自定义颜色属性 用于射线拾取交互
                                mesh.origindata = dataColor[mesh.name].origindata;//自定义颜色属性 用于射线拾取HTML标签显示
                            } else {
                                mesh.material.color.set(this.option.baseGlobal[this.option.baseGlobal.countryPolygonType + 'Color']);
                                mesh.color = mesh.material.color.clone();//自定义颜色属性 用于射线拾取交互
                            }
                        } else {
                            mesh.material.color.set(this.option.baseGlobal[this.option.baseGlobal.countryPolygonType + 'Color']);
                            mesh.color = mesh.material.color.clone();//自定义颜色属性 用于射线拾取交互
                            // this.addLabel(SphereCoord, obj, 'start')
                        }
                    }
                });
            })
        },
        countryMesh(R, polygonArr) {
            var geometryArr = [];//一个国家多个轮廓，每个轮廓对应的所有几何体
            var pointGeometryArr = [];
            polygonArr.forEach(obj => {
                var polygon = obj[0];//获取多边形轮廓数据polygon
                //gridPoint(polygon):多边形轮廓polygon内填充等间距点
                // pointsArr表示polygon边界上顶点坐标和polygon内填充的顶点坐标
                var [pointsArr, gridPointArr] = this.gridPoint(polygon);
                // 三角剖分生成顶点坐标对应三角形索引
                var trianglesIndexArr = this.delaunay(pointsArr, polygon)
                //三角形顶点经纬度坐标转化为球面坐标
                var spherePointsArr = [];//所有三角形球面坐标
                var colorsArr = [];//顶点颜色数据


                if (this.option.baseGlobal.countryPolygonType == 'area') {
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
                } else {
                    gridPointArr.forEach((item, i) => {
                        // 经纬度坐标转球面坐标
                        var pos = this.lon2xyz(R * 1.002, item[0], item[1])
                        spherePointsArr.push(pos.x, pos.y, pos.z)
                        var gb = Math.cos(item[1] * Math.PI / 180); //0~90 维度越高 亮度越低
                        gb = Math.sqrt(gb);
                        colorsArr.push(0, gb, gb)
                    })
                    var pointGeometry = new THREE.BufferGeometry();
                    pointGeometry.attributes.color = new THREE.BufferAttribute(new Float32Array(colorsArr), 3);
                    pointGeometry.attributes.position = new THREE.BufferAttribute(new Float32Array(spherePointsArr), 3)
                    // console.log(944,pointGeometry.attributes.position)
                    pointGeometryArr.push(pointGeometry);
                }
            });
            if (this.option.baseGlobal.countryPolygonType == 'area') {
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
                    transparent:true,
                    opacity:this.option.baseGlobal.areaOpacity,
                    // side: THREE.BackSide, //背面可见，默认正面可见   THREE.DoubleSide：双面可见
                })
                var mesh = new THREE.Mesh(newGeometry, material)
            } else {
                var newPointGeometry = null;
                if (pointGeometryArr.length == 1) {
                    newPointGeometry = pointGeometryArr[0];//如果一个国家只有一个多边形轮廓，不用进行几何体合并操作
                } else {// 所有几何体合并为一个几何体
                    newPointGeometry = BufferGeometryUtils.mergeBufferGeometries(pointGeometryArr);
                }
                newPointGeometry.computeVertexNormals();//如果使用受光照影响材质，需要计算生成法线
                var pointMaterial = new THREE.PointsMaterial({
                    color: this.option.baseGlobal.gridColor,
                    // vertexColors: THREE.VertexColors, //使用顶点颜色数据渲染
                    size: this.option.baseGlobal.gridSize || 3,
                    transparent:true,
                    opacity:this.option.baseGlobal.gridOpacity,
                });
                var mesh = new THREE.Points(newPointGeometry, pointMaterial);
            }
            return mesh
        },
        countryLine(R, polygonArr) {
            var group = new THREE.Group();//一个国家多个轮廓线条line的父对象
            polygonArr.forEach(polygon => {
                var pointArr = [];//边界线顶点坐标
                polygon[0].forEach(elem => {
                    // 经纬度转球面坐标
                    var coord = this.lon2xyz(R, elem[0], elem[1])
                    // console.log(coord)
                    if (!isNaN(coord.x)) {
                        pointArr.push(coord.x, coord.y, coord.z);
                    }
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
                color: this.option.baseGlobal.areaLine, //线条颜色
                transparent:true,
                opacity:this.option.baseGlobal.areaLineOpacity,
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
            var maxNum = max[this.option.valueName];
            var minNum = min[this.option.valueName];
            data.forEach(obj => {
                var name = obj[this.option.countryName];
                var value = obj[this.option.valueName];
                if(this.isLog){
                    value=Math.log(value);
                }
                var color = null;
                if (!value) {
                    value = 0;
                }
                color = color1.clone().lerp(color2.clone(), Math.sqrt((value-minNum) / maxNum));
                json[name] = {
                    color: color,
                    origindata: obj
                }
            })
            return json;
        },
        getMaxMin(data1, name) {
            this.isLog=false;
            var data=$.extend(true,[],data1)
            data.sort((d1, d2) => {
                if (d1[name] > d2[name]) {
                    return 1;
                } else {
                    return -1;
                }
            })
            var min=$.extend(true,{},data[0]);
            var max=$.extend(true,{},data[data.length - 1]);
            if(max[this.option.valueName]/min[this.option.valueName]>1){
                min[this.option.valueName]=Math.log(min[this.option.valueName]);
                max[this.option.valueName]=Math.log(max[this.option.valueName]);
                this.isLog=true;
            }
            return [min,max]
        },
        addLigthSphere() {
            if (!this.option.lightSphere.show) {
                return;
            }
            var textureLoader = new THREE.TextureLoader();
            var texture = textureLoader.load(staticpath + '/static/地球光圈.png');//加载纹理贴图
// 创建精灵材质对象SpriteMaterial
            var spriteMaterial = new THREE.SpriteMaterial({
                map: texture, //设置精灵纹理贴图
                transparent: true,//开启透明
                opacity: parseFloat(this.option.lightSphere.opacity),//可以通过透明度整体调节光圈
                color: this.option.lightSphere.color
            });
// 创建表示地球光圈的精灵模型
            var sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(this.option.R * 3, this.option.R * 3, 1);//适当缩放精灵
            this.earth.add(sprite);
        },
        addGlobal() {
            this.earth = new THREE.Group();
            this.addGlobalBase();
            this.addLigthSphere();//添加光晕
            this.scene.add(this.earth)
        },
        getWorldData(callback) {
            var loader = new THREE.FileLoader()
            loader.setResponseType('json')
            loader.load(staticpath + '/static/worldZh.json', (data) => {
                if (typeof callback == 'function') {
                    callback(data)
                }
            })
        },
        addGlobalBase() {
            var geo = new THREE.SphereBufferGeometry(this.option.R, 40, 40)
            if (this.option.baseGlobal.texture.show) {
                var textureLoader = new THREE.TextureLoader(); // TextureLoader创建一个纹理加载器对象
                var globalimg = textureLoader.load(this.option.baseGlobal.texture.img);
                // var globalimg = textureLoader.load(staticpath + '/static/earth.jpg');
                var material = new THREE.MeshLambertMaterial({
                    map: globalimg,
                    transparent: true,
                    // color:this.option.baseGlobal.color,
                })
            } else {
                var material = new THREE.MeshLambertMaterial({
                    color: this.option.baseGlobal.color,
                    // color: '#ff0000',
                    transparent: true,
                    opacity: this.option.baseGlobal.opacity,
                    // wireframe:true
                })
            }
            var mesh = new THREE.Mesh(geo, material);
            this.earth.add(mesh)
            // this.addCloud();
        },
        addCloud(){
            var geo = new THREE.SphereBufferGeometry(this.option.R*1.1, 40, 40)
            var textureLoader = new THREE.TextureLoader(); // TextureLoader创建一个纹理加载器对象
            var globalimg = textureLoader.load("/static/2.png");
            // var globalimg = textureLoader.load(staticpath + '/static/earth.jpg');
            var material = new THREE.MeshLambertMaterial({
                map: globalimg,
                transparent: true,
                color:this.option.baseGlobal.color,
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
            // scene.add(axesHelper)
            var width = this.option.width;
            var height = this.option.height;
            var k = width / height;
            var s = 180;
            var camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
            camera.position.set(0, 0, 200); //相机在Three.js坐标系中的位置
            camera.lookAt(0, 0, 0);//注意多边形轮廓不居中问题
            // camera.position.set(-102, 205, -342); //相机在Three.js坐标系中的位置
            // camera.lookAt(0, 0, 0); //相机指向Three.js坐标系原点
            var renderer = new THREE.WebGLRenderer({
                antialias: true, //开启锯齿
                alpha: true
            });
            renderer.setPixelRatio(window.devicePixelRatio);//设置设备像素比率,防止Canvas画布输出模糊。
            renderer.setSize(width, height); //设置渲染区域尺寸
            renderer.setClearColor(this.option.backgroundColor, this.option.backgroundOpacity); //设置背景颜色
            // renderer.domElement表示Three.js渲染结果,也就是一个HTML元素(Canvas画布)
            this.dom.appendChild(renderer.domElement); //body元素中插入canvas画布
            //执行渲染操作   指定场景、相机作为参数
            this.renderer = renderer;
            // this.mesh=mesh;
            // this.WaveMeshArr=WaveMeshArr;
            this.camera = camera;
            this.scene = scene;
            this.renderer.render(this.scene, this.camera);
            this.rotate = 0;
            this.render();
        },
        render() {
            if (!this.scene) {
                cancelAnimationFrame(this.animationId)
                return;
            }
            if (this.flyArr && this.option.attr.fly.type.flyPoint) {
                this.flyArr.forEach((fly) => {
                    fly.rotation.z += 0.02; //调节飞线速度
                    if (fly.rotation.z >= fly.flyEndAngle) fly.rotation.z = fly.startAngle;
                });
            }
            if (this.WaveMeshArr) {
                this.WaveMeshArr.forEach(function (mesh) {
                    mesh._s += 0.007;
                    mesh.scale.set(mesh.size * mesh._s, mesh.size * mesh._s, mesh.size * mesh._s);
                    if (mesh._s <= 1.5) {
                        mesh.material.opacity = (mesh._s - 1) * 2;//2等于1/(1.5-1.0)，保证透明度在0~1之间变化
                    } else if (mesh._s > 1.5 && mesh._s <= 2) {
                        mesh.material.opacity = 1 - (mesh._s - 1.5) * 2;//2等于1/(2.0-1.5) mesh缩放2倍对应0 缩放1.5被对应1
                    } else {
                        mesh._s = 1.0;
                    }
                })
            }
            if (this.ConeMeshArry) {
                this.ConeMeshArry.forEach(mesh => {
                    mesh.rotation.z += 0.02
                })
            }
            if (this.earth && !this.mouseoverearth && this.option.animate.open) {
                this.rotate += parseFloat(this.option.animate.rotateStep);
                if (this.rotate >= Math.PI * 2) {
                    this.rotate = 0;
                }
                // this.earth.rotateY(this.option.animate.rotateStep);//有叠加，在反复，奇怪了
                this.earth.rotation.y = this.rotate;
            }
            this.updataLabelPos();
            this.labelRenderer.render(this.scene, this.camera)
            this.renderer.render(this.scene, this.camera);
            this.animationId = requestAnimationFrame(this.render.bind(this))
        },
        addControl() {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            // controls.target.set(103, 45, 0);
            this.controls.update();
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
        worldpos2xy() {
            let projector = new THREE.Projector();

            let world_vector = new THREE.Vector3(0, 0, 1);

            let vector = world_vector.project(this.camera);
            let halfWidth = window.innerWidth / 2,

                halfHeight = window.innerHeight / 2;

            return {

                x: Math.round(vector.x * halfWidth + halfWidth),

                y: Math.round(-vector.y * halfHeight + halfHeight)

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
            var 间隔 = this.option.baseGlobal.gridStep || 3; //polygon轮廓内填充顶点的经纬度间隔距离，选择一个合适的值，太小，计算量大，太大，国家球面不够光滑
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
            return [[...polygon, ...polygonPointsArr], polygonPointsArr];
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
            labelRenderer.setSize(this.option.width, this.option.height);
            labelRenderer.domElement.style.position = 'absolute';
// 相对鼠标单击位置偏移
            labelRenderer.domElement.style.top = '-16px';
            labelRenderer.domElement.style.left = '0px';
// //设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
            labelRenderer.domElement.style.pointerEvents = 'none';
            this.labelRenderer = labelRenderer;
            this.dom.appendChild(labelRenderer.domElement);
        },
        addtooltip() {
// 创建div元素(作为标签)
            var div = document.createElement('div');
            div.classList.add('xnwebglobal-tooltip')
            div.style.visibility = 'hidden';
            div.innerHTML = '';
            // div.style.padding = '4px 10px';
            // div.style.color = this.option.tooltip.color;
            // div.style.fontSize = '14px';
            // div.style.position = 'absolute';
            // div.style.backgroundColor = this.option.tooltip.backgroundColor;
            // div.style.borderRadius = '2px';
            this._setLabelStyle(div, this.option.tooltip);
            //div元素包装为CSS2模型对象CSS2DObject
            var label = new CSS2DObject(div);
            div.style.pointerEvents = 'none';//避免HTML标签遮挡三维场景的鼠标事件
            // 设置HTML元素标签在three.js世界坐标中位置
            // label.position.set(x, y, z);
            return label;//返回CSS2模型标签
        },
        addEvent() {
            var choosePointMesh = e => {
                this.mouseoverearth = false;
                if ($(e.target).parents('.xnglobal-container').get(0) && $(e.target).parents('.xnglobal-container').get(0).getAttribute('data-id') == this.id) {
                    this.mouseoverearth = true;
                    if (this.chooseMesh) {
                        if (this.chooseMesh.meshType == 'area') {
                            this.chooseMesh.material.color.set(this.chooseMesh.color)
                        }
                        this.tooltip.element.style.visibility = 'hidden';
                        // this.chooseMesh.material.color.set('#ffffff')
                    }
                    var Sx = event.clientX - this.dom.getBoundingClientRect().left; //鼠标单击位置横坐标
                    var Sy = event.clientY - this.dom.getBoundingClientRect().top; //鼠标单击位置纵坐标
                    //屏幕坐标转WebGL标准设备坐标
                    var x = (Sx / this.dom.getBoundingClientRect().width) * 2 - 1; //WebGL标准设备横坐标
                    var y = -(Sy / this.dom.getBoundingClientRect().height) * 2 + 1; //WebGL标准设备纵坐标
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
                    if (intersects.length > 0 && this.option.tooltip.show) {
                        this.chooseMesh = intersects[0].object;
                        this.tooltip.position.copy(intersects[0].point);
                        // console.log(intersects[0].point)
                        this.tooltip.element.innerHTML = this.chooseMesh.name;
                        this.tooltip.element.style.visibility = 'visible';
                        if (this.chooseMesh.meshType == 'area') {
                            // console.log(this.chooseMesh)
                            this.chooseMesh.material.color.set(this.option.baseGlobal.hoverColor)
                        }
                        if (this.chooseMesh.meshType == 'flyline' && this.chooseMesh.origindata) {
                            var content = (this.calcTextTooltip(this.option.tooltip.content, this.chooseMesh.origindata))
                            this.tooltip.element.innerHTML = content;







                        }
                        // if (this.chooseMesh.meshType != 'area' && this.chooseMesh.meshType != 'fly') {
                        //     this.tooltip.element.innerHTML = '';
                        // }

                    } else {
                        this.chooseMesh = null;
                    }
                }
            }
            var clickPointMesh = e => {
                choosePointMesh(e)
                if (this.chooseMesh) {
                    // this.chooseMesh.material.color.set('#ffaa00')
                }
            }
            addEventListener('mousemove', choosePointMesh)
            addEventListener('click', clickPointMesh)
            this.choosePointMesh = choosePointMesh;
            this.clickPointMesh = clickPointMesh;
            // this.addResizeEvent();
        },
        calcTextTooltip: function (content, v) {
            var that = this;
            var html = document.createElement('div')
            html.innerHTML = content;
            html.querySelectorAll(".bi-label-field").forEach(function (el) {
                var field = el.getAttribute("data-key");
                if (el && el.children) {
                    while (el && el.children.length >= 1) {
                        el = el.children[0]
                    }
                }
                if (v[field] != undefined) {
                    el.innerHTML = (v[field]);
                } else {
                    el.innerHTML = ''
                }
            })
            return html.innerHTML;
        },
        addResizeEvent() {
            addEventListener('resize', e => {
                this.resize(600, 400)
            })
        },
        resize(width, height) {
            this.renderer.setSize(width, height);
            var k = width / height;
            var s = 180;
            this.camera.left = -s * k;
            this.camera.right = s * k;
            // 更新相机投影矩阵
            this.camera.updateProjectionMatrix();
        },
        on: function (type, func, refresh) {
            if (!this.eventList[type]) {
                this.eventList[type] = {
                    listener: [func]
                }
            } else {
                if (refresh) {
                    this.eventList[type].listener = [func]
                } else {
                    this.eventList[type].listener.push(func)
                }
            }
        },
        trigger: function (type) {
            if (!this.eventList[type]) {
                return;
            }
            for (let i = 0; i < this.eventList[type].listener.length; i++) {
                let listener = this.eventList[type].listener[i];
                if (typeof listener == 'function') {
                    listener(arguments[1], this.dom)
                }
            }
        },
        destory() {
            this.scene = null;
            this.camera = null;
            this.controls = null;
            this.id = null;
            cancelAnimationFrame(this.animationId)
            this.animationId = null;
            console.log('怎么回事啊', this.id, this.animationId)
            removeEventListener('mousemove', this.choosePointMesh)
            removeEventListener('click', this.clickPointMesh)
        }
    }
    window.XNWebglGlobal = XNWebglGlobal;
})(window, XNQuery, staticpath)
var staticpath = document.currentScript.src;
var staticpath = staticpath.substr(0, staticpath.lastIndexOf('/'));
