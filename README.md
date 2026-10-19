# Plegar Pro Plus — interfaz aprobada + editor 2D

Proyecto **Plegar Pro Plus**, desarrollado sobre `warks1/Plegar-Pro-Basic`.

La **pantalla Inicio conserva el diseño del boceto aprobado** (`assets/referencia-aprobada.webp`). Está adaptada visualmente a PC, tablet y smartphone. Sigue siendo un prototipo visual: la máquina y el utillaje del inicio son imágenes ilustrativas.

## Programación 2D (v0.2)

Abrir el menú **Programación 2D** para editar tramos, ángulos y orden de plegado. Se dibuja un perfil SVG de ejes. Es posible deshacer/rehacer, guardar localmente, importar y exportar archivos JSON de geometría.

Los datos se guardan únicamente en **este navegador**, sin servidor ni sincronización. Para respaldo/traspaso a otro dispositivo, exportar el JSON.

**NO usar los resultados del editor como desarrollo de corte o programa CNC.** El perfil de ejes y la secuencia visual no incluyen tolerancias, radios, compensaciones, fibra neutra, carga o colisiones verificadas.

## Archivos y pruebas

- `index.html`, `styles.css`, `app.js`: interfaz del boceto aprobado.
- `geometry2d.js`: geometría 2D y validación de datos (sin dependencias).
- `editor2d.js`, `editor2d.css`: interfaz del editor 2D.
- `sw.js`, `manifest.webmanifest`: base de instalación web (PWA experimental).
- `assets/`: imágenes del boceto.
- `tests/geometry2d.test.cjs`: pruebas numéricas (`node --test tests/geometry2d.test.cjs`).
- `tests/browser_check.py`: pruebas automatizadas en entorno de navegación restringida. No sustituye pruebas reales de URL/HTTPS.

Para visualizar: servir el directorio por HTTP, por ejemplo `python -m http.server 8000`, y abrir `http://localhost:8000` en un navegador autorizado. Para publicar en GitHub Pages, configurar `Settings → Pages → Deploy from a branch → main / root`.
