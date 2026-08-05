// ==========================================================
// Tech Verse QR — main.js
// Handles view routing (home / generator / about / scan),
// mobile nav toggle, footer year, hero grid animation.
// ==========================================================

function showView(name) {
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === 'view-' + name);
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.view === name);
  });
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

document.addEventListener('DOMContentLoaded', () => {
  // ---- mobile nav toggle ----
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // ---- nav link routing ----
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      links && links.classList.remove('open');
      const view = el.dataset.view;
      history.pushState({}, '', '#' + view);
      showView(view);
    });
  });

  window.addEventListener('popstate', () => {
    const hash = location.hash.replace('#', '') || 'home';
    if (hash !== 'scan') showView(hash);
  });

  // ---- footer year ----
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- hero animated grid ----
  const heroGrid = document.getElementById('heroGrid');
  if (heroGrid) {
    for (let i = 0; i < 81; i++) {
      const cell = document.createElement('span');
      cell.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
      heroGrid.appendChild(cell);
    }
  }

  // ---- initial route ----
  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'scan') {
    // handled by scan-view.js — it calls showView('scan') itself
    return;
  }
  const initialHash = location.hash.replace('#', '') || 'home';
  showView(['home', 'generator', 'about'].includes(initialHash) ? initialHash : 'home');
});
