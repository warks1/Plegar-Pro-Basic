# Notas v0.22 — Auditoría de cruces DXF

- Nueva auditoría aislada: cruces interior-interior, uniones T, solapes colineales, proximidades bajo tolerancia nominal.
- Comparación por capas opcional. Casos limitados para evitar bloquear móviles: hasta 1600 segmentos y 60000 pares; los límites se muestran como análisis PARCIAL.
- Informe JSON con origen SHA-256 si se dispone de él, ejemplos, incidencias y bloqueos de fabricación/seguridad.
- DXF de ejemplo con dos segmentos cruzados.
- Sin cambios en el diseño Inicio ni en los parámetros de simulación/útiles.
- 159 pruebas Node y pruebas Playwright en 1440/820/390/320 px.

Limitaciones: curvas discretizadas, no hay reconstrucción CAD de sólidos ni validación de amarre, interferencias o CNC.
