'use strict';
(() => {
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  const themeMeta = document.getElementById('theme-color');
  const media = matchMedia('(prefers-color-scheme: dark)');
  const menuButton = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const gameFrame = document.getElementById('gameFrame');
  let toastTimer;
  function getSavedTheme() { try { return localStorage.getItem('mk-resume-theme') || localStorage.getItem('theme'); } catch (_) { return null; } }
  function syncGameTheme() { if (gameFrame.contentWindow) gameFrame.contentWindow.postMessage({ type: 'mk-theme', theme: root.dataset.theme }, '*'); }
  function applyTheme(theme, save = false) {
    root.dataset.theme = theme;
    themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    themeButton.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
    themeMeta.content = theme === 'dark' ? '#22231e' : '#f4f0e7';
    if (save) { try { localStorage.setItem('mk-resume-theme', theme); localStorage.setItem('theme', theme); } catch (_) {} }
    syncGameTheme();
  }
  applyTheme(root.dataset.theme || (media.matches ? 'dark' : 'light'));
  themeButton.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  media.addEventListener('change', e => { if (!getSavedTheme()) applyTheme(e.matches ? 'dark' : 'light'); });
  gameFrame.addEventListener('load', syncGameTheme);
  function setMenu(open) { mobileMenu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); menuButton.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu'); }
  menuButton.addEventListener('click', () => setMenu(mobileMenu.hidden));
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', e => { if (!mobileMenu.hidden && !e.target.closest('.site-header')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); menuButton.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  function toast(text) { const el = document.getElementById('toast'); el.textContent = text; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3800); }
  function openDialog(dialog) { setMenu(false); document.querySelectorAll('dialog[open]').forEach(d => d.close()); dialog.showModal(); document.body.classList.add('has-dialog'); }
  function closeDialog(dialog) { dialog.close(); if (!document.querySelector('dialog[open]')) document.body.classList.remove('has-dialog'); }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', e => { e.preventDefault(); closeDialog(dialog); });
    dialog.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => closeDialog(dialog)));
    dialog.addEventListener('click', e => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(dialog); });
    dialog.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) document.body.classList.remove('has-dialog'); });
  });
  window.ResumeUI = { openDialog, closeDialog, toast };
  const gameButtons = [...document.querySelectorAll('[data-open-game]')];
  const gameDialog = document.getElementById('gameModal');
  function openEmbeddedGame() {
    try {
      if (!gameFrame.dataset.initialized) {
        const source = document.getElementById('mk-game-source');
        if (!source) throw new Error('Embedded game is missing');
        const gameHtml = JSON.parse(source.textContent);
        if (typeof gameHtml !== 'string' || !gameHtml.includes('id="board"')) throw new Error('Invalid embedded game');
        gameFrame.srcdoc = gameHtml;
        gameFrame.dataset.initialized = 'true';
      }
      openDialog(gameDialog);
      gameButtons.forEach(button => button.setAttribute('aria-expanded', 'true'));
      syncGameTheme();
    } catch (_) {
      toast('Не удалось открыть игру. Обновите страницу или замените index.html из нового архива.');
    }
  }
  gameButtons.forEach(button => button.addEventListener('click', openEmbeddedGame));
  gameDialog.addEventListener('close', () => gameButtons.forEach(button => button.setAttribute('aria-expanded', 'false')));
  window.addEventListener('message', e => { if (e.source !== gameFrame.contentWindow) return; if (e.data?.type === 'mk-close-game') closeDialog(document.getElementById('gameModal')); if (e.data?.type === 'mk-game-ready') syncGameTheme(); });
  const screenshotButton = document.getElementById('openAgentScreenshot');
  screenshotButton.addEventListener('click', () => { const dialog = document.getElementById('agentScreenshotModal'); const image = dialog.querySelector('img'); if (!image.getAttribute('src')) image.src = image.dataset.src; openDialog(dialog); });
  // Если файлы пока не скопированы, показываем типографику и схему вместо битых изображений.
  // Имена face.jpg, output.webp и resume.pdf остаются прежними.
  document.querySelectorAll('[data-optional-image]').forEach(image => {
    const loaded = () => { image.hidden = false; image.classList.add('is-loaded'); if (image.closest('.portrait-media')) image.previousElementSibling.hidden = true; if (image.closest('.project-screenshot')) { screenshotButton.hidden = false; document.getElementById('agentMap').hidden = true; } };
    const failed = () => { image.hidden = true; if (image.closest('.project-screenshot')) { screenshotButton.hidden = true; document.getElementById('agentMap').hidden = false; } };
    image.addEventListener('load', loaded);
    image.addEventListener('error', failed);
    image.loading = 'eager';
    if (image.complete) image.naturalWidth ? loaded() : failed();
  });
  const emailButton = document.getElementById('copy-email');
  emailButton.addEventListener('click', async () => {
    const text = 'maks_k77@mail.ru';
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else { const field = document.createElement('textarea'); field.value = text; field.setAttribute('readonly', ''); field.style.cssText = 'position:fixed;top:0;left:-9999px'; document.body.appendChild(field); field.select(); const ok = document.execCommand('copy'); field.remove(); emailButton.focus(); if (!ok) throw new Error('Clipboard unavailable'); }
      toast('Email скопирован');
    } catch (_) { toast('Email: ' + text + ' — выделите и скопируйте адрес'); }
  });
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const sections = navLinks.map(a => document.querySelector(a.hash));
  const progress = document.getElementById('progressBar');
  let scheduled = false;
  function updateScroll() {
    const total = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? Math.min(1, Math.max(0, scrollY / total)) : 0})`;
    let active = '';
    sections.forEach(section => { if (section.getBoundingClientRect().top <= 180) active = section.id; });
    if (document.getElementById('contacts').getBoundingClientRect().top <= 180) active = '';
    navLinks.forEach(link => { if (link.hash === '#' + active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    scheduled = false;
  }
  addEventListener('scroll', () => { if (!scheduled) { requestAnimationFrame(updateScroll); scheduled = true; } }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();
})();
