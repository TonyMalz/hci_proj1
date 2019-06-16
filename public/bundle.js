var app=function(){"use strict";function t(){}const e=t=>t;function n(t){return t()}function a(){return Object.create(null)}function r(t){t.forEach(n)}function i(t){return"function"==typeof t}function o(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}const c="undefined"!=typeof window;let s=c?()=>window.performance.now():()=>Date.now(),l=c?requestAnimationFrame:t;const u=new Set;let d,m=!1;function f(){u.forEach(t=>{t[0](s())||(u.delete(t),t[1]())}),(m=u.size>0)&&l(f)}function g(t){let e;return m||(m=!0,l(f)),{promise:new Promise(n=>{u.add(e=[t,n])}),abort(){u.delete(e)}}}function p(t,e){t.appendChild(e)}function h(t,e,n){t.insertBefore(e,n||null)}function v(t){t.parentNode.removeChild(t)}function y(t){return document.createElement(t)}function $(t){return document.createTextNode(t)}function x(){return $(" ")}function b(){return $("")}function w(t,e,n,a){return t.addEventListener(e,n,a),()=>t.removeEventListener(e,n,a)}function T(t,e,n){null==n?t.removeAttribute(e):t.setAttribute(e,n)}function k(t,e,n){t.style.setProperty(e,n)}function C(t,e){const n=document.createEvent("CustomEvent");return n.initCustomEvent(t,!1,!1,e),n}let I,_=0,L={};function N(t,e){t.style.animation=(t.style.animation||"").split(", ").filter(e?t=>t.indexOf(e)<0:t=>-1===t.indexOf("__svelte")).join(", "),e&&!--_&&l(()=>{if(_)return;let t=d.cssRules.length;for(;t--;)d.deleteRule(t);L={}})}function z(t){I=t}function S(t){(function(){if(!I)throw new Error("Function called outside component initialization");return I})().$$.on_mount.push(t)}const A=[],E=Promise.resolve();let M=!1;const B=[],O=[],G=[];function j(t){O.push(t)}function D(){const t=new Set;do{for(;A.length;){const t=A.shift();z(t),H(t.$$)}for(;B.length;)B.shift()();for(;O.length;){const e=O.pop();t.has(e)||(e(),t.add(e))}}while(A.length);for(;G.length;)G.pop()();M=!1}function H(t){t.fragment&&(t.update(t.dirty),r(t.before_render),t.fragment.p(t.dirty,t.ctx),t.dirty=null,t.after_render.forEach(j))}let P,R;function F(t,e,n){t.dispatchEvent(C(`${e?"intro":"outro"}${n}`))}function V(){R={remaining:0,callbacks:[]}}function W(){R.remaining||r(R.callbacks)}function q(t){R.callbacks.push(t)}function Z(n,a,r){let o,c,l=a(n,r),u=!1,m=0;function f(){o&&N(n,o)}function p(){const{delay:a=0,duration:r=300,easing:i=e,tick:p=t,css:h}=l;h&&(o=function(t,e,n,a,r,i,o,c=0){const s=16.666/a;let l="{\n";for(let t=0;t<=1;t+=s){const a=e+(n-e)*i(t);l+=100*t+`%{${o(a,1-a)}}\n`}const u=l+`100% {${o(n,1-n)}}\n}`,m=`__svelte_${function(t){let e=5381,n=t.length;for(;n--;)e=(e<<5)-e^t.charCodeAt(n);return e>>>0}(u)}_${c}`;if(!L[m]){if(!d){const t=y("style");document.head.appendChild(t),d=t.sheet}L[m]=!0,d.insertRule(`@keyframes ${m} ${u}`,d.cssRules.length)}const f=t.style.animation||"";return t.style.animation=`${f?`${f}, `:""}${m} ${a}ms linear ${r}ms 1 both`,_+=1,m}(n,0,1,r,a,i,h,m++)),p(0,1);const v=s()+a,$=v+r;c&&c.abort(),u=!0,j(()=>F(n,!0,"start")),c=g(t=>{if(u){if(t>=$)return p(1,0),F(n,!0,"end"),f(),u=!1;if(t>=v){const e=i((t-v)/r);p(e,1-e)}}return u})}let h=!1;return{start(){h||(N(n),i(l)?(l=l(),(P||(P=Promise.resolve()).then(()=>{P=null}),P).then(p)):p())},invalidate(){h=!1},end(){u&&(f(),u=!1)}}}function U(t,e,a){const{fragment:o,on_mount:c,on_destroy:s,after_render:l}=t.$$;o.m(e,a),j(()=>{const e=c.map(n).filter(i);s?s.push(...e):r(e),t.$$.on_mount=[]}),l.forEach(j)}function J(t,e){t.$$.dirty||(A.push(t),M||(M=!0,E.then(D)),t.$$.dirty=a()),t.$$.dirty[e]=!0}function K(e,n,i,o,c,s){const l=I;z(e);const u=n.props||{},d=e.$$={fragment:null,ctx:null,props:s,update:t,not_equal:c,bound:a(),on_mount:[],on_destroy:[],before_render:[],after_render:[],context:new Map(l?l.$$.context:[]),callbacks:a(),dirty:null};let m=!1;var f;d.ctx=i?i(e,u,(t,n)=>{d.ctx&&c(d.ctx[t],d.ctx[t]=n)&&(d.bound[t]&&d.bound[t](n),m&&J(e,t))}):u,d.update(),m=!0,r(d.before_render),d.fragment=o(d.ctx),n.target&&(n.hydrate?d.fragment.l((f=n.target,Array.from(f.childNodes))):d.fragment.c(),n.intro&&e.$$.fragment.i&&e.$$.fragment.i(),U(e,n.target,n.anchor),D()),z(l)}class Q{$destroy(){var e,n;n=!0,(e=this).$$&&(r(e.$$.on_destroy),e.$$.fragment.d(n),e.$$.on_destroy=e.$$.fragment=null,e.$$.ctx={}),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(){}}function X(t){var e,n,a;return{c(){e=y("div"),n=$(t.title),e.className="svelte-1av4as1",a=w(e,"click",t.toggleEdit)},m(t,a){h(t,e,a),p(e,n)},p(t,e){var a,r;t.title&&(a=n,r=""+(r=e.title),a.data!==r&&(a.data=r))},d(t){t&&v(e),a()}}}function Y(t){var e,n;return{c(){T(e=y("input"),"type","text"),e.autofocus=!0,n=[w(e,"input",t.input_input_handler),w(e,"blur",t.update)]},m(n,a){h(n,e,a),e.value=t.title,e.focus()},p(t,n){t.title&&e.value!==n.title&&(e.value=n.title)},d(t){t&&v(e),r(n)}}}function tt(e){var n;function a(t){return t.toggle?Y:X}var r=a(e),i=r(e);return{c(){i.c(),n=b()},m(t,e){i.m(t,e),h(t,n,e)},p(t,e){r===(r=a(e))&&i?i.p(t,e):(i.d(1),(i=r(e))&&(i.c(),i.m(n.parentNode,n)))},i:t,o:t,d(t){i.d(t),t&&v(n)}}}function et(t,e,n){let{title:a=""}=e,r=!1;function i(){n("toggle",r=!r)}const o=function(){const t=I;return(e,n)=>{const a=t.$$.callbacks[e];if(a){const r=C(e,n);a.slice().forEach(e=>{e.call(t,r)})}}}();return t.$set=(t=>{"title"in t&&n("title",a=t.title)}),{title:a,toggle:r,toggleEdit:i,update:function(){console.log("blur"),i(),o("notify",a)},input_input_handler:function(){a=this.value,n("title",a)}}}class nt extends Q{constructor(t){super(),K(this,t,et,tt,o,["title"])}}function at(t,{delay:e=0,duration:n=400}){const a=+getComputedStyle(t).opacity;return{delay:e,duration:n,css:t=>`opacity: ${t*a}`}}function rt(t,e,n){const a=Object.create(t);return a.title=e[n],a.i=n,a}function it(t){var e,n,a=new nt({props:{title:t.title}});return a.$on("notify",t.titleChanged),{c(){e=y("li"),a.$$.fragment.c(),e.className="active svelte-tibrtl"},m(t,r){h(t,e,r),U(a,e,null),n=!0},p(t,e){var n={};t.currentTabs&&(n.title=e.title),a.$set(n)},i(t){n||(a.$$.fragment.i(t),n=!0)},o(t){a.$$.fragment.o(t),n=!1},d(t){t&&v(e),a.$destroy()}}}function ot(t){var e,n,a,r=new nt({props:{title:t.title}});function i(){return t.click_handler(t)}return{c(){e=y("li"),r.$$.fragment.c(),e.className="svelte-tibrtl",a=w(e,"click",i)},m(t,a){h(t,e,a),U(r,e,null),n=!0},p(e,n){t=n;var a={};e.currentTabs&&(a.title=t.title),r.$set(a)},i(t){n||(r.$$.fragment.i(t),n=!0)},o(t){r.$$.fragment.o(t),n=!1},d(t){t&&v(e),r.$destroy(),a()}}}function ct(t){var e,n,a,r,i=[ot,it],o=[];function c(t){return t.i!==t.activeTab?0:1}return e=c(t),n=o[e]=i[e](t),{c(){n.c(),a=b()},m(t,n){o[e].m(t,n),h(t,a,n),r=!0},p(t,r){var s=e;(e=c(r))===s?o[e].p(t,r):(V(),q(()=>{o[s].d(1),o[s]=null}),n.o(1),W(),(n=o[e])||(n=o[e]=i[e](r)).c(),n.i(1),n.m(a.parentNode,a))},i(t){r||(n&&n.i(),r=!0)},o(t){n&&n.o(),r=!1},d(t){o[e].d(t),t&&v(a)}}}function st(e){var n,a;return{c(){(n=y("div")).textContent="+",n.className="svelte-tibrtl",a=w(n,"click",e.toggle)},m(t,e){h(t,n,e)},p:t,i:t,o:t,d(t){t&&v(n),a()}}}function lt(e){var n,a,i;return{c(){(n=y("input")).id="newTab",T(n,"type","text"),n.autofocus=!0,i=[w(n,"blur",e.addTab),w(n,"keydown",e.keydown_handler)]},m(t,e){h(t,n,e),n.focus()},p:t,i(t){a||j(()=>{(a=Z(n,at,{duration:100})).start()})},o:t,d(t){t&&v(n),r(i)}}}function ut(t){for(var e,n,a,r,i=t.currentTabs,o=[],c=0;c<i.length;c+=1)o[c]=ct(rt(t,i,c));function s(t,e,n){o[t]&&(e&&q(()=>{o[t].d(e),o[t]=null}),o[t].o(n))}function l(t){return t.toggleTab?lt:st}var u=l(t),d=u(t);return{c(){e=y("ul");for(var t=0;t<o.length;t+=1)o[t].c();n=x(),a=y("li"),d.c(),a.className="svelte-tibrtl",e.className="svelte-tibrtl"},m(t,i){h(t,e,i);for(var c=0;c<o.length;c+=1)o[c].m(e,null);p(e,n),p(e,a),d.m(a,null),r=!0},p(t,r){if(t.activeTab||t.currentTabs||t.titleChanged){i=r.currentTabs;for(var c=0;c<i.length;c+=1){const a=rt(r,i,c);o[c]?(o[c].p(t,a),o[c].i(1)):(o[c]=ct(a),o[c].c(),o[c].i(1),o[c].m(e,n))}for(V();c<o.length;c+=1)s(c,1,1);W()}u===(u=l(r))&&d?d.p(t,r):(d.d(1),(d=u(r))&&(d.c(),d.i(1),d.m(a,null)))},i(t){if(!r){for(var e=0;e<i.length;e+=1)o[e].i();d&&d.i(),r=!0}},o(t){o=o.filter(Boolean);for(let t=0;t<o.length;t+=1)s(t,0,0);r=!1},d(t){t&&v(e),function(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}(o,t),d.d()}}}function dt(t,e,n){let a=["Overview","User Details"],{activeTab:r=0}=e;function i(t){console.log("activate"),n("activeTab",r=t)}let o=!1;function c(){n("toggleTab",o=!o)}function s(){const t=document.getElementById("newTab");""!==t.value.trim()&&(a.push(t.value),n("currentTabs",a),n("activeTab",r=a.length-1)),c()}return t.$set=(t=>{"activeTab"in t&&n("activeTab",r=t.activeTab)}),{currentTabs:a,activeTab:r,activate:i,toggleTab:o,toggle:c,addTab:s,titleChanged:function(t){console.log("titlechanged"),a[r]=t.detail,n("currentTabs",a)},click_handler:function({i:t}){return i(t)},keydown_handler:function(t){return"Enter"===t.code?s():null}}}class mt extends Q{constructor(t){super(),K(this,t,dt,ut,o,["activeTab"])}}function ft(e){var n,a,r,i,o,c,s,l,u,d,m,f,g,b,w,T;return{c(){n=y("div"),a=y("div"),r=$("Study name: "),i=$(gt),o=x(),c=y("div"),s=$("Total study time elapsed: "),l=$(pt),u=x(),d=y("div"),m=$("Number of active participants: "),f=$(ht),g=x(),b=y("div"),w=$("Datasets collected: "),T=$(vt),n.id="info",n.className="svelte-1m3j3d9"},m(t,e){h(t,n,e),p(n,a),p(a,r),p(a,i),p(n,o),p(n,c),p(c,s),p(c,l),p(n,u),p(n,d),p(d,m),p(d,f),p(n,g),p(n,b),p(b,w),p(b,T)},p:t,i:t,o:t,d(t){t&&v(n)}}}let gt="Test Study",pt="78%",ht=27,vt=1326;class yt extends Q{constructor(t){super(),K(this,t,null,ft,o,[])}}function $t(e){var n;return{c(){(n=y("div")).innerHTML='<svg id="undo" style="width:16px;height:16px" viewBox="0 0 24 24" class="svelte-4zoca2"><path fill="#333" d="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22\n\t\t\t      10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81\n\t\t\t      20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z"></path></svg>\n\t\t\t  <label id="undoLabel" class="svelte-4zoca2">undo</label>\n\t\t\t  <svg id="redo" style="width:16px;height:16px" viewBox="0 0 24 24" class="svelte-4zoca2"><path fill="#bbb" d="M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03\n\t\t\t      1.54,15.22L3.9,16C4.95,12.81 7.95,10.5 11.5,10.5C13.45,10.5 15.23,11.22\n\t\t\t      16.62,12.38L13,16H22V7L18.4,10.6Z"></path></svg>\n\t\t\t  <label id="redoLabel" class="svelte-4zoca2">redo</label>',n.className="svelte-4zoca2"},m(t,e){h(t,n,e)},p:t,i:t,o:t,d(t){t&&v(n)}}}class xt extends Q{constructor(t){super(),K(this,t,null,$t,o,[])}}function bt(e){var n;return{c(){(n=y("div")).id="mainChart",k(n,"width","100%"),k(n,"height","100%")},m(t,e){h(t,n,e)},p:t,i:t,o:t,d(t){t&&v(n)}}}function wt(t){return S(()=>{const t=echarts.init(document.getElementById("mainChart"));const e={legend:{data:["Average availability"],left:"center"},tooltip:{position:"top",formatter:function(t){return"Average availability is "+t.value[2]}},grid:{left:2,bottom:10,right:10,containLabel:!0},xAxis:{type:"category",boundaryGap:!1,name:"Day of week",data:["","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",""],splitLine:{show:!0,lineStyle:{color:"#999",type:"dashed"}},axisLine:{show:!0}},yAxis:{type:"category",boundaryGap:!1,name:"Time of day",data:["08:00","","09:00","","10:00","","11:00","","12:00","","13:00","","14:00","","15:00","","16:00","","17:00","","18:00","","19:00","","20:00","","21:00","","22:00","","23:00","","24:00"],axisLine:{show:!0}},series:[{name:"Average availability",type:"scatter",symbolSize:function(t){return 6*t[2]},data:[[1,1,5],[1,3,3],[1,5,2],[1,7,1],[1,9,0],[1,11,.5],[1,13,.5],[1,15,3],[1,17,5],[1,19,5.5],[1,21,5.2],[1,23,6.1],[1,25,3],[1,27,6],[1,29,1],[1,31,2],[2,1,5],[2,3,2],[2,5,2],[2,7,.5],[2,9,1],[2,11,1.5],[2,13,1.5],[2,15,3.5],[2,17,6],[2,19,4.5],[2,21,4.5],[2,23,5.5],[2,25,4],[2,27,5],[2,29,1.2],[2,31,5],[3,1,3],[3,3,1.5],[3,5,2],[3,7,1],[3,9,2],[3,11,2],[3,13,.75],[3,15,2],[3,17,4],[3,19,3.5],[3,21,4],[3,23,5.75],[3,25,5],[3,27,3],[3,29,3],[3,31,2.5],[4,1,3.5],[4,3,2],[4,5,2],[4,7,2],[4,9,.5],[4,11,1.5],[4,13,.85],[4,15,1.5],[4,17,3],[4,19,5],[4,21,3.9],[4,23,4],[4,25,3.5],[4,27,4],[4,29,2],[4,31,3],[5,1,4],[5,3,1.4],[5,5,2],[5,7,1.5],[5,9,2],[5,11,.5],[5,13,1.75],[5,15,2.85],[5,17,4.5],[5,19,5.1],[5,21,4.2],[5,23,3.5],[5,25,4],[5,27,4.5],[5,29,5],[5,31,4],[6,1,5],[6,3,1.5],[6,5,2],[6,7,1],[6,9,0],[6,11,.75],[6,13,1],[6,15,2],[6,17,5.75],[6,19,4],[6,21,4.75],[6,23,6],[6,25,4.5],[6,27,3.23],[6,29,7],[6,31,.5],[7,1,4.5],[7,3,1],[7,5,2],[7,7,0],[7,9,1],[7,11,1],[7,13,.5],[7,15,3],[7,17,3],[7,19,4.75],[7,21,2],[7,23,5.5],[7,25,3.99],[7,27,6.5],[7,29,2],[7,31,1]],animationDelay:function(t){return 5*t}}]};t.setOption(e),window.addEventListener("resize",()=>{null!==t&&t.resize()})}),{}}class Tt extends Q{constructor(t){super(),K(this,t,wt,bt,o,[])}}function kt(e){var n,a,r;return{c(){(n=y("div")).innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="36" height="36" viewBox="0 0 1200 1200"><g><g transform="translate(600 600) scale(-0.69 0.69) translate(-600 -600)"><svg fill="#333" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="-909 491 100 100" style="enable-background:new -909 491 100 100;" xml:space="preserve"><path d="M-823.5,558.3c-4.8-0.3-4.4,1.6-4.4,1.6l0.2,4.6c0,0,0,2.4-1.4,2.3s-1.8-2.8-1.8-2.8s-1.1-4.6-1.1-4.6\n\t\t\t            c0-0.1,0.1-0.3,0.1-0.4c0.1-0.3,0.1-0.7,0-1c-0.1-0.7-0.2-1.5-0.7-2.1c0,0-0.8-0.5-0.8-0.4c-0.5-3.4-2.2-6.8-5.7-7.8\n\t\t\t            c-0.2-0.1-2.5-0.5-3.6-0.7c0.1-0.3,0.3-0.6,0.4-0.9c0.3-1.2-0.4-2.3-0.8-3.3c-0.3-1-0.2-1.9,1-2c1.1-0.1,3.1,1,3.7,0.8\n\t\t\t            c0.7-0.1,1.5-0.7,1.5-1.5s-1.2-2.5-1.2-2.5s-1.6-3.2-2.1-4.6c-0.5-1.4-2.3-2.7-2.3-2.7s-1.8-1.3-1.6-2.2c0.2-0.9,0.9-1.2,1.2-2.1\n\t\t\t            c1,0.1,2.1,0.4,2.9,0.5c2.9,0.4,6.7,1.2,9,0.7c0,0,1.2-0.1,0-1c-1.2-0.9-4.1-3.7-5-4.7s-4.1-3.1-4.7-4.4c-1.9-3.9-2.4-8.6-5.6-11.9\n\t\t\t            c-2.3-2.4-5.2-4.3-8.2-5.6c1.1,0.2,2.2,0.3,3.3,0.3c0.1,0,0.3,0,0.4,0l0-0.9c-2.8,0.1-6-0.6-8.3-1.2c0.5,0,1-0.1,1.6-0.3\n\t\t\t            c1-0.3,2.9-1.1,2.5-2.5c-0.5-1.9-3.8-1.3-5.1-1.1c-2.5,0.4-4.8,1.6-7,2.8c-0.3-0.4-0.8-0.5-1.4-0.4c-0.4,0.1-0.7,0.3-0.9,0.5\n\t\t\t            c-0.4-0.2-1.7-0.7-4.9-0.7c-2,0-8.9,2.1-5.3,4.4c-1.5,0.4-3.2,0.8-4.4,0.9l0.1,0.9c0.7-0.1,1.5-0.2,2.4-0.4\n\t\t\t            c-2.5,1.5-4.7,3.4-6.6,5.6c-2,2.3-3.1,5.4-3.5,8.3c-0.5,3.6,0.5,7.2,0.3,10.8c-0.2,1.9-1.2,2.8-2.2,4.3c-1,1.5-1.4,3.2-2.4,4.7\n\t\t\t            c-0.8,1.4-2.1,2.4-3.2,3.6c-0.4,0.4-0.3,0.7,0,0.8c0.1,0,0.2,0,0.4,0c0.8-0.1,1.5-0.5,2.2-0.7c1.1-0.3,2.2-0.6,3.2-1\n\t\t\t            c0.7-0.3,3-1,5.4-1.9c0.1,0.9,0.2,1.9,0.4,2.5c0.4,1.2,2.3,3.4,2.3,3.4s1.8,1.6,1.9,3.7c0,1.1-0.3,2-0.7,2.6c-0.6-0.4-2.2-1-3.6,0.8\n\t\t\t            c-1.8,2.3-2.5,4.4-3.4,5.6c-0.9,1.2-3,3.6-3.2,4.7c-0.2,1.1,0.8,2.3,0.8,2.3l-5.7,10.3c0,0,2.5,2.9,8.6,3.3\n\t\t\t            c6.1,0.4,6.5-1.3,14.3,0.8c7.8,2.1,12.2,13.9,27.5,12c0,0-2-6.2-4.5-9.9c-2.5-3.7-5.4-7.8-5.4-7.8c0.2-1.1,1.4-4.6,0.6-5.4\n\t\t\t            c-0.5-0.5-1-0.9-1.5-1.4c0.4-0.9,0.9-1.8,0.9-2.8c0-0.9-0.4-2-0.1-2.9c0.2-0.6,0.8-1,1.4-1c0.8,0,1.3,0.7,2.1,0.9\n\t\t\t            c0.8,0.2,2.1,0.1,2.9,0.1c0.9,0,1.7,0.7,2.5,0.9c2.1,0.7,4.4,0.4,5.9-1.3c1.6-1.8,0.3-3.6,0.3-3.6s-1.2-1.5-1.2-2.4\n\t\t\t            c0-0.9,0.7-1.6,0.7-1.6l0-0.1c0.1,0,0.2,0,0.3,0c0.7,0,1.3-0.5,1.3-1c0-0.2,0-0.3-0.1-0.4c0.5,0.1,1.2,0.2,1.3,0.2\n\t\t\t            c0.8,0.2,1.5,0.4,2.2,0.8c1.4,0.8,2.3,2.2,2.7,3.7c0.1,0.5,0.7,2.2,0.3,2.6c-0.3,0.3-0.4,1.1-0.4,1.5c0,0.8,0.3,1.7,0.8,2.3\n\t\t\t            c0.1,0.2,0.6,0.5,0.7,0.7c1.2,5.1,1.6,11.1,8.3,11.6c2.8,0.2,4.4-1.3,4.4-1.3s1.8-1.1,2.4-4.1c0.6-3,0.7-6.5,0.7-6.5\n\t\t\t            S-818.7,558.5-823.5,558.3z\n\t\t\t            M-865.4,497.4c-0.4,0-0.7,0-1.1,0c0,0,0-0.1,0-0.1C-866.3,497.4-865.9,497.4-865.4,497.4z\n\t\t\t            M-872.9,497.9\n\t\t\t            c0.3-0.1,2.5-0.4,3.4-0.4c0,0.1,0,0.1,0,0.2c-0.3,0-0.7,0.1-1,0.1c-1.6,0.2-3.3,0.6-4.9,1.2C-874.6,498.5-873.8,498-872.9,497.9z\n\t\t\t            M-878.4,498.2c1.6-0.8,2.9-0.9,4.7-1.1c-1.4,0.1-3.1,2.5-4.6,2C-878.7,498.9-878.9,498.5-878.4,498.2z\n\t\t\t            M-862,497.6\n\t\t\t            c0.1,0,0.3,0,0.4,0l0,0C-861.7,497.6-861.9,497.6-862,497.6z\n\t\t\t            M-860.9,496.5c-0.8-0.1-2.2-0.5-3-0.2c1.3-0.4,2.5-0.9,3.8-1.2\n\t\t\t            c0.7-0.1,1.4-0.2,2.1-0.1c1,0.2,1.1,0.9,0.2,1.4c0,0-0.1,0-0.1,0C-858.8,496.9-859.9,496.6-860.9,496.5z"></path></svg></g></g></svg>\n\t\t\t  <span>Sherlock</span>',a=x(),r=y("div"),n.id="sherlockHeader",n.className="svelte-nary1h",r.id="sherlockChart",r.className="svelte-nary1h"},m(t,e){h(t,n,e),h(t,a,e),h(t,r,e)},p:t,i:t,o:t,d(t){t&&(v(n),v(a),v(r))}}}function Ct(t){return S(()=>{const t=echarts.init(document.getElementById("sherlockChart")),e=[[[10,8.04],[8,6.95],[13,7.58],[9,8.81],[11,8.33],[14,9.96],[6,7.24],[4,4.26],[12,10.84],[7,4.82],[5,5.68]],[[10,9.14],[8,8.14],[13,8.74],[9,8.77],[11,9.26],[14,8.1],[6,6.13],[4,3.1],[12,9.13],[7,7.26],[5,4.74]],[[10,7.46],[8,6.77],[13,12.74],[9,7.11],[11,7.81],[14,8.84],[6,6.08],[4,5.39],[12,8.15],[7,6.42],[5,5.73]],[[8,6.58],[8,5.76],[8,7.71],[8,8.84],[8,8.47],[8,7.04],[8,5.25],[19,12.5],[8,5.56],[8,7.91],[8,6.89]]],n={animation:!1,label:{normal:{formatter:"y = 0.5 * x + 3",textStyle:{align:"right"}}},lineStyle:{normal:{type:"solid"}},tooltip:{formatter:"y = 0.5 * x + 3"},data:[[{coord:[0,3],symbol:"none"},{coord:[20,13],symbol:"none"}]]},a={grid:[{x:"10%",y:"7%",width:"32%",height:"25%"},{x2:"7%",y:"7%",width:"32%",height:"25%"},{x:"10%",y2:"27%",width:"32%",height:"25%"},{x2:"7%",y2:"27%",width:"32%",height:"25%"}],tooltip:{formatter:"Group {a}: ({c})"},xAxis:[{gridIndex:0,min:0,max:20,splitLine:{show:!1}},{gridIndex:1,min:0,max:20,splitLine:{show:!1}},{gridIndex:2,min:0,max:20,splitLine:{show:!1}},{gridIndex:3,min:0,max:20,splitLine:{show:!1}}],yAxis:[{gridIndex:0,min:0,max:15,name:"***",nameGap:-10,nameTextStyle:{color:"black",fontSize:16}},{gridIndex:1,min:0,max:15,name:"**",nameGap:-10,nameTextStyle:{color:"black",fontSize:16}},{gridIndex:2,min:0,max:15,name:"**",nameGap:-10,nameTextStyle:{color:"black",fontSize:16}},{gridIndex:3,min:0,max:15,name:"*",nameGap:-10,nameTextStyle:{color:"black",fontSize:16}}],series:[{name:"I",type:"scatter",xAxisIndex:0,yAxisIndex:0,data:e[0],markLine:n},{name:"II",type:"scatter",xAxisIndex:1,yAxisIndex:1,data:e[1],markLine:n},{name:"III",type:"scatter",xAxisIndex:2,yAxisIndex:2,data:e[2],markLine:n},{name:"IV",type:"scatter",xAxisIndex:3,yAxisIndex:3,data:e[3],markLine:n}]};t.setOption(a),window.addEventListener("resize",()=>{null!==t&&t.resize()})}),{}}class It extends Q{constructor(t){super(),K(this,t,Ct,kt,o,[])}}function _t(e){var n;return{c(){(n=y("div")).id="anovaChart",n.className="svelte-1a6ghsc"},m(t,e){h(t,n,e)},p:t,i:t,o:t,d(t){t&&v(n)}}}function Lt(t){return S(()=>{const t=echarts.init(document.getElementById("anovaChart")),e=[],n=[];for(var a=0;a<7;a++){var r=7*Math.random();e.push([a,echarts.number.round(Math.max(0,r-3*Math.random())),echarts.number.round(r+3*Math.random())]),n.push(echarts.number.round(r,2))}const i={tooltip:{trigger:"axis",axisPointer:{type:"shadow"}},grid:{left:36,top:5,right:0,bottom:25},xAxis:{data:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]},yAxis:{},series:[{type:"bar",name:"Availability",data:n,itemStyle:{normal:{color:"#96bcdb"}}},{type:"custom",name:"CI",itemStyle:{normal:{borderWidth:1.5}},renderItem:function(t,e){var n=e.value(0),a=e.coord([n,e.value(1)]),r=e.coord([n,e.value(2)]),i=.05*e.size([1,0])[0],o=e.style({stroke:"#888",fill:null});return{type:"group",children:[{type:"line",shape:{x1:a[0]-i,y1:a[1],x2:a[0]+i,y2:a[1]},style:o},{type:"line",shape:{x1:a[0],y1:a[1],x2:r[0],y2:r[1]},style:o},{type:"line",shape:{x1:r[0]-i,y1:r[1],x2:r[0]+i,y2:r[1]},style:o}]}},encode:{x:0,y:[1,2]},data:e,z:10}]};t.setOption(i),window.addEventListener("resize",()=>{null!==t&&t.resize()})}),{}}class Nt extends Q{constructor(t){super(),K(this,t,Lt,_t,o,[])}}function zt(t){var e,n,a,r,i,o,c,s,l,u,d,m,f,g,$,b,T,k,C=new yt({}),I=new mt({props:{activeTab:t.activeTab}}),_=new xt({}),L=new Tt({}),N=new It({}),z=new Nt({});return{c(){e=y("main"),n=y("header"),C.$$.fragment.c(),a=x(),r=y("nav"),i=y("div"),I.$$.fragment.c(),o=x(),c=y("div"),_.$$.fragment.c(),s=x(),l=y("section"),u=y("div"),(d=y("button")).textContent="change tabs",m=x(),L.$$.fragment.c(),f=x(),g=y("aside"),N.$$.fragment.c(),$=x(),b=y("div"),z.$$.fragment.c(),n.className="svelte-1gg47ow",i.className="tabs svelte-1gg47ow",c.className="undoRedo svelte-1gg47ow",r.className="svelte-1gg47ow",d.className="svelte-1gg47ow",u.id="mainChart",u.className="svelte-1gg47ow",g.className="svelte-1gg47ow",b.id="anova",b.className="svelte-1gg47ow",l.className="svelte-1gg47ow",e.className="svelte-1gg47ow",k=w(d,"click",t.toggle)},m(t,v){h(t,e,v),p(e,n),U(C,n,null),p(e,a),p(e,r),p(r,i),U(I,i,null),p(r,o),p(r,c),U(_,c,null),p(e,s),p(e,l),p(l,u),p(u,d),p(u,m),U(L,u,null),p(l,f),p(l,g),U(N,g,null),p(l,$),p(l,b),U(z,b,null),T=!0},p(t,e){var n={};t.activeTab&&(n.activeTab=e.activeTab),I.$set(n)},i(t){T||(C.$$.fragment.i(t),I.$$.fragment.i(t),_.$$.fragment.i(t),L.$$.fragment.i(t),N.$$.fragment.i(t),z.$$.fragment.i(t),T=!0)},o(t){C.$$.fragment.o(t),I.$$.fragment.o(t),_.$$.fragment.o(t),L.$$.fragment.o(t),N.$$.fragment.o(t),z.$$.fragment.o(t),T=!1},d(t){t&&v(e),C.$destroy(),I.$destroy(),_.$destroy(),L.$destroy(),N.$destroy(),z.$destroy(),k()}}}function St(t,e,n){let a=0;return{activeTab:a,toggle:function(){n("activeTab",a=0==a?1:0)}}}return new class extends Q{constructor(t){super(),K(this,t,St,zt,o,[])}}({target:document.body})}();
