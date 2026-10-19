# Plegar Pro — Primera interfaz navegable (v1)

## Alcance
Prototipo de interfaz visual basado en la **imagen aprobada por el usuario** (incluida en `assets/referencia-aprobada.webp`). Diseño responsive para ordenador, tablet y teléfono, con las mismas áreas de navegación.

**No** es una aplicación CAD/CAM terminada; **no** reproduce la física de plegado, no conecta máquinas y **no** calcula desarrollos o fuerzas validadas. Las imágenes de máquina, herramientas y geometría proceden del boceto de referencia, por lo que sirven como recursos ilustrativos, no como geometrías certificadas.

## Uso
1. Descomprime la carpeta completa.
2. Abre `index.html` en un navegador moderno. La navegación y los controles básicos funcionan sin conexión.
3. Para probar instalación PWA/offline mediante service worker, usa un servidor web en `localhost` o HTTPS: `python -m http.server 8080` y navega a `http://localhost:8080`.
4. En tablet o móvil, el menú se despliega desde la parte superior y se incorpora navegación inferior.

## Interacciones listas
- Navegación por módulos.
- Menú lateral responsive (modal en tablet y móvil).
- Secuenciador de 6 pasos con reproducción, pausa, selector y velocidad ilustrativos.
- Zoom visual de la fotografía de plegadora.
- Pestañas y selección de utillaje.
- Lista de proyectos de ejemplo, alta local de un proyecto y selección de materiales de ejemplo.
- Acceso rápido por búsqueda de módulos, Ctrl/Cmd+K.
- Rotación/zoom de la *imagen* de la pieza (no del CAD real).
- Maximizar/minimizar panel de máquina.

## Siguiente fase de ingeniería
Separar la interfaz en componentes React/TypeScript; integrar un motor CAD real, geometría compartida y validación de cálculos, importar utillaje dimensional real, pruebas de colisión, almacenamiento robusto y empaquetadores de aplicaciones para Microsoft Store / App Store / Google Play. Ninguno de estos pasos se considera realizado en esta entrega.

## Estructura
- `index.html`: estructura semántica de la interfaz.
- `styles.css`: identidad visual + reglas PC/tablet/móvil.
- `app.js`: interacciones de prototipo y datos locales demostrativos.
- `assets/`: imágenes recortadas exclusivamente del boceto aprobado, referencia íntegra e icono.
- `manifest.webmanifest` / `sw.js`: base PWA (requiere HTTP/HTTPS para SW).

## Copyright
Boceto proporcionado por la conversación del usuario. Versión de interfaz técnica: prototipo, sin conexión con GitHub.

## Avance v0.2 — Programación 2D editable (19-10-2026)

Se ha conservado sin rediseño la pantalla de Inicio aprobada. El módulo «Programación 2D» incluye ahora:

- Edición de tramos rectos (2 a 24; longitudes en milímetros) y ángulos firmados en las uniones (de -179° a +179°).
- Perfil 2D vectorial SVG con vértices numerados y cotas de ejes ilustrativas.
- Orden de plegado independiente de la geometría, con selección, adelantar y retrasar.
- Deshacer/rehacer de hasta 50 operaciones.
- Guardado local en el navegador, exportación e importación de archivo JSON validado.
- Adaptación de editor para PC, tablet y móviles, conservando la identidad visual existente.

**Advertencia de ingeniería:** este editor solamente muestra la polilínea de los ejes definidos. La suma de sus tramos **no es el desarrollo de corte**; tampoco calcula radio interior real, K, recuperación elástica, tonelaje, colisiones, mecanizado, ni sincroniza una máquina. La secuencia es una preferencia ordenada, no una secuencia segura/certificada.

**Pruebas:** `node --test tests/geometry2d.test.cjs` valida geometría y entradas. `python tests/browser_check.py` verifica navegación, edición, deshacer, rehacer, reordenación, guardado local y ausencia de desbordamiento horizontal en vistas 1440×900, 820×1180, 390×844 y 320×720. El navegador del entorno bloquea abrir URL locales; por eso la comprobación DOM carga HTML/CSS/JS directamente y emula `localStorage`. Falta probar la URL real de Pages, el service worker en origen HTTPS y navegadores móviles físicos.


## v0.10
Coloreado de estados de tramos en Simulación 3D y auditoría orientativa con distancias exclusivamente 2D. Véase README.md; no se valida ningún sólido real.
