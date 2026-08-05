// ==========================================================
// Tech Verse QR — qr-generator.js
// Builds the form per QR type, and instead of encoding the raw
// data directly, encodes a link back to this same domain
// (?view=scan&t=...&d=...) so scanning always shows the
// Tech Verse QR branded page first, with a button to act on it.
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  // decorative empty-state grid
  const eg = document.getElementById('emptyGrid');
  const pattern = [1,0,1,1,0,1,0, 0,1,0,0,1,0,1, 1,1,0,1,1,0,1, 0,0,1,0,0,1,0, 1,0,1,1,0,1,1, 0,1,0,0,1,0,0, 1,1,0,1,0,1,1];
  if (eg) {
    pattern.forEach(v => {
      const s = document.createElement('span');
      if (v) s.classList.add('on');
      eg.appendChild(s);
    });
  }

  const forms = {
    url: `
      <div class="field"><label>ওয়েবসাইট লিংক</label><input type="text" id="f_url" placeholder="https://example.com"></div>`,
    text: `
      <div class="field"><label>যেকোনো টেক্সট</label><textarea id="f_text" placeholder="আপনার লেখা এখানে দিন"></textarea></div>`,
    wifi: `
      <div class="field"><label>নেটওয়ার্কের নাম (SSID)</label><input type="text" id="f_ssid" placeholder="MyWiFiNetwork"></div>
      <div class="field"><label>পাসওয়ার্ড</label><input type="text" id="f_pass" placeholder="পাসওয়ার্ড"></div>
      <div class="field"><label>এনক্রিপশন</label>
        <select id="f_enc"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">কোনো পাসওয়ার্ড নেই</option></select>
      </div>`,
    vcard: `
      <div class="row2">
        <div class="field"><label>নাম</label><input type="text" id="f_name" placeholder="পূর্ণ নাম"></div>
        <div class="field"><label>প্রতিষ্ঠান</label><input type="text" id="f_org" placeholder="কোম্পানি / প্রতিষ্ঠান"></div>
      </div>
      <div class="row2">
        <div class="field"><label>ফোন</label><input type="text" id="f_vphone" placeholder="+8801XXXXXXXXX"></div>
        <div class="field"><label>ইমেইল</label><input type="text" id="f_vemail" placeholder="name@email.com"></div>
      </div>
      <div class="field"><label>ওয়েবসাইট (ঐচ্ছিক)</label><input type="text" id="f_vweb" placeholder="https://..."></div>`,
    email: `
      <div class="field"><label>ইমেইল ঠিকানা</label><input type="text" id="f_eaddr" placeholder="someone@email.com"></div>
      <div class="field"><label>সাবজেক্ট (ঐচ্ছিক)</label><input type="text" id="f_esub" placeholder="বিষয়"></div>
      <div class="field"><label>মেসেজ (ঐচ্ছিক)</label><textarea id="f_ebody" placeholder="মেসেজ"></textarea></div>`,
    phone: `
      <div class="field"><label>ফোন নম্বর</label><input type="text" id="f_phone" placeholder="+8801XXXXXXXXX"></div>`,
    sms: `
      <div class="field"><label>ফোন নম্বর</label><input type="text" id="f_smsnum" placeholder="+8801XXXXXXXXX"></div>
      <div class="field"><label>মেসেজ (ঐচ্ছিক)</label><textarea id="f_smsmsg" placeholder="প্রি-ফিল করা মেসেজ"></textarea></div>`,
    event: `
      <div class="field"><label>ইভেন্টের নাম</label><input type="text" id="f_ename" placeholder="প্রোগ্রামের নাম"></div>
      <div class="row2">
        <div class="field"><label>শুরু</label><input type="datetime-local" id="f_estart"></div>
        <div class="field"><label>শেষ</label><input type="datetime-local" id="f_eend"></div>
      </div>
      <div class="field"><label>স্থান (ঐচ্ছিক)</label><input type="text" id="f_eloc" placeholder="ভেন্যু / ঠিকানা"></div>`
  };

  let currentType = 'url';
  const formArea = document.getElementById('formArea');
  const tabs = document.querySelectorAll('#typeTabs button');
  const box = document.getElementById('qrcode-box');
  const emptyState = document.getElementById('emptyState');
  const meta = document.getElementById('previewMeta');
  const downloadBtn = document.getElementById('downloadBtn');

  if (!formArea) return; // not on generator view

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // Builds a plain data object describing the QR content (not yet a link)
  function buildDataObject() {
    switch (currentType) {
      case 'url': {
        let u = val('f_url');
        if (!u) return null;
        if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
        return { u };
      }
      case 'text': {
        const txt = val('f_text');
        return txt ? { txt } : null;
      }
      case 'wifi': {
        const ssid = val('f_ssid'), pass = val('f_pass');
        const encEl = document.getElementById('f_enc');
        const enc = encEl ? encEl.value : 'WPA';
        return ssid ? { ssid, pass, enc } : null;
      }
      case 'vcard': {
        const name = val('f_name'), org = val('f_org'), phone = val('f_vphone'), email = val('f_vemail'), web = val('f_vweb');
        return (name || phone || email) ? { name, org, phone, email, web } : null;
      }
      case 'email': {
        const addr = val('f_eaddr');
        return addr ? { addr, sub: val('f_esub'), body: val('f_ebody') } : null;
      }
      case 'phone': {
        const num = val('f_phone');
        return num ? { num } : null;
      }
      case 'sms': {
        const num = val('f_smsnum');
        return num ? { num, msg: val('f_smsmsg') } : null;
      }
      case 'event': {
        const name = val('f_ename'), start = val('f_estart'), end = val('f_eend'), loc = val('f_eloc');
        return (name && start) ? { name, start, end: end || start, loc } : null;
      }
      default:
        return null;
    }
  }

  function renderForm(type) {
    formArea.innerHTML = forms[type];
    formArea.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', updateQR);
      el.addEventListener('change', updateQR);
    });
    updateQR();
  }

  function updateQR() {
    const dataObj = buildDataObject();
    box.innerHTML = '';
    if (!dataObj) {
      emptyState.style.display = 'block';
      meta.innerHTML = '';
      downloadBtn.disabled = true;
      return;
    }
    emptyState.style.display = 'none';
    const size = parseInt(document.getElementById('sizeSelect').value, 10);
    const fg = document.getElementById('fgColor').value;
    const bg = document.getElementById('bgColor').value;
    const ec = document.getElementById('ecSelect').value;
    const ecMap = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };

    const link = buildScanLink(currentType, dataObj);

    new QRCode(box, {
      text: link,
      width: Math.min(size, 260),
      height: Math.min(size, 260),
      colorDark: fg,
      colorLight: bg,
      correctLevel: ecMap[ec]
    });

    const shortLink = link.length > 60 ? link.slice(0, 60) + '…' : link;
    meta.innerHTML = `স্ক্যান করলে খুলবে: <br><b>${shortLink}</b>`;
    downloadBtn.disabled = false;
    downloadBtn.onclick = () => downloadHighRes(link, size, fg, bg, ec);
  }

  function downloadHighRes(link, size, fg, bg, ecKey) {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    const ecMap = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };
    new QRCode(tempDiv, { text: link, width: size, height: size, colorDark: fg, colorLight: bg, correctLevel: ecMap[ecKey] });
    setTimeout(() => {
      const canvas = tempDiv.querySelector('canvas');
      const dlLink = document.createElement('a');
      dlLink.download = 'qr-code.png';
      dlLink.href = canvas.toDataURL('image/png');
      dlLink.click();
      document.body.removeChild(tempDiv);
    }, 100);
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      renderForm(currentType);
    });
  });

  document.getElementById('fgColor').addEventListener('input', updateQR);
  document.getElementById('bgColor').addEventListener('input', updateQR);
  document.getElementById('sizeSelect').addEventListener('change', updateQR);
  document.getElementById('ecSelect').addEventListener('change', updateQR);

  renderForm(currentType);
});
