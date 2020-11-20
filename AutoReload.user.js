// ==UserScript==
// @name         Auto Reload
// @name:zh-CN   自动刷新
// @namespace    http://tampermonkey.net/
// @description  网页定时自动刷新
// @description:zh-CN  网页定时自动刷新
// @author       XVCoder
// @license      GPL-3.0-only
// @create       2020-11-20
// @lastmodified 2020-11-20
// @version      0.7
// @match        http*://*/*
// @icon         https://xnu132.win/assets/img/favicon.png
// @require      https://cdn.staticfile.org/vue/2.6.11/vue.js
// @require      https://cdn.jsdelivr.net/npm/vue@2.6.12/dist/vue.js
// @note         2020-11-20 v0.7 修改 信息完善，脚本源迁移到GitHub
// @note         2020-11-20 v0.6 修改 默认匹配所有网页，修改match以指定需要自动刷新的网页
// @note         2020-11-20 v0.5 新增 实现基本功能
// @home-url     https://greasyfork.org/zh-CN/scripts/416449-auto-reload
// @home-url2    https://github.com/XVCoder/UserScripts/AutoReload
// @homepageURL  https://greasyfork.org/zh-CN/scripts/416449-auto-reload
// @grant        GM_getValue
// @grant        GM.getValue
// @grant        GM_setValue
// @grant        GM.setValue
// ==/UserScript==

!function () {
    let isdebug = true;//是否为调试模式
    let isLocalDebug = isdebug || false;
    //调试模式时，使用「debug("message");」输出到Console中
    let debug = isdebug ? console.log.bind(console) : function () {
    };
    if (typeof (GM) === "undefined") {
        // 这个是ViolentMonkey的支持选项
        GM = {};
        GM.setValue = GM_setValue;
        GM.getValue = GM_getValue;
    }
    //默认配置
    let DefaultConfig = { countDown:1 };
    //可重载的配置文件
    let DBConfig = {};
    debug("============ Auto Load Start============");
    (function () {
        let needDisplayNewFun = true; // 本次更新是否有新功能需要展示
        if (window.NodeList && !NodeList.prototype.forEach) {
            NodeList.prototype.forEach = function (callback, thisArg) {
                thisArg = thisArg || window;
                for (var i = 0; i < this.length; i++) {
                    callback.call(thisArg, this[i], i, this);
                }
            };
        }
        /**初始化所有的设置**/
        Promise.all([GM.getValue("Config")]).then(function (data) {
            if (data[0] != null) {
                DBConfig = JSON.parse(data[0]);
            }else{
                DBConfig = DefaultConfig;
            }
            callback();
        }).catch(function (except) {
            console.log(except);
        });
        function callback(){
            //=============================================== 固定配置项  ↓↓↓↓↓
            //选项被选中时的标志
            let optSelectedMark = "✔";//✔
            //页面重新加载倒计时（秒）
            let seconds = DBConfig.countDown * 60;
            //重载提示
            let reloadHint = "reload after: ";//
            //播放符号
            let playMark = "▶";
            //暂停符号
            let pauseMark = "❙❙";
            //显示符号
            let visibleMark = "❮";//⍇⇱❮
            //隐藏符号
            let unvisibleMark = "❯";//⍈⇲❯
            //设置符号
            let settingMark = "⚙";//🕓⏱🛠⚙
            //用户脚本加载等待时间
            let loadTime = 200;
            //倒计时选项（时长：min）
            let opts = {
                opt1: 5,
                opt2: 4,
                opt3: 3,
                opt4: 2,
                opt5: 1
            }
            //倒计时选项显示内容
            let optsDisplay = {
                opt1: opts.opt1 + "min ",
                opt2: opts.opt2 + "min ",
                opt3: opts.opt3 + "min ",
                opt4: opts.opt4 + "min ",
                opt5: opts.opt5 + "min ",
            };
            //=============================================== 固定配置项  ↑↑↑↑↑
            //计时器
            let timer = null;
            //显示当前倒计时选项的配置
            switch(DBConfig.selectedOption) {
                case 1: {
                    //option1
                    optsDisplay.opt1 += optSelectedMark;
                    break;
                }
                case 2: {
                    //option2
                    optsDisplay.opt2 += optSelectedMark;
                    break;
                }
                case 3: {
                    //option3
                    optsDisplay.opt3 += optSelectedMark;
                    break;
                }
                case 4: {
                    //option4
                    optsDisplay.opt4 += optSelectedMark;
                    break;
                }
                case 5: {
                    //option5
                    optsDisplay.opt5 += optSelectedMark;
                    break;
                }
                default:
                    break;
            }

            setTimeout(function () {
                //===============================================================附加样式表=======================================================================
                var style = document.createElement("style");
                style.innerHTML =
                    ''
                    + '.leftTime {color:#00000077;font-size:12px;position:absolute;bottom:0px;right:25px;}'
                    + '.pauseBtn {position:absolute;bottom:0px;right:130px;background:linear-gradient(to bottom, #ffffff 5%, #f6f6f6 100%);background-color:#ffffff;display:inline-block;cursor:pointer;color:#666666;font-family:Arial;font-size:8px;font-weight:bold;padding:0px 1px;text-decoration:none;}'
                    + '.dropdown {position:absolute;bottom:0px;right:150px;background:linear-gradient(to bottom, #ffffff 5%, #f6f6f6 100%);background-color:#ffffff;display:inline-block;}'
                    + '.settingBtn {cursor:pointer;color:#666666;line-height:17px;font-family:Arial;font-size:14px;font-weight:bold;text-decoration:none;cursor:pointer;}'
                    + '.dropdown-content {display:none;position:absolute;border-radius:5px;background-color:#f9f9f9;box-shadow:0px 8px 16px 0px rgba(0,0,0,0.2);}'
                    + '.dropdown-content div {-moz-user-select:none;-webkit-user-select:none;user-select:none;width:45px;padding:2px 10px 2px 14px;border-radius:5px;font-family:Arial;font-size:10px;corlor:00000077;text-decoration:none;display:block;cursor:arror;}'
                    + '.dropdown-content div:hover {background-color:#B1B1B1;color:white}'
                    + '.dropdown:hover .dropdown-content {display:block;bottom:15px}'
                    + '.dropdown:hover .settingBtn {color:orange;}'
                    + '.hiddenBtn {position:absolute;bottom:0px;right:170px;background:linear-gradient(to bottom, #ffffff 5%, #f6f6f6 100%);background-color:#ffffff;display:inline-block;cursor:pointer;color:#666666;font-family:Arial;font-size:8px;padding:0px 1px;text-decoration:none;}'
                    + ''
                ;
                document.getElementsByTagName('HEAD').item(0).appendChild(style);

                //================================================================附加元素========================================================================
                //倒计时标签
                let leftTimeDiv = document.createElement("div");
                leftTimeDiv.setAttribute("id", "leftTime");
                leftTimeDiv.className = "leftTime";
                leftTimeDiv.innerHTML = reloadHint+Math.floor(seconds/60).toString().padStart(2,'0')+":"+(seconds%60).toString().padStart(2,'0');
                document.body.appendChild(leftTimeDiv);
                //[暂停/继续]按钮
                let pauseBtn = document.createElement("div");
                pauseBtn.setAttribute("id", "pauseBtn");
                pauseBtn.className = "pauseBtn";
                pauseBtn.innerHTML = pauseMark;
                document.body.appendChild(pauseBtn);
                //下拉菜单区域
                let dropdownDiv = document.createElement("div");
                dropdownDiv.setAttribute("id", "dropdown");
                dropdownDiv.className = "dropdown";
                document.body.appendChild(dropdownDiv);
                //下拉菜单主体
                let dropdownContentDiv = document.createElement("div");
                dropdownContentDiv.setAttribute("id", "dropdown-content");
                dropdownContentDiv.className = "dropdown-content";
                dropdownContentDiv.innerHTML =
                    ""
                    + "<div id='opt1'>" + optsDisplay.opt1 + "</div>"
                    + "<div id='opt2'>" + optsDisplay.opt2 + "</div>"
                    + "<div id='opt3'>" + optsDisplay.opt3 + "</div>"
                    + "<div id='opt4'>" + optsDisplay.opt4 + "</div>"
                    + "<div id='opt5'>" + optsDisplay.opt5 + "</div>"
                    + "";
                dropdownContentDiv.style.visibility = "hidden";
                dropdownDiv.appendChild(dropdownContentDiv);
                //设置按钮
                let settingBtn = document.createElement("div");
                settingBtn.setAttribute("id", "settingBtn");
                settingBtn.className = "settingBtn";
                settingBtn.style.visibility = "hidden";
                settingBtn.innerHTML = settingMark;
                dropdownDiv.appendChild(settingBtn);
                //显示/隐藏按钮
                let hiddenBtn = document.createElement("div")
                hiddenBtn.setAttribute("id", "hiddenBtn");
                hiddenBtn.className = "hiddenBtn";
                hiddenBtn.style.visibility = "hidden";
                hiddenBtn.innerHTML = unvisibleMark;
                document.body.appendChild(hiddenBtn);

                //================================================================事件========================================================================
                //倒计时刷新
                timer = setInterval(function(){
                    if(seconds<0){
                        //倒计时结束，重载页面
                        location.reload();
                    }else{
                        document.getElementById("leftTime").innerHTML=reloadHint+Math.floor(seconds/60).toString().padStart(2,'0')+":"+(seconds%60).toString().padStart(2,'0');
                        seconds--;
                    }
                },1000);

                //显示隐藏按钮点击事件
                document.getElementById("hiddenBtn").addEventListener("click", (function(){
                    if(hiddenBtn.innerHTML == unvisibleMark)
                    {//隐藏倒计时
                        hiddenBtn.innerHTML = visibleMark;
                        hiddenBtn.style.right = "20px";
                        pauseBtn.style.visibility = "hidden";
                        leftTimeDiv.style.visibility = "hidden";
                        settingBtn.style.visibility = "hidden";
                        dropdownContentDiv.style.visibility = "hidden";
                    }
                    else
                    {//显示倒计时
                        hiddenBtn.innerHTML = unvisibleMark;
                        hiddenBtn.style.right = "170px";
                        pauseBtn.style.visibility = "visible";
                        leftTimeDiv.style.visibility = "visible";
                        settingBtn.style.visibility = "visible";
                        dropdownContentDiv.style.visibility = "visible";
                    }
                }));

                //设置按钮点击事件
                document.getElementById("settingBtn").addEventListener("click", (function(){
                    //切换倒计时的时长
                }));

                //[暂停/继续]按钮点击事件
                document.getElementById("pauseBtn").addEventListener("click", (function(){
                    if(pauseBtn.innerHTML == pauseMark)
                    {//暂停倒计时
                        pauseBtn.innerHTML = playMark;
                        pauseBtn.style.color = "salmon";
                        hiddenBtn.innerHTML = unvisibleMark;
                        hiddenBtn.style.visibility = "visible";
                        settingBtn.style.visibility = "visible";
                        dropdownContentDiv.style.visibility = "visible";
                        clearInterval(timer);
                    }
                    else
                    {//继续倒计时
                        pauseBtn.innerHTML = pauseMark;
                        pauseBtn.style.color = "#666666";
                        hiddenBtn.innerHTML = visibleMark;
                        hiddenBtn.style.visibility = "hidden";
                        settingBtn.style.visibility = "hidden";
                        dropdownContentDiv.style.visibility = "hidden";
                        timer = setInterval(function(){
                            if(seconds < 0){
                                //倒计时结束，重载页面
                                location.reload();
                            }else{
                                document.getElementById("leftTime").innerHTML=reloadHint+Math.floor(seconds/60).toString().padStart(2,'0')+":"+(seconds%60).toString().padStart(2,'0');
                                seconds--;
                            }
                        },1000);
                    }
                }));
                //选项1
                document.getElementById("opt1").addEventListener("click", (function(e){
                    DBConfig.selectedOption = 1;
                    //设置倒计时长5分钟
                    setCountDown(e,1,5);
                }));
                //选项2
                document.getElementById("opt2").addEventListener("click", (function(e){
                    DBConfig.selectedOption = 2;
                    //设置倒计时长4分钟
                    setCountDown(e,2,4);
                }));
                //选项3
                document.getElementById("opt3").addEventListener("click", (function(e){
                    DBConfig.selectedOption = 3;
                    //设置倒计时长3分钟
                    setCountDown(e,3,3);
                }));
                //选项4
                document.getElementById("opt4").addEventListener("click", (function(e){
                    DBConfig.selectedOption = 4;
                    //设置倒计时长2分钟
                    setCountDown(e,4,2);
                }));
                //选项5
                document.getElementById("opt5").addEventListener("click", (function(e){
                    DBConfig.selectedOption = 5;
                    //设置倒计时长1分钟
                    setCountDown(e,5,1);
                }));
                //设置倒计时
                //@newCountDown 倒计时分钟数
                function setCountDown(e,opt, newCountDown){
                    //更新选中项
                    for(var key in optsDisplay){
                        document.getElementById(key).innerHTML=optsDisplay[key]=optsDisplay[key].replace(optSelectedMark,"");
                    }
                    e.path[0].innerHTML=(optsDisplay["opt"+opt] += optSelectedMark);
                    debug("======================= change countdown =======================")
                    debug(e.path[0].innerHTML)
                    //更新倒计时
                    seconds = newCountDown * 60;
                    document.getElementById("leftTime").innerHTML=reloadHint+Math.floor(seconds/60).toString().padStart(2,'0')+":"+(seconds%60).toString().padStart(2,'0');
                    DBConfig.countDown = newCountDown;
                    GM_setValue("Config", JSON.stringify(DBConfig));
                }
            }, 100);
        }
    })();
}();
