# Plegar Pro Plus v0.11 · Continuación de proyecto

Diseño de Inicio aprobado conservado, disponible en `assets/referencia-aprobada.webp`. La versión 0.11 añade un **cribado nominal 3D** entre tramos completados de chapa, punzón, matriz y tope como prismas extruidos; sus resultados NO son verificación CAD ni de seguridad.

## Uso

Abrir `index.html` desde un servidor HTTP local, por ejemplo: `python -m http.server 8000`. La aplicación es un prototipo responsive con demostraciones y almacenaje local; no genera programas CNC válidos para producción.

## Pruebas

- `node --test tests/*.test.cjs`
- `python tests/browser_check.py` (requiere Playwright y Chromium)

**Repositorio:** https://github.com/warks1/Plegar-Pro-Basic

**Continuación:** v0.12, catálogos de geometría con procedencia y revisión; ampliar criterios de colisiones reales sólo tras importar CAD dimensional verificado.
