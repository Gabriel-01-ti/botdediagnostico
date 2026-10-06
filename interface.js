/* Comportamentos de interface, sem alterar autenticação ou diagnóstico. */
(() => {
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
