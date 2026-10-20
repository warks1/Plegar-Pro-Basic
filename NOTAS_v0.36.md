# Plegar Pro Plus v0.36 — Actualización fiable de GitHub Pages

## Corrección
- El antiguo `sw.js` respondía las navegaciones con **HTML de caché primero**, por lo que móviles y tablets podían seguir viendo la versión anterior tras un despliegue correcto.
- `sw.js` usa ahora **red primero para navegación/`index.html`** y copia offline como respaldo si no hay conexión.
- Los recursos locales precargados siguen funcionando offline, con caché identificada como `plegar-pro-forming2d-v36` y limpieza de versiones anteriores.
- El servicio no almacena automáticamente los PDF de los clientes ni descargas ajenas al conjunto local de recursos precargados.
- `app.js` registra el service worker con `updateViaCache: 'none'` y solicita una comprobación de actualización; **no recarga a la fuerza** para no perder formularios ni planos en edición.

## Comprobaciones
- `node --test tests/*.test.cjs`: **209 pruebas superadas**; se incluyen cuatro nuevas pruebas con un service worker simulado para red, caché, modo sin conexión y archivos PDF.
- `python tests/splash-responsive-check.py`: diez tamaños/orientaciones, sin recortes detectados en el marco de la prueba; la pantalla de carga y el botón de omitir permanecen como en v0.35.
- `python tests/browser_check.py`: navegación comprobada en PC, tablet y móviles 390/320 px sin errores JS ni desplazamientos horizontales detectados.

## Conservación
- Sin cambios en `index.html`, `styles.css`, `splash.css`, `splash.js`, imágenes aprobadas, utillaje, simulación o los PDF de Trenirtrade.
- La animación sigue siendo ilustrativa. No corresponde a una certificación CNC o de colisiones.
- No se ha probado físicamente en el teléfono del usuario; las pruebas se realizaron con Chromium y resoluciones simuladas.
