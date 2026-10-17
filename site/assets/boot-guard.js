(() => {
  const rootId = 'root';
  let shown = false;

  const isLoading = (root) => root && root.querySelector('.startup-splash, .module-loader, [aria-busy="true"]');

  const showFailure = (reason, force = false) => {
    if (shown) return;
    const root = document.getElementById(rootId);
    if (!root) return;

    const loading = isLoading(root);
    const mounted = root.querySelector('.app-shell');
    if (!force && mounted && !loading) return;
    if (!force && root.childElementCount > 0 && root.textContent.trim() && !loading) return;

    shown = true;
    root.replaceChildren();
    const panel = document.createElement('main');
    panel.setAttribute('role', 'alert');
    panel.style.cssText = 'box-sizing:border-box;min-height:100vh;padding:24px;display:flex;align-items:center;justify-content:center;background:#eef3f8;color:#172536;font:16px system-ui,sans-serif';
    const card = document.createElement('section');
    card.style.cssText = 'max-width:720px;width:100%;padding:28px;border:1px solid #ccd6e1;border-radius:14px;background:#fff;box-shadow:0 12px 36px #17253612';
    const title = document.createElement('h1');
    title.textContent = 'Plegar Pro no ha podido iniciar';
    title.style.cssText = 'margin:0 0 12px;font-size:24px';
    const message = document.createElement('p');
    message.textContent = 'El arranque de la aplicación se ha detenido. Copia el mensaje técnico que aparece abajo para identificar el recurso o módulo que falla.';
    const detail = document.createElement('pre');
    detail.textContent = String(reason || 'La interfaz no se ha montado a tiempo').slice(0, 1600);
    detail.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;background:#f3f6f9;border-radius:8px;font-size:13px';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap';
    const reload = document.createElement('button');
    reload.type = 'button';
    reload.textContent = 'Recargar aplicación';
    reload.style.cssText = 'padding:10px 16px;border:0;border-radius:8px;background:#087eae;color:white;font-weight:600;cursor:pointer';
    reload.addEventListener('click', () => location.reload());
    const home = document.createElement('button');
    home.type = 'button';
    home.textContent = 'Volver a Inicio';
    home.style.cssText = 'padding:10px 16px;border:1px solid #ccd6e1;border-radius:8px;background:#fff;color:#172536;font-weight:600;cursor:pointer';
    home.addEventListener('click', () => { location.href = document.querySelector('base')?.href || './'; });
    actions.append(reload, home);
    card.append(title, message, detail, actions);
    panel.append(card);
    root.append(panel);
  };

  window.addEventListener('error', (event) => {
    const target = event.target;
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      showFailure('No se pudo cargar el recurso: ' + (target.src || target.href || target.tagName), true);
    } else if (event.message) {
      showFailure(event.message + (event.filename ? ' — ' + event.filename + ':' + event.lineno : ''), true);
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason && (event.reason.stack || event.reason.message) || event.reason;
    showFailure(reason || 'Error asíncrono no identificado', false);
  });

  window.setTimeout(() => {
    const root = document.getElementById(rootId);
    if (!root) {
      showFailure('No se ha encontrado el contenedor #root');
      return;
    }
    const loading = isLoading(root);
    if (!root.textContent.trim() || loading) {
      const label = loading?.className || 'pantalla vacía';
      showFailure('Arranque bloqueado tras 15 segundos (' + label + '). Revisa la carga de JavaScript y los módulos de inicio.', true);
    }
  }, 15000);
})();