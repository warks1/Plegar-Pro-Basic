# Plegar Pro Plus — Punto de continuidad v0.20

**Fecha:** 2026-10-19  
**Repositorio:** https://github.com/warks1/Plegar-Pro-Basic  
**Rama:** `main` (verificar el SHA antes de nuevos cambios).  
**Interfaz oficial:** el boceto aprobado en `assets/referencia-aprobada.webp`; **no rediseñar** Inicio sin aprobación expresa.

## Capacidades actuales

- Editor de Programación 2D: medidas, ángulos, orden, guardar/importar JSON, deshacer/rehacer y desarrollo estimado.
- Seguimiento de pliegues en 2D y primer visor geométrico 3D con chapa, punzón/matriz y tope genéricos. Colisiones y holguras **aproximadas**.
- Utillaje genérico e información documental de fabricante con fuente y estado verificado/no verificado diferenciados.
- Importador DXF 2D ASCII de LINE, LWPOLYLINE, ARC, CIRCLE y bulges: capas, contornos, cotas, orientación, comparación de dimensiones, informes JSON/CSV. No importa DXF como máquina/útil activo.
- Auditoría **nominal** de planos de montaje; sin aceptación CNC ni colisiones reales.
- Registro voluntario local de **metadatos** de archivos DXF usando SHA-256 de los bytes; no almacena el archivo.
- **v0.20:** `cad-topology.js` añade conteo de contornos abiertos/cerrados, extremos cercanos en capas, anidamientos posibles y relaciones ambiguas. `cad-topology-view.js` presenta los hallazgos y referencias A–B calculadas de la envolvente orientada. Exporta JSON con bloqueos de simulación/CNC.

## Restricciones de seguridad y alcance

Ninguna comparación dimensional o topológica valida el montaje físico, la identidad del útil, su estabilidad, las colisiones de CAD sólido ni la seguridad de una plegadora. Los contornos no se unen, los anillos internos no se interpretan como huecos de corte y no se generan programas de fabricación.

## Pruebas y continuación

- 139 pruebas automáticas Node y Playwright en 1440, 820, 390, 320 px sin errores ni desbordamientos detectados en entorno de pruebas.
- **GitHub Pages:** verificar el workflow para este nuevo commit después de publicarlo; no asumir despliegue terminado.
- Siguiente objetivo v0.21: reforzar análisis topológico en DXF complejos, clasificación documentada de contornos abiertos y puntos de referencia con datos reales del fabricante cuando existan; mantener aislados los DXF no validados.

Instrucción al recibir «Seguir»: recuperar el último commit de GitHub, comprobar el código, ejecutar pruebas, guardar los cambios con commit verificado y preservar la interfaz aprobada.
