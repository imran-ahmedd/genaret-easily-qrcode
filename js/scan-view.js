// ==========================================================
// Tech Verse QR — scan-view.js
// Runs when someone scans a generated QR and lands on
// index.html?view=scan&t=<type>&d=<data>
// Renders a branded card on this domain with the decoded
// info and a relevant action button.
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  if (params.get('view') !== 'scan') return;

  showView('scan');

  const root = document.getElementById('scanContent');
  if (!root) return;

  const type = params.get('t');
  const d = params.get('d');

  let data;
  try {
    data = decodeData(d);
  } catch (e) {
    root.innerHTML = `<div class="scan-error">লিংকটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।</div>`;
    return;
  }

  const typeLabels = {
    url: 'ওয়েবসাইট লিংক', text: 'টেক্সট মেসেজ', wifi: 'WiFi নেটওয়ার্ক',
    vcard: 'কন্টাক্ট কার্ড', email: 'ইমেইল', phone: 'ফোন নম্বর',
    sms: 'SMS মেসেজ', event: 'ইভেন্ট'
  };
  const typeIcon = {
    url: '🔗', text: 'Aa', wifi: '📶', vcard: '👤', email: '✉️', phone: '📞', sms: '💬', event: '📅'
  };

  function row(k, v, copyable) {
    if (!v) return '';
    return `<div class="scan-detail-row">
      <span class="k">${k}</span>
      <span class="v">${escapeHtml(v)}</span>
      ${copyable ? `<button class="copy-btn" data-copy="${escapeHtml(v)}">কপি</button>` : ''}
    </div>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  let title = '', sub = '', detailsHtml = '', actionsHtml = '';

  switch (type) {
    case 'url':
      title = 'একটি লিংক শেয়ার করা হয়েছে';
      sub = data.u;
      actionsHtml = `<a class="btn btn-primary" href="${escapeHtml(data.u)}" target="_blank" rel="noopener">লিংকে যান →</a>`;
      break;

    case 'text':
      title = 'একটি বার্তা';
      detailsHtml = `<div class="scan-detail-row" style="text-align:left; display:block;"><span class="v" style="text-align:left; white-space:pre-wrap;">${escapeHtml(data.txt)}</span></div>`;
      actionsHtml = `<button class="btn btn-outline" id="copyTextBtn">টেক্সট কপি করুন</button>`;
      break;

    case 'wifi':
      title = data.ssid;
      sub = 'এই WiFi নেটওয়ার্কে কানেক্ট করুন';
      detailsHtml = row('SSID', data.ssid) + row('পাসওয়ার্ড', data.pass, true) + row('এনক্রিপশন', data.enc);
      actionsHtml = `<p class="scan-note">Wi-Fi সেটিংসে গিয়ে এই নেটওয়ার্ক নাম বেছে নিয়ে উপরের পাসওয়ার্ড কপি করে বসান।</p>`;
      break;

    case 'vcard':
      title = data.name || 'কন্টাক্ট';
      sub = data.org || '';
      detailsHtml = row('ফোন', data.phone) + row('ইমেইল', data.email) + row('ওয়েবসাইট', data.web);
      actionsHtml = `<button class="btn btn-primary" id="saveVcfBtn">কন্টাক্ট সেভ করুন</button>`;
      break;

    case 'email':
      title = data.addr;
      sub = data.sub || 'ইমেইল পাঠান';
      detailsHtml = row('প্রাপক', data.addr) + row('সাবজেক্ট', data.sub) + (data.body ? row('মেসেজ', data.body) : '');
      actionsHtml = `<a class="btn btn-primary" href="mailto:${escapeHtml(data.addr)}?subject=${encodeURIComponent(data.sub||'')}&body=${encodeURIComponent(data.body||'')}">ইমেইল পাঠান →</a>`;
      break;

    case 'phone':
      title = data.num;
      sub = 'এই নম্বরে কল করুন';
      actionsHtml = `<a class="btn btn-primary" href="tel:${escapeHtml(data.num)}">কল করুন →</a>`;
      break;

    case 'sms':
      title = data.num;
      sub = 'SMS পাঠান';
      detailsHtml = data.msg ? row('মেসেজ', data.msg) : '';
      actionsHtml = `<a class="btn btn-primary" href="sms:${escapeHtml(data.num)}?body=${encodeURIComponent(data.msg||'')}">মেসেজ পাঠান →</a>`;
      break;

    case 'event':
      title = data.name;
      sub = formatDateRange(data.start, data.end);
      detailsHtml = row('শুরু', formatDate(data.start)) + row('শেষ', formatDate(data.end)) + row('স্থান', data.loc);
      actionsHtml = `<button class="btn btn-primary" id="saveIcsBtn">ক্যালেন্ডারে যোগ করুন</button>`;
      break;

    default:
      root.innerHTML = `<div class="scan-error">এই QR কোডের ধরন শনাক্ত করা যায়নি।</div>`;
      return;
  }

  root.innerHTML = `
    <div class="scan-badge">
      <div class="logo-mark"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
      Tech Verse QR · ${location.hostname}
    </div>
    <div class="scan-type-icon">${typeIcon[type] || 'QR'}</div>
    <h1>${escapeHtml(title || '')}</h1>
    ${sub ? `<div class="scan-sub">${escapeHtml(sub)}</div>` : ''}
    ${detailsHtml ? `<div class="scan-detail-list">${detailsHtml}</div>` : ''}
    <div class="scan-actions">${actionsHtml}</div>
    <div class="scan-note">এই তথ্যটি সরাসরি QR কোড থেকে এসেছে — Tech Verse QR এটি কোনো সার্ভারে সংরক্ষণ করে না।</div>
  `;

  // wire up dynamic buttons
  root.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => copyToClipboard(btn.dataset.copy, btn));
  });
  const copyTextBtn = document.getElementById('copyTextBtn');
  if (copyTextBtn) copyTextBtn.addEventListener('click', () => copyToClipboard(data.txt, copyTextBtn));

  const saveVcfBtn = document.getElementById('saveVcfBtn');
  if (saveVcfBtn) saveVcfBtn.addEventListener('click', () => downloadVcf(data));

  const saveIcsBtn = document.getElementById('saveIcsBtn');
  if (saveIcsBtn) saveIcsBtn.addEventListener('click', () => downloadIcs(data));

  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'কপি হয়েছে ✓';
      setTimeout(() => { btn.textContent = original; }, 1500);
    });
  }

  function downloadVcf(d) {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:${d.name||''}\nORG:${d.org||''}\nTEL:${d.phone||''}\nEMAIL:${d.email||''}\nURL:${d.web||''}\nEND:VCARD`;
    triggerDownload(vcf, 'contact.vcf', 'text/vcard');
  }

  function downloadIcs(d) {
    const fmt = s => s.replace(/[-:]/g, '') + '00';
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${d.name||''}\nDTSTART:${fmt(d.start)}\nDTEND:${fmt(d.end)}\nLOCATION:${d.loc||''}\nEND:VEVENT\nEND:VCALENDAR`;
    triggerDownload(ics, 'event.ics', 'text/calendar');
  }

  function triggerDownload(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(s) {
    if (!s) return '';
    try {
      return new Date(s).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) { return s; }
  }

  function formatDateRange(start, end) {
    return formatDate(start) + (end && end !== start ? ' – ' + formatDate(end) : '');
  }
});
