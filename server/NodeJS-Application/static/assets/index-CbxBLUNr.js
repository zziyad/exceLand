import{j as e,r as o}from"./react-PgVlHDAJ.js";import{c as de}from"./react-dom-CXMHReE6.js";import{L as p,B as me}from"./react-router-dom-CyHC4N9E.js";import{L as R,T as w,B as k,S as K,A as T,a as b,N as y,D as F,b as ue,F as C,c as he,d as pe}from"./flowbite-react-46nWeacV.js";import"./classnames-DgSCoAjv.js";import{u as O,a as S,P as xe}from"./react-redux-CMBZtLt4.js";import{c as V,a as ge}from"./@reduxjs-DVdFRU_h.js";import{a as $,b as B,O as Q,d as Z,e as fe,f as g}from"./react-router-CM6PPoGv.js";import{v as H}from"./uuid-D8aEg3BZ.js";import{m as je,n as be,o as ve,p as ye,q as we,r as Se,s as Ne,t as Ue,B as Pe,u as Ce}from"./react-icons-CMgtkaJU.js";import{i as ke,g as X,a as ee,u as se,b as te}from"./@firebase-Dcsh3J1M.js";import"./firebase-CbHBT8Nc.js";import{C as ae}from"./react-circular-progressbar-DJALOT0y.js";import{R as Ie}from"./react-quill-2kQdX-vU.js";import{p as Fe,a as Te,d as De,P as Ee}from"./redux-persist-Cj2tF6BV.js";import{c as Le}from"./redux-DITMfSWq.js";import"./scheduler-CzFDRTuY.js";import"./@remix-run-DyRdwddT.js";import"./tailwind-merge-Du4_Do6r.js";import"./@floating-ui-DOJzZagw.js";import"./tabbable-CjV0_wFH.js";import"./use-sync-external-store-B2-9dOn6.js";import"./immer-BWU1mfoO.js";import"./reselect-BeKUwQU7.js";import"./redux-thunk-ClJT1hhx.js";import"./idb-BXWtuYvb.js";import"./lodash-DpTLAi5C.js";import"./quill-BWB5bpve.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function n(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=n(r);fetch(r.href,a)}})();function Re(){return e.jsx("div",{children:"Home"})}function Oe(){return e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-4",children:"Kateqoriyalar"}),e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"Təhsil məsələləri üzrə məsləhətçi"}),e.jsxs("div",{className:"mb-6",children:[e.jsx("p",{className:"text-gray-700",children:"Əlaqə məlumatları:"}),e.jsxs("ul",{className:"list-disc pl-6",children:[e.jsxs("li",{className:"mt-2",children:["050 455 67 68 ",e.jsx("span",{className:"text-gray-600",children:"- Mobil"})]}),e.jsxs("li",{className:"mt-2",children:["info@exceland.az"," ",e.jsx("span",{className:"text-gray-600",children:"- E-poçt ünvanı"})]})]})]})]})}function ze(){return e.jsx("div",{className:"min-h-[80vh] flex items-center justify-center",children:e.jsx("div",{className:"max-w-2xl mx-auto p-3 text-center",children:e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font font-semibold text-center my-7",children:"About ExceLand"}),e.jsxs("div",{className:"text-md text-gray-500 flex flex-col gap-6",children:[e.jsx("p",{children:"🇦🇿 Ana dilində keyfiyyətli kontent təqdim edən Exceland ilə birlikdə qısa zamanda Excel üzrə ekspert olun. Təlimçilərimiz beynəlxalq sertifikatlara və zəngin iş təcrübəsinə sahib mütəxəssislərdir. Video dərslər, vebinarlar və öyrədici materiallarımız isə sizə Exceli öyrənməkdə çox yardımçı olacaq."}),e.jsx("p",{children:"🇬🇧 Become an Excel expert as soon as possible with Exceland, which provides quality content in our native language. Exceland trainers are specialists with international certificates and rich work experience. Our video lessons, webinars and tutorials will help you learn Excel."}),e.jsx("p",{children:"We encourage you to leave comments on our posts and engage with other readers. You can like other people's comments and reply to them as well. We believe that a community of learners can help each other grow and improve."})]})]})})})}function Ae(){return e.jsx("div",{children:"Activity"})}const Be={currentUser:null,error:null,loading:!1},re=V({name:"user",initialState:Be,reducers:{signInStart:s=>{s.loading=!0,s.error=null},signInSuccess:(s,t)=>{s.currentUser=t.payload,s.loading=!1,s.error=null},signInFailure:(s,t)=>{s.loading=!1,s.error=t.payload},updateStart:s=>{s.loading=!0,s.error=null},updateSuccess:(s,t)=>{s.currentUser=t.payload,s.loading=!1,s.error=null},updateFailure:(s,t)=>{s.loading=!1,s.error=t.payload},deleteUserStart:s=>{s.loading=!0,s.error=null},deleteUserSuccess:s=>{s.currentUser=null,s.loading=!1,s.error=null},deleteUserFailure:(s,t)=>{s.loading=!1,s.error=t.payload},signoutSuccess:s=>{s.currentUser=null,s.error=null,s.loading=!1}}}),{signInStart:He,signInSuccess:qe,signInFailure:_,updateStart:Ye,updateSuccess:_e,updateFailure:J,deleteUserStart:Hs,deleteUserSuccess:qs,deleteUserFailure:Ys,signoutSuccess:G}=re.actions,$e=re.reducer;function M(s){const[t,n]=o.useState(),[i,r]=o.useState(),a=O(),l=$();B();function d(m={}){fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:H(),type:"call",method:s.split("api/")[1],args:m})}).then(c=>{if(c.status===401&&(window.confirm("Your session has expired. Please log in again."),a(G())),!c.ok)throw c.status;return c.json()}).then(c=>{const{result:{status:x,response:h}}=c;if(s.endsWith("signin")){a(He()),x==="rejected"&&a(_(h)),a(qe(h)),l("/");return}n(c.result)}).catch(c=>{console.log(c),r(c)})}return{appendData:d,data:t,errorStatus:i}}function Ge(){const[s,t]=o.useState({}),{loading:n,error:i}=S(m=>m.user),r=O(),a=m=>{t({...s,[m.target.id]:m.target.value.trim()})},{appendData:l}=M("api/auth/signin"),d=async m=>{if(m.preventDefault(),!s.email||!s.password)return r(_("Please fill all the fields"));try{await l(s)}catch(c){r(_(c.message))}};return e.jsx("div",{className:"min-h-[70vh] mt-20",children:e.jsxs("div",{className:"flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5",children:[e.jsxs("div",{className:"flex-1 p-4",children:[e.jsx("div",{children:e.jsx("img",{className:"w-70",src:"./Exl.png",alt:"logo"})}),e.jsx("p",{className:"text-sm mt-5",children:"This is a demo project. You can sign in with your email and password or with Google."}),e.jsx("span",{})]}),e.jsxs("div",{className:"flex-1 p-4",children:[e.jsxs("form",{className:"flex flex-col gap-4",onSubmit:d,children:[e.jsxs("div",{children:[e.jsx(R,{value:"Your email"}),e.jsx(w,{type:"email",placeholder:"name@company.com",id:"email",onChange:a})]}),e.jsxs("div",{children:[e.jsx(R,{value:"Your password"}),e.jsx(w,{type:"password",placeholder:"*********",id:"password",onChange:a})]}),e.jsx(k,{gradientDuoTone:"purpleToPink",type:"submit",disabled:n,children:n?e.jsxs(e.Fragment,{children:[e.jsx(K,{size:"sm"}),e.jsx("span",{className:"pl-3",children:"Loading..."})]}):"Sign Up"})]}),e.jsxs("div",{className:"flex gap-2 text-sm mt-5",children:[e.jsx("span",{children:"Dont Have an account?"}),e.jsx(p,{to:"/sign-up",className:"text-blue-500",children:"Sign Up"})]}),i&&e.jsx(T,{className:"mt-5",color:"failure",children:i})]})]})})}function Me(){const[s,t]=o.useState({}),[n,i]=o.useState(null),[r,a]=o.useState(!1),l=$(),d=c=>{t({...s,[c.target.id]:c.target.value.trim()})},m=async c=>{if(c.preventDefault(),!s.username||!s.email||!s.password)return i("Please fill out all fields.");try{a(!0),i(null);const x=await fetch("api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:H(),type:"call",method:"auth/register",args:s})}),{result:{status:h,response:D}}=await x.json();if(h==="rejected")return a(!1),i(D);a(!1),x.ok&&l("/sign-in")}catch(x){i(x.message),a(!1)}};return e.jsx("div",{className:"min-h-[70vh] mt-20",children:e.jsxs("div",{className:"flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5",children:[e.jsxs("div",{className:"flex-1 p-4",children:[e.jsx("div",{children:e.jsx("img",{className:"w-70",src:"./Exl.png",alt:"logo"})}),e.jsx("p",{className:"text-sm mt-5",children:"This is a demo project. You can sign up with your email and password or with Google."}),e.jsx("span",{})]}),e.jsxs("div",{className:"flex-1 p-4",children:[e.jsxs("form",{className:"flex flex-col gap-4",onSubmit:m,children:[e.jsxs("div",{className:"",children:[e.jsx(R,{value:"Your username"}),e.jsx(w,{type:"text",placeholder:"Username",id:"username",onChange:d})]}),e.jsxs("div",{children:[e.jsx(R,{value:"Your email"}),e.jsx(w,{type:"email",placeholder:"name@company.com",id:"email",onChange:d})]}),e.jsxs("div",{children:[e.jsx(R,{value:"Your password"}),e.jsx(w,{type:"password",placeholder:"Password",id:"password",onChange:d})]}),e.jsx(k,{gradientDuoTone:"purpleToPink",type:"submit",disabled:r,children:r?e.jsxs(e.Fragment,{children:[e.jsx(K,{size:"sm"}),e.jsx("span",{className:"pl-3",children:"Loading..."})]}):"Sign Up"})]}),e.jsxs("div",{className:"flex gap-2 text-sm mt-5",children:[e.jsx("span",{children:"Have an account?"}),e.jsx(p,{to:"/nenya",className:"text-blue-500",children:"Sign In"})]}),n&&e.jsx(T,{className:"mt-5",color:"failure",children:n})]})]})})}function We(){const s=B(),t=O(),{currentUser:n}=S(l=>l.user),[i,r]=o.useState("");o.useEffect(()=>{const d=new URLSearchParams(s.search).get("tab");d&&r(d)},[s.search]);const a=async()=>{try{(await fetch("/api/auth/signout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:H(),type:"call",method:"auth/signout",args:{}})})).ok&&t(G())}catch(l){console.log(l.message)}};return e.jsx(b,{className:"w-full md:w-56",children:e.jsx(b.Items,{children:e.jsxs(b.ItemGroup,{className:"flex flex-col gap-1",children:[n&&n.isAdmin&&e.jsx(p,{to:"/dashboard?tab=dash",children:e.jsx(b.Item,{active:i==="dash"||!i,icon:je,as:"div",children:"Dashboard"})}),e.jsx(p,{to:"/dashboard?tab=profile",children:e.jsx(b.Item,{active:i==="profile",icon:be,label:n.isAdmin?"Admin":"User",labelColor:"dark",as:"div",children:"Profile"})}),n.isAdmin&&e.jsx(p,{to:"/dashboard?tab=posts",children:e.jsx(b.Item,{active:i==="posts",icon:ve,as:"div",children:"Posts"})}),n.isAdmin&&e.jsxs(e.Fragment,{children:[e.jsx(p,{to:"/dashboard?tab=users",children:e.jsx(b.Item,{active:i==="users",icon:ye,as:"div",children:"Users"})}),e.jsx(p,{to:"/dashboard?tab=comments",children:e.jsx(b.Item,{active:i==="comments",icon:we,as:"div",children:"Comments"})})]}),e.jsx(b.Item,{icon:Se,className:"cursor-pointer",onClick:a,children:"Sign Out"})]})})})}const Je={apiKey:"AIzaSyC3yzz501CyaZBLkx227hB_SKGne5W0siY",authDomain:"excelland-71348.firebaseapp.com",projectId:"excelland-71348",storageBucket:"excelland-71348.appspot.com",messagingSenderId:"197631826668",appId:"1:197631826668:web:3c8dcf5fb5c9c42a2ee3c9"},ne=ke(Je);function Ke(){const{currentUser:s,loading:t}=S(f=>f.user),[n,i]=o.useState(null),[r,a]=o.useState(null),[l,d]=o.useState(null),[m,c]=o.useState(null),[x,h]=o.useState(!1),[D,E]=o.useState(null),[z,N]=o.useState(null),[u,L]=o.useState({id:s.id}),A=o.useRef(),U=O(),P=f=>{const j=f.target.files[0];j&&(i(j),a(URL.createObjectURL(j)))};o.useEffect(()=>{n&&q()},[n]);const q=async()=>{h(!0),c(null);const f=X(ne),j=new Date().getTime()+n.name,Y=ee(f,j),I=se(Y,n);I.on("state_changed",v=>{const ce=v.bytesTransferred/v.totalBytes*100;d(ce.toFixed(0))},v=>{c("Could not upload image (File must be less than 2MB)"),d(null),i(null),a(null),h(!1)},()=>{te(I.snapshot.ref).then(v=>{a(v),L({...u,profile_picture:v}),h(!1)})})},W=f=>{L({...u,[f.target.id]:f.target.value.trim()})},oe=async f=>{if(f.preventDefault(),N(null),E(null),Object.keys(u).length===0){N("No changes made");return}if(x){N("Please wait for image to upload");return}try{U(Ye());const j=await fetch("api/user/update",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:H(),type:"call",method:"user/update",args:u})}),{result:{status:Y,response:I}}=await j.json();if(Y==="rejected")U(J(I)),N(I);else{const v=Object.assign(I,s);U(_e(v)),E("User's profile updated successfully")}}catch(j){U(J(j.message)),N(j.message)}};return e.jsxs("div",{className:"max-w-lg mx-auto p-3 w-full",children:[e.jsx("h1",{className:"my-7 text-center font-semibold text-3xl",children:"Profile"}),e.jsxs("form",{onSubmit:oe,className:"flex flex-col gap-4",children:[e.jsx("input",{type:"file",accept:"image/*",onChange:P,ref:A,hidden:!0}),e.jsxs("div",{className:"relative w-32 h-32 self-center cursor-pointer shadow-md overflow-hidden rounded-full",onClick:()=>A.current.click(),children:[l&&e.jsx(ae,{value:l||0,text:`${l}%`,strokeWidth:5,styles:{root:{width:"100%",height:"100%",position:"absolute",top:0,left:0},path:{stroke:`rgba(62, 152, 199, ${l/100})`}}})," ",e.jsx("img",{src:r||s.profile_picture,alt:"user",className:`rounded-full w-full h-full object-cover border-8 border-[lightgray] ${l&&l<100&&"opacity-60"}`})]}),e.jsx(w,{type:"text",id:"username",placeholder:"username",defaultValue:s.username,onChange:W}),e.jsx(w,{type:"password",id:"password",placeholder:"password",onChange:W}),e.jsx(k,{type:"submit",gradientDuoTone:"purpleToBlue",outline:!0,disabled:t||x,children:t?"Loading...":"Update"}),s.is_admin&&e.jsx(p,{to:"/create-post",children:e.jsx(k,{type:"button",gradientDuoTone:"purpleToPink",className:"w-full",children:"Create a post"})})]}),e.jsxs("div",{className:"text-red-500 flex justify-between mt-5",children:[D&&e.jsx(T,{color:"success",className:"mt-5",children:D}),z&&e.jsx(T,{color:"failure",className:"mt-5",children:z})]})]})}function Ve(){const s=B(),[t,n]=o.useState("");return o.useEffect(()=>{const r=new URLSearchParams(s.search).get("tab");r&&n(r)},[s.search]),e.jsxs("div",{className:"min-h-[80vh] flex flex-col md:flex-row",children:[e.jsx("div",{className:"md:w-56",children:e.jsx(We,{})}),t==="profile"&&e.jsx(Ke,{})]})}function Qe(){return e.jsx("div",{children:"Blog"})}const Ze={theme:"light"},le=V({name:"theme",initialState:Ze,reducers:{toggleTheme:s=>{s.theme=s.theme==="light"?"dark":"light"}}}),{toggleTheme:Xe}=le.actions,es=le.reducer;function ss(){const s=B().pathname,t=O(),{currentUser:n}=S(m=>m.user),{theme:i}=S(m=>m.theme),{appendData:r,data:a,errorStatus:l}=M("api/post/create"),d=async()=>{await r(),t(G())};return e.jsxs(y,{className:"border-b-2",children:[e.jsx(p,{to:"/",className:"self-center whitespace-nowrap relative text-sm sm:text-xl font-semibold dark:text-white",children:e.jsx("img",{className:"h-12",src:"./Exl.png",alt:"logo"})}),e.jsxs("div",{className:"flex gap-2 md:order-2",children:[e.jsx(k,{className:"w-12 h-10 sm:inline",color:"gray",pill:!0,onClick:()=>t(Xe()),children:i==="light"?e.jsx(Ne,{}):e.jsx(Ue,{})}),n?e.jsxs(F,{arrowIcon:!1,inline:!0,label:e.jsx(ue,{alt:"user",img:n.profile_picture,rounded:!0}),children:[e.jsx(F.Header,{children:e.jsx("span",{className:"block text-sm",children:n.username})}),e.jsx(p,{to:"/dashboard?tab=profile",children:e.jsx(F.Item,{children:"Profile"})}),n.is_admin?e.jsx(p,{to:"/create-post",children:e.jsx(F.Item,{children:"Create Post"})}):e.jsx(e.Fragment,{}),e.jsx(F.Divider,{}),e.jsx(F.Item,{onClick:d,children:"Sign out"})]}):e.jsx(e.Fragment,{}),e.jsx(y.Toggle,{})]}),e.jsxs(y.Collapse,{children:[e.jsx(y.Link,{active:s==="/",as:"div",children:e.jsx(p,{to:"/",children:"Ana Səifə"})}),e.jsx(y.Link,{active:s==="/about",as:"div",children:e.jsx(p,{to:"/about",children:"Haqqımızda"})}),e.jsx(y.Link,{active:s==="/activity",as:"div",children:e.jsx(p,{to:"/activity",children:"Fəaliyyət Sahəsi"})}),e.jsx(y.Link,{active:s==="/blog",as:"div",children:e.jsx(p,{to:"/blog",children:"Blog"})}),e.jsx(y.Link,{active:s==="/contact",as:"div",children:e.jsx(p,{to:"/contact",children:"Əlaqə"})})]})]})}function ts(){return e.jsx(C,{container:!0,className:"",children:e.jsx("div",{className:"w-full max-w-7xl mx-auto",children:e.jsxs("div",{className:"w-full sm:flex sm:items-center sm:justify-between",children:[e.jsx(C.Copyright,{href:"#",by:"ExeLand blog",year:new Date().getFullYear()}),e.jsx("div",{className:"flex gap-6 sm:mt-0 mt-4 sm:justify-center",children:e.jsxs(C.LinkGroup,{children:[e.jsx(C.Link,{href:"#",children:"Privacy Policy"}),e.jsx(C.Link,{href:"#",children:"Terms & Conditions"})]})}),e.jsxs("div",{className:"flex gap-6 sm:mt-0 mt-4 sm:justify-center",children:[e.jsx(C.Icon,{href:"https://www.facebook.com/exceland.az/",icon:Pe}),e.jsx(C.Icon,{href:"https://www.instagram.com/exceland.az/",icon:Ce})]})]})})})}function as(){const{currentUser:s}=S(t=>t.user);return s?e.jsx(Q,{}):e.jsx(Z,{to:"/"})}function rs(){const{currentUser:s}=S(t=>t.user);return s&&s.is_admin?e.jsx(Q,{}):e.jsx(Z,{to:"/"})}function ns(){const[s,t]=o.useState(null),[n,i]=o.useState(null),[r,a]=o.useState(null),[l,d]=o.useState({}),[m,c]=o.useState(null),{appendData:x,data:h,errorStatus:D}=M("api/post/create"),E=$(),z=async()=>{try{if(!s){a("Please select an image");return}a(null);const u=X(ne),L=new Date().getTime()+"-"+s.name,A=ee(u,L),U=se(A,s);U.on("state_changed",P=>{const q=P.bytesTransferred/P.totalBytes*100;i(q.toFixed(0))},P=>{a("Image upload failed"),i(null)},()=>{te(U.snapshot.ref).then(P=>{i(null),a(null),d({...l,image:P})})})}catch(u){a("Image upload failed"),i(null),console.log(u)}},N=async u=>{u.preventDefault();try{await x(l)}catch{c("Something went wrong")}};return o.useEffect(()=>{console.log({data:h}),h!=null&&h.response&&E(`/post/${h==null?void 0:h.response.slug}`)},[h,E]),e.jsxs("div",{className:"p-3 max-w-3xl mx-auto min-h-screen",children:[e.jsx("h1",{className:"text-center text-3xl my-7 font-semibold",children:"Create a post"}),e.jsxs("form",{className:"flex flex-col gap-4",onSubmit:N,children:[e.jsxs("div",{className:"flex flex-col gap-4 sm:flex-row justify-between",children:[e.jsx(w,{type:"text",placeholder:"Title",required:!0,id:"title",className:"flex-1",onChange:u=>d({...l,title:u.target.value})}),e.jsxs(he,{onChange:u=>d({...l,category:u.target.value}),children:[e.jsx("option",{value:"uncategorized",children:"Select a category"}),e.jsx("option",{value:"javascript",children:"JavaScript"}),e.jsx("option",{value:"reactjs",children:"React.js"}),e.jsx("option",{value:"nextjs",children:"Next.js"})]})]}),e.jsxs("div",{className:"flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3",children:[e.jsx(pe,{type:"file",accept:"image/*",onChange:u=>t(u.target.files[0])})," ",e.jsx(k,{type:"button",gradientDuoTone:"purpleToBlue",size:"sm",outline:!0,onClick:z,disabled:n,children:n?e.jsx("div",{className:"w-16 h-16",children:e.jsx(ae,{value:n,text:`${n||0}%`})}):"Upload Image"})]}),r&&e.jsx(T,{color:"failure",children:r}),l.image&&e.jsx("img",{src:l.image,alt:"upload",className:"w-full h-72 object-cover"}),e.jsx(Ie,{theme:"snow",placeholder:"Write something...",className:"h-72 mb-12",required:!0,onChange:u=>{d({...l,content:u})}}),e.jsx(k,{type:"submit",gradientDuoTone:"purpleToPink",children:"Publish"}),m&&e.jsx(T,{className:"mt-5",color:"failure",children:m})]})]})}function ls(){return e.jsxs(me,{children:[e.jsx(ss,{}),e.jsxs(fe,{children:[e.jsx(g,{path:"/",element:e.jsx(Re,{})}),e.jsx(g,{path:"/about",element:e.jsx(ze,{})}),e.jsx(g,{path:"/nenya",element:e.jsx(Ge,{})}),e.jsx(g,{path:"/sign-up",element:e.jsx(Me,{})}),e.jsx(g,{element:e.jsx(as,{}),children:e.jsx(g,{path:"/dashboard",element:e.jsx(Ve,{})})}),e.jsx(g,{element:e.jsx(rs,{}),children:e.jsx(g,{path:"/create-post",element:e.jsx(ns,{})})}),e.jsx(g,{path:"/blog",element:e.jsx(Qe,{})}),e.jsx(g,{path:"/activity",element:e.jsx(Ae,{})}),e.jsx(g,{path:"/contact",element:e.jsx(Oe,{})})]}),e.jsx(ts,{})]})}const is=Le({user:$e,theme:es}),os={key:"root",storage:De,version:1},cs=Fe(os,is),ie=ge({reducer:cs,middleware:s=>s({serializableCheck:!1})}),ds=Te(ie);function ms({children:s}){const{theme:t}=S(n=>n.theme);return e.jsx("div",{className:t,children:e.jsx("div",{className:"bg-white text-gray-700 dark:text-gray-200 dark:bg-[rgb(16,23,42)] min-h-screen",children:s})})}de.createRoot(document.getElementById("root")).render(e.jsx(Ee,{persistor:ds,children:e.jsx(xe,{store:ie,children:e.jsx(ms,{children:e.jsx(ls,{})})})}));
