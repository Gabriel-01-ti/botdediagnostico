/* Comportamentos de interface, sem alterar autenticação ou diagnóstico. */
(() => {
  if (document.body.classList.contains('home-page')) {
    window.showAuth = () => {
      document.body.dataset.view = 'auth';
      document.getElementById('welcomeView').style.display = 'none';
      document.getElementById('auth').style.display = 'block';
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('illustrationArea').style.display = 'block';
      document.getElementById('mainHeroContainer').classList.remove('dashboard-active');
    };
    for (const [name, id, display] of [
      ['openContact','contactModal','flex'],['closeContact','contactModal','none'],
      ['openProfileModal','profileModal','flex'],['closeProfileModal','profileModal','none']
    ]) window[name] = () => { document.getElementById(id).style.display = display; };
    window.setAuthStatus = (message, kind = 'info') => {
      const status = document.getElementById('authStatus');
      status.textContent = message; status.dataset.kind = kind; status.hidden = !message;
    };
    const routeHash = () => {
      if (location.hash === '#entrar') window.showAuth();
      if (location.hash === '#contato') window.openContact();
      if (location.hash === '#historico') {
        if (window.verDiagnosticos) document.dispatchEvent(new Event('agro:history'));
        else window.showAuth();
      }
    };
    routeHash();
    window.addEventListener('hashchange', routeHash);
  }
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-navigation');
  const closeNav = () => { toggle?.setAttribute('aria-expanded', 'false'); nav?.classList.remove('is-open'); };
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open);
  });
  nav?.addEventListener('click', event => { if (event.target.closest('a, .perfil-topo')) closeNav(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) { closeNav(); toggle.focus(); }
  });
  // O splash é apenas apresentação e não bloqueia a navegação se uma biblioteca falhar.
  const hideSplash = () => { const splash = document.getElementById('splash'); if (splash) splash.hidden = true; };
  if (document.readyState === 'complete') hideSplash();
  else window.addEventListener('load', hideSplash, {once:true});
  setTimeout(hideSplash, 4000);
  const confirmation = document.getElementById('confirmPassword');
  const confirmGroup = document.getElementById('confirmGroup');
  if (confirmation && confirmGroup) {
    new MutationObserver(() => {
      confirmation.required = confirmGroup.style.display !== 'none';
      document.getElementById('password').autocomplete = confirmation.required ? 'new-password' : 'current-password';
    }).observe(confirmGroup, {attributes:true, attributeFilter:['style']});
  }
  document.querySelectorAll('.password-toggle').forEach(button => button.addEventListener('click', () => {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-pressed', String(input.type === 'text'));
  }));
  const photo = document.getElementById('foto');
  const preview = document.getElementById('upload-preview');
  let previewUrl;
  const updatePreview = () => {
    if (!preview || !photo) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const file = photo.files[0];
    if (!file || !file.type.startsWith('image/')) { preview.removeAttribute('src'); preview.hidden = true; return; }
    previewUrl = URL.createObjectURL(file); preview.src = previewUrl; preview.hidden = false;
  };
  photo?.addEventListener('change', updatePreview);
  document.querySelector('.file-dropzone')?.addEventListener('drop', () => setTimeout(updatePreview, 0));
  document.querySelector('.btn-reiniciar')?.addEventListener('click', updatePreview);
  const result = document.getElementById('resultado');
  const analyze = document.getElementById('analyzeBtn');
  if (result && analyze) new MutationObserver(() => {
    const loading = !!result.querySelector('.info,.analisando');
    result.setAttribute('aria-busy', String(loading));
    analyze.disabled = loading;
    analyze.textContent = loading ? 'Aguarde…' : 'Analisar planta';
  }).observe(result, {childList:true,subtree:true});
  const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select,[tabindex="0"]';
  const panels = [...document.querySelectorAll('#contactModal,#profileModal,#historicoModal,#guia-menu,#info-menu')];
  let activePanel = null;
  let previousFocus = null;
  const isOpen = panel => getComputedStyle(panel).display !== 'none';
  const close = panel => {
    if (panel.id.endsWith('Modal')) panel.style.display = 'none';
    else panel.classList.add('hidden');
  };
  panels.forEach(panel => {
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', ({contactModal:'Contato', profileModal:'Sua conta', historicoModal:'Histórico de diagnósticos', 'guia-menu':'Guia da lavoura', 'info-menu':'Sobre o diagnóstico'})[panel.id]);
    panel.tabIndex = -1;
    panel.querySelectorAll('span[onclick]').forEach(element => {
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', 'Fechar janela');
      element.tabIndex = 0;
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); element.click(); }
      });
    });
    panel.addEventListener('click', event => { if (event.target === panel && panel.id.endsWith('Modal')) close(panel); });
    new MutationObserver(() => {
      const open = isOpen(panel);
      const trigger = document.getElementById(panel.id === 'guia-menu' ? 'floating-guia-btn' : 'floating-info-btn');
      if (!panel.id.endsWith('Modal') && trigger) trigger.setAttribute('aria-expanded', String(open));
      if (open && activePanel !== panel) {
        if (activePanel) close(activePanel);
        previousFocus = document.activeElement;
        activePanel = panel;
        (panel.querySelector(focusable) || panel).focus({preventScroll:true});
      } else if (!open && activePanel === panel) {
        activePanel = null;
        previousFocus?.focus({preventScroll:true});
      }
    }).observe(panel, {attributes:true, attributeFilter:['style','class']});
  });
  document.addEventListener('keydown', event => {
    if (!activePanel) return;
    if (event.key === 'Escape') { close(activePanel); return; }
    if (event.key !== 'Tab') return;
    const items = [...activePanel.querySelectorAll(focusable)].filter(el => el.getClientRects().length);
    const first = items[0], last = items.at(-1);
    if (!first) { event.preventDefault(); activePanel.focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.querySelector('.file-dropzone')?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); document.getElementById('foto').click(); }
  });
  document.querySelectorAll('.home-page a[href="#"]').forEach(link => link.addEventListener('click', event => event.preventDefault()));
  document.querySelectorAll('.perfil-topo,.home-page span[onclick]').forEach(element => {
    if (element.closest('[role="dialog"]')) return;
    element.tabIndex = 0;
    element.setAttribute('role', 'button');
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); element.click(); }
    });
  });
})();
