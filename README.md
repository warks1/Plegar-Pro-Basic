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
Boceto proporcionado por la conversación del usuario. Versión de interfaz técnica: prototipo publicado en este repositorio GitHub.
