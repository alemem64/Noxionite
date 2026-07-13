"use strict";(()=>{var a={};a.id=220,a.ids=[220],a.modules={361:a=>{a.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},2015:a=>{a.exports=require("react")},3873:a=>{a.exports=require("path")},5882:a=>{a.exports=require("@react-icons/all-files")},8568:(a,b,c)=>{c.r(b),c.d(b,{default:()=>h});var d=c(8732),e=c(5882),f=c(8276),g=c.n(f);class h extends g(){render(){return(0,d.jsx)(e.IconContext.Provider,{value:{style:{verticalAlign:"middle"}},children:(0,d.jsxs)(f.Html,{lang:this.props.locale,children:[(0,d.jsxs)(f.Head,{children:[(0,d.jsx)("link",{rel:"shortcut icon",href:"/favicon.ico"}),(0,d.jsx)("link",{rel:"icon",type:"image/png",href:"/icon.png"}),(0,d.jsx)("link",{rel:"apple-touch-icon",href:"/apple-touch-icon.png"}),(0,d.jsx)("link",{rel:"manifest",href:"/api/manifest"})]}),(0,d.jsxs)("body",{children:[(0,d.jsx)("script",{dangerouslySetInnerHTML:{__html:`
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
`}}),(0,d.jsx)(f.Main,{}),(0,d.jsx)(f.NextScript,{})]})]})})}}},8732:a=>{a.exports=require("react/jsx-runtime")}};var b=require("../webpack-runtime.js");b.C(a);var c=b.X(0,[816,276],()=>b(b.s=8568));module.exports=c})();