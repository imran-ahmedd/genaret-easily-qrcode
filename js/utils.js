// ==========================================================
// Tech Verse QR — utils.js
// Unicode-safe base64 helpers used to pack data into the
// domain landing link (?view=scan&t=<type>&d=<data>)
// ==========================================================

function encodeData(obj) {
  const json = JSON.stringify(obj);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  // make URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeData(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const json = decodeURIComponent(escape(atob(base64)));
  return JSON.parse(json);
}

// Base URL of this site — automatically uses whatever domain the
// site is hosted on, no manual configuration needed.
function siteBaseUrl() {
  return location.origin + location.pathname;
}

function buildScanLink(type, dataObj) {
  const d = encodeData(dataObj);
  return `${siteBaseUrl()}?view=scan&t=${type}&d=${d}`;
}
