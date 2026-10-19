# Plegar Pro Plus — punto de recuperación v0.12

**Fecha:** 2026-10-19. **Repositorio:** https://github.com/warks1/Plegar-Pro-Basic

## Boceto oficial aprobado
Mantener **sin rediseñar** la pantalla de Inicio y sus paneles, colores e imágenes. Referencia: `assets/referencia-aprobada.webp`. Adaptar los módulos a PC, tablet y smartphone.

## Estado
- Programación 2D editable, tramos, ángulos y orden, deshacer, rehacer y JSON.
- Desarrollo orientativo (Ri, K, espesor), seguimiento 2D y primeros cribados.
- Visor 3D de chapa y utillaje paramétrico, giro/zoom y proximidad nominal entre volúmenes.
- v0.12: catálogo interno de 8 punzones + 21 matrices genéricas (referencias estables); etiquetas SIN VERIFICAR, dimensiones disponibles y origen interno. Alturas nominales seleccionadas conectadas a geometría 2D/3D.

## Límites técnicos
NO existe simulación física industrial ni validación CAD de colisiones. Las referencias genéricas no representan utillaje oficial, fuerzas, perfiles CAD completos, tolerancias ni alturas certificadas. No utilizar en producción.

## Próximo paso v0.13
Integrar únicamente fichas reales obtenidas de documentación dimensional y verificable. Registrar fabricante, SKU, fuente, fecha, versión, geometría y amarre. Mantener compatibilidad con datos anteriores, pruebas y diseño aprobado; publicar los cambios probados en la misma rama main.
