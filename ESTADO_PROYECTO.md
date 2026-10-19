# Plegar Pro Plus — Punto de recuperación v0.14

- Fecha: 2026-10-19.
- Repositorio oficial: https://github.com/warks1/Plegar-Pro-Basic
- Rama: `main`.
- Última versión de trabajo: **v0.14** (guardar el commit final de esta versión en el historial de GitHub).
- Boceto original aprobado, sin rediseñar Inicio: `assets/referencia-aprobada.webp`.
- La interfaz de Inicio y estilos globales `styles.css`, `app.js` y recursos `assets/` deben permanecer intactos salvo petición expresa.
- Misma funcionalidad prevista para PC/tablet/smartphone con interfaz adaptativa.

## Lo existente

- v0.2–v0.3: programación 2D editable, secuencia, guardado/JSON y desarrollo orientativo.
- v0.4–v0.7: seguimiento 2D de punzón/matriz/chapa/tope X, radios ilustrativos y avisos de geometría 2D.
- v0.8–v0.11: visor SVG con geometría extruida nominal 3D, perfiles de herramientas genéricas y aproximación de proximidades.
- v0.12: catálogo interno de 8 punzones y 21 matrices sin verificar.
- v0.13: 5 referencias oficiales AMADA y 4 catálogos públicos, para consulta, no para selección CAD validada.
- **v0.14:** importar una sola LWPOLYLINE DXF ASCII 2D para **inspección**, con vista previa, escala/unidades, validación de contorno, cotas y comparación indicativa con ficha de fabricante. No activa geometría en simulación ni CNC.

## Advertencias

El motor de plegado es una representación geométrica de investigación: cálculos de desarrollo y colisiones **no están validados** para fabricación, CNC o seguridad de operadores. Las referencias dimensionales publicadas no bastan para reconstruir un utillaje real con garantías.

## Próximos pasos

- v0.15: incorporar soporte seguro de más entidades DXF y varias capas, agrupación por contorno y orientación explícita; conservar trazabilidad por fuente y versiones.
- Preparar carga opcional, revisada y contrastada de geometrías CAD de utillaje en el motor 3D, nunca por coincidencia de dimensiones solamente.
- Verificar en GitHub Pages la ejecución real, incluido refresco de caché PWA, después de cada commit.

Para continuar, comprobar primero el último commit de GitHub y ejecutar las pruebas. No cambiar ni reemplazar el boceto aprobado.
