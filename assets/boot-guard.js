(() => {
  const rootId = 'root';
  let shown = false;
  const showFailure = (reason) => {
    if (shown) return;
    const root = document.getElementById(rootId);
    if (!root || (root.childElementCount > 0 && root.textContent.trim())) return;
    shown = true;
    root.innerHTML = '';
    const panel = document.createElement('main');
    panel.setAttribute('role', 'alert');
    panel.style.cssText = 'box-sizing:border-box;min-height:100vh;padding:32px;display:flex;align-items:center;justify-content:center;background:#eef3f8;color:#172536;font:16px system-ui,sans-serif';
    const card = document.createElement('section');
    card.style.cssText = 'max-width:680px;width:100%;padding:28px;border:1px solid #ccd6e1;border-radius:14px;background:#fff;box-shadow:0 12px 36px #17253612';
    const title = document.createElement('h1');
    title.textContent = 'Plegar Pro no ha podido iniciar';
    title.style.cssText = 'margin:0 0 12px;font-size:24px';
    const message = document.createElement('p');
    message.textContent = 'La página ha detectado un error de carga. Recarga una vez; si persiste, comparte este mensaje técnico para localizar el archivo que falla.';
    const detail = document.createElement('pre');
    detail.textContent = String(reason || 'La interfaz no se ha montado a tiempo').slice(0,1200);
    detail.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;background:#f3f6f9;border-radius:8px;font-size:13px';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Recargar aplicación';
    button.style.cssText = 'padding:10px 16px;border:0;border-radius:8px;background:#087eae;color:white;font-weight:600;cursor:pointer';
    button.addEventListener('click', () => location.reload());
    card.append(title,message,detail,button);
    panel.append(card);
    root.append(panel);
  };
  window.addEventListener('error', (event) => {
    const target = event.target;
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      showFailure('No se pudo cargar el recurso: ' + (target.src || target.href || target.tagName));
    } else if (event.message) {
      showFailure(event.message + (event.filename ? ' — ' + event.filename + ':' + event.lineno : ''));
    }
  }, true);
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason && (event.reason.stack || event.reason.message) || event.reason;
    showFailure(reason || 'Error asíncrono no identificado');
  });
  window.setTimeout(() => {
    const root = document.getElementById(rootId);
    if (root && !root.textContent.trim()) showFailure('La interfaz no se ha montado tras 12 segundos. Comprueba la publicación y las rutas de los archivos.');
  }, 12000);
})();