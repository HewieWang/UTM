// ==UserScript==
// @name         UTM
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  UTM数据抓取
// @author       Hewiefsociety
// @match        https://analytics.google.com/analytics/web/*
// @match        https://business.facebook.com/adsmanager/manage/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...
    function parseBetween(beginString, endString, originalString) {
    var beginIndex = originalString.indexOf(beginString);
    if (beginIndex === -1) {
        return null;
    }
    var beginStringLength = beginString.length;
    var substringBeginIndex = beginIndex + beginStringLength;
    var substringEndIndex = originalString.indexOf(endString, substringBeginIndex);
    if (substringEndIndex === -1) {
        return null;
    }
    return originalString.substring(substringBeginIndex, substringEndIndex);
}
    function doit(title,message,timeout) {
  GM_notification({
    title: title,
    text: message,
    timeout: timeout,
    //ondone: ()=>{alert('来自 ondone 事件')}
  })
}
    window.onload = function(){
       var url=window.location.host
       if(url.indexOf("google")!=-1){
          console.log("GoogleUTM")
          var arr1 = new Array();
          var arr2 = new Array();
          var arr3 = new Array();
          var timer1=setInterval(function(){
              try{
                var iframe_src=document.getElementById("galaxyIframe").getAttribute("src");
                console.log(iframe_src);
                var x=document.getElementById("galaxyIframe");
                var y=(x.contentWindow || x.contentDocument);
                if (y.document)y=y.document;
                var count=iframe_src.match(/rowCount%3D(\S*)\//);
                console.log(count[1])
                console.log(y.body.querySelector(".ID-start").textContent+"-"+y.body.querySelector(".ID-end").textContent)
                var ids = y.body.querySelectorAll('._GAwr');
                  [].forEach.call(ids, function(id) {
                      arr1.push(id.querySelector("td span").innerHTML)
                  });
                var transactions = y.body.querySelectorAll('.ID-metric-data-6');
                  [].forEach.call(transactions, function(trans) {
                      arr2.push(trans.querySelector("td div").innerHTML)
                  });
                  var transactions2 = y.body.querySelectorAll('.ID-metric-data-7');
                  [].forEach.call(transactions2, function(trans) {
                      arr3.push(parseInt(trans.querySelector("td div").innerHTML))
                  });
                  var res=arr1.map((item, idx) => [item, arr2[idx]]);
                  var res2=res.map((item, idx) => [item, arr3[idx]])
                  //console.log(JSON.stringify(res2))
                  GM_setValue("google_utm",JSON.stringify(res2));
                  if(/.*[\u4e00-\u9fa5]+.*$/.test(y.body.querySelector(".ID-start").textContent)) {
                    var ga_start=y.body.querySelector(".ID-start").textContent.replace("年","-").replace("月","-").replace("日","")
                    var ga_end=y.body.querySelector(".ID-end").textContent.replace("年","-").replace("月","-").replace("日","")
                  }else{
                     ga_start=new Date(y.body.querySelector(".ID-start").textContent).getTime();
                     ga_end=new Date(y.body.querySelector(".ID-end").textContent).getTime();
                  }
                  GM_setValue("ga_start",ga_start);
                  GM_setValue("ga_end",ga_end);
                  //doit("GA",y.body.querySelector(".ID-start").textContent+"-"+y.body.querySelector(".ID-end").textContent,3000);
                //clearInterval(timer1);
              }catch(err){
                 console.log("Iframe Not found")
              }
          }, 5000);
    }
    if(url.indexOf("facebook")!=-1){
       console.log("FB_UTM")
       if(document.getElementsByClassName("_1uz0")[0].textContent.split(":")[1]!=undefined){
         var fb_time=document.getElementsByClassName("_1uz0")[0].textContent.split(":")[1];
       }else{
         fb_time=document.getElementsByClassName("_1uz0")[0].textContent;
       }
        console.log(fb_time)
        fb_time=fb_time.replace("Note","")
        //console.log(fb_time.substr(0, fb_time.indexOf('–')))
        //console.log(fb_time.substring(fb_time.indexOf('–') + 1))
       var fb_start=Date.parse(fb_time.substr(0, fb_time.indexOf('–')).replace(/^\s+|\s+$/g,""));
       var fb_end=Date.parse(fb_time.substring(fb_time.indexOf('–') + 1).replace(/^\s+|\s+$/g,""));
       //console.log("GA_time:"+GM_getValue("ga_time"))
        console.log("FB_time:"+fb_start+"-"+fb_end)
       if((GM_getValue("ga_start")!=fb_start)||(GM_getValue("ga_end")!=fb_end)){
         var gg=new Date(GM_getValue("ga_start")).getFullYear() + '-' + new Date(GM_getValue("ga_start")).getMonth() + '-' + new Date(GM_getValue("ga_start")).getDate()
         var ee=new Date(GM_getValue("ga_end")).getFullYear() + '-' + new Date(GM_getValue("ga_end")).getMonth() + '-' + new Date(GM_getValue("ga_end")).getDate()
         doit("注意","GA选择时间和FB不符合!请选择正确日期!GA时间是:\n"+gg+"-"+ee);
       }
       console.log(fb_start+"-"+fb_end)
       try {
         var timer2=setInterval(function(){
           var list = document.getElementsByClassName("_1b33 _4ik4 _4ik5");
           for (var i = 0; i < list.length; i++) {
              if(GM_getValue("google_utm").indexOf(list[i].innerText)!=-1){
                  var s=parseBetween(list[i].innerText,"]",GM_getValue("google_utm"))
                  var node=document.getElementById("globalContainer")
                  let nodeIterator = document.createNodeIterator(
                   node,
                   NodeFilter.SHOW_ELEMENT,
                   (node) => {
                   return (node.textContent.includes('广告花费回报 (ROAS) - 购物')
                    || node.textContent.includes('Purchase ROAS (Return on Ad Spend)'))
                    && node.nodeName.toLowerCase() !== 'script' // not interested in the script
                   && node.children.length === 0 // this is the last node
                   ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                  }
             );
                let pars = [];
                let currentNode;
                while (currentNode = nodeIterator.nextNode()){
                    pars.push(currentNode);
                }
                //获取parent dom
                  var menudom=pars[0];
                  for (var m = 0; m < 11; m++) {
                   menudom=menudom.parentNode
                  }
                  //转化率
                  var index = Array.prototype.indexOf.call(menudom.parentNode.children, menudom);
                  console.log(index)
                  console.log(list[i].parentNode.parentNode.children[index])
                  list[i].parentNode.parentNode.children[index].querySelector("span").innerHTML+="<br><div style='color:red'>"+s.match(/[-]{0,1}[\d]*[.]{0,1}[\d]+/g)+"%</div>"
                  //网站购物
                  var gw1=list[i].innerText+parseBetween(list[i].innerText,"]",GM_getValue("google_utm"))+"],";
                  var s2=parseBetween(gw1,"]",GM_getValue("google_utm"));
                  if(s2=="0"){s2=""};
                  console.log(s2)
                   let nodeIterator2 = document.createNodeIterator(
                   node,
                   NodeFilter.SHOW_ELEMENT,
                   (node) => {
                   return (node.textContent.includes('网站购物')
                    || node.textContent.includes('Website Purchases'))
                    && node.nodeName.toLowerCase() !== 'script' // not interested in the script
                   && node.children.length === 0 // this is the last node
                   ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                  }
             );
                let pars2 = [];
                let currentNode2;
                while (currentNode2 = nodeIterator2.nextNode()){
                    pars2.push(currentNode2);
                }
                //获取parent dom
                  var menudom2=pars2[0];
                  for (var m2 = 0; m2 < 11; m2++) {
                   menudom2=menudom2.parentNode
                  }
                  var index2 = Array.prototype.indexOf.call(menudom2.parentNode.children, menudom2);
                  console.log(index2)
                  console.log(list[i].parentNode.parentNode.children[index2])
                  list[i].parentNode.parentNode.children[index2].querySelector("span").innerHTML+="<br><div style='color:red'>"+s2+"</div>"
               }
           }
       },3000);
       } catch (error) {
         console.error(error);
         GM_notification("未找到元素，请把Purchase ROAS (Return on Ad Spend)和Website Purchases移到前排", "注意");
       }
    }
    }
})();
