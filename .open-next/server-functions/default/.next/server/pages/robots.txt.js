"use strict";(()=>{var a={};a.id=221,a.ids=[220,221,636],a.modules={361:a=>{a.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},1432:(a,b,c)=>{c.a(a,async(a,d)=>{try{c.r(b),c.d(b,{config:()=>q,default:()=>m,getServerSideProps:()=>p,getStaticPaths:()=>o,getStaticProps:()=>n,handler:()=>y,reportWebVitals:()=>r,routeModule:()=>x,unstable_getServerProps:()=>v,unstable_getServerSideProps:()=>w,unstable_getStaticParams:()=>u,unstable_getStaticPaths:()=>t,unstable_getStaticProps:()=>s});var e=c(1838),f=c(9248),g=c(1196),h=c(8568),i=c(4936),j=c(2179),k=c(3954),l=a([i,j]);[i,j]=l.then?(await l)():l;let m=(0,g.M)(j,"default"),n=(0,g.M)(j,"getStaticProps"),o=(0,g.M)(j,"getStaticPaths"),p=(0,g.M)(j,"getServerSideProps"),q=(0,g.M)(j,"config"),r=(0,g.M)(j,"reportWebVitals"),s=(0,g.M)(j,"unstable_getStaticProps"),t=(0,g.M)(j,"unstable_getStaticPaths"),u=(0,g.M)(j,"unstable_getStaticParams"),v=(0,g.M)(j,"unstable_getServerProps"),w=(0,g.M)(j,"unstable_getServerSideProps"),x=new e.PagesRouteModule({definition:{kind:f.RouteKind.PAGES,page:"/robots.txt",pathname:"/robots.txt",bundlePath:"",filename:""},distDir:".next",relativeProjectDir:"",components:{App:i.default,Document:h.default},userland:j}),y=(0,k.U)({srcPage:"/robots.txt",config:q,userland:j,routeModule:x,getStaticPaths:o,getStaticProps:n,getServerSideProps:p});d()}catch(a){d(a)}})},2015:a=>{a.exports=require("react")},2179:(a,b,c)=>{c.a(a,async(a,d)=>{try{c.r(b),c.d(b,{default:()=>g,getServerSideProps:()=>h});var e=c(7775),f=a([e]);e=(f.then?(await f)():f)[0];let h=async({req:a,res:b})=>{if("GET"!==a.method&&"HEAD"!==a.method)return b.statusCode=405,b.setHeader("Content-Type","application/json"),b.write(JSON.stringify({error:"method not allowed"})),b.end(),{props:{}};b.setHeader("Cache-Control","public, max-age=86400, immutable"),b.setHeader("Content-Type","text/plain");let c="production"===process.env.VERCEL_ENV||!process.env.VERCEL_ENV;return"HEAD"===a.method||(c?b.write(`User-agent: *
Allow: /
Disallow: /api/get-tweet-ast/*
Disallow: /api/search-notion

Sitemap: ${e.Hc}/sitemap.xml
`):b.write(`User-agent: *
Disallow: /

Sitemap: ${e.Hc}/sitemap.xml
`)),b.end(),{props:{}}};function g(){return null}d()}catch(a){d(a)}})},2326:a=>{a.exports=require("react-dom")},2870:a=>{a.exports=require("@react-icons/all-files/io5/IoChevronDown")},3873:a=>{a.exports=require("path")},3892:a=>{a.exports=require("classnames")},4075:a=>{a.exports=require("zlib")},4120:a=>{a.exports=require("posthog-js")},5719:a=>{a.exports=import("notion-utils")},5882:a=>{a.exports=require("@react-icons/all-files")},6060:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external.js")},6301:a=>{a.exports=import("fathom-client")},7067:a=>{a.exports=import("react-force-graph-2d")},7085:a=>{a.exports=require("styled-jsx/style")},7810:a=>{a.exports=import("@vercel/analytics/next")},7910:a=>{a.exports=require("stream")},8568:(a,b,c)=>{c.r(b),c.d(b,{default:()=>h});var d=c(8732),e=c(5882),f=c(8276),g=c.n(f);class h extends g(){render(){return(0,d.jsx)(e.IconContext.Provider,{value:{style:{verticalAlign:"middle"}},children:(0,d.jsxs)(f.Html,{lang:this.props.locale,children:[(0,d.jsxs)(f.Head,{children:[(0,d.jsx)("link",{rel:"shortcut icon",href:"/favicon.ico"}),(0,d.jsx)("link",{rel:"icon",type:"image/png",href:"/icon.png"}),(0,d.jsx)("link",{rel:"apple-touch-icon",href:"/apple-touch-icon.png"}),(0,d.jsx)("link",{rel:"manifest",href:"/api/manifest"})]}),(0,d.jsxs)("body",{children:[(0,d.jsx)("script",{dangerouslySetInnerHTML:{__html:`
/** Inlined version of noflash.js from use-dark-mode */
;(function () {
  var storageKey = 'darkMode'
  var classNameDark = 'dark-mode'
  var classNameLight = 'light-mode'
  function setClassOnDocumentBody(darkMode) {
    document.body.classList.add(darkMode ? classNameDark : classNameLight)
    document.body.classList.remove(darkMode ? classNameLight : classNameDark)
  }
  var preferDarkQuery = '(prefers-color-scheme: dark)'
  var mql = window.matchMedia(preferDarkQuery)
  var supportsColorSchemeQuery = mql.media === preferDarkQuery
  var localStorageTheme = null
  try {
    localStorageTheme = localStorage.getItem(storageKey)
  } catch (err) {}
  var localStorageExists = localStorageTheme !== null
  if (localStorageExists) {
    localStorageTheme = JSON.parse(localStorageTheme)
  }
  // Determine the source of truth
  if (localStorageExists) {
    // source of truth from localStorage
    setClassOnDocumentBody(localStorageTheme)
  } else if (supportsColorSchemeQuery) {
    // source of truth from system
    setClassOnDocumentBody(mql.matches)
    localStorage.setItem(storageKey, mql.matches)
  } else {
    // source of truth from document.body
    var isDarkMode = document.body.classList.contains(classNameDark)
    localStorage.setItem(storageKey, JSON.stringify(isDarkMode))
  }
})();
`}}),(0,d.jsx)(f.Main,{}),(0,d.jsx)(f.NextScript,{})]})]})})}}},8732:a=>{a.exports=require("react/jsx-runtime")},8751:a=>{a.exports=require("next-i18next")},9021:a=>{a.exports=require("fs")},9103:a=>{a.exports=require("@react-icons/all-files/io5/IoChevronForward")}};var b=require("../webpack-runtime.js");b.C(a);var c=b.X(0,[816,602,276,917,936],()=>b(b.s=1432));module.exports=c})();