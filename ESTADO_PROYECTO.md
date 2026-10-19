# Plegar Pro Plus — Punto de continuidad v0.27

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

- **v0.21:** `cad-chain.js` detecta conectividad nominal entre extremos: cadenas, ciclos, bifurcaciones y agrupaciones transitivas ambiguas, y presenta requisitos para un futuro sólido 3D sin habilitar el simulador. Exportación JSON con el estado NO HABILITADO.

- **v0.23:** detección de retrocesos solapados entre segmentos consecutivos y coordenadas nominales de incidencias DXF; 5 ejemplos visibles, 80 en JSON. Mantiene bloqueo de CNC y sólidos.

## Restricciones de seguridad y alcance

Ninguna comparación dimensional o topológica valida el montaje físico, la identidad del útil, su estabilidad, las colisiones de CAD sólido ni la seguridad de una plegadora. Los contornos no se unen, los anillos internos no se interpretan como huecos de corte y no se generan programas de fabricación.

## Pruebas y continuación

- 174 pruebas automáticas Node y Playwright en 1440, 820, 390, 320 px sin errores ni desbordamientos detectados en entorno de pruebas.
- **GitHub Pages:** verificar el workflow para este nuevo commit después de publicarlo; no asumir despliegue terminado.
- Siguiente objetivo v0.25: inspección de distancias y cruces entre curvas circulares con precisión documentada; validar datos de amarre antes de integración 3D.

Instrucción al recibir «Seguir»: recuperar el último commit de GitHub, comprobar el código, ejecutar pruebas, guardar los cambios con commit verificado y preservar la interfaz aprobada.

## Versión v0.24 — precisión de curva circular, tangencias

- Se conserva la geometría fuente analítica (segmento/centro/radio/ángulo/barrido) de LINE, ARC, CIRCLE y LWPOLYLINE bulge sin sustituir los puntos de dibujo. Las envolventes X/Y se calculan con extremos cardinales analíticos para arcos circulares; longitud desde arco exacto ya disponible.
- `cad-tangency.js`, `cad-tangency-view.js`, `cad-tangency.css`: inspección G1 nominal de tangencias internas y posibles tangencias de entidades independientes. Filtro de capas, tolerancias lineales y angulares, informe JSON con fuente SHA-256 y bloqueo CNC/simulación. Límites de presupuesto indicados como PARCIAL.
- Ejemplo `EJEMPLO_TANGENCIAS_DXF.dxf` y pruebas `tests/cad-tangency.test.cjs`; pruebas del navegador en PC, tablet y dos móviles.
- NO se validan continuidad G2, solapes curva–curva de manera exacta, sólidos, amarres ni colisiones físicas. Se mantiene la interfaz original aprobada.
- Siguiente objetivo: evaluar geometricamente contacto y holgura curva–curva de manera controlada y preparar verificaciones CAD por fabricante con tolerancias documentadas; nunca validar fabricación solo por coincidencia de perfiles 2D.


## v0.25 — simulación de movimiento 3D (esquema)

- Motor `fold-kinematics.js`: ciclo reproducible aproximación (0–22 %), conformado (22–78 %) y retirada (78–100 %), con descenso del punzón acoplado a una deformación geométrica nominal de la chapa. La matriz y el tope quedan estáticos; la cámara 3D se mantiene fija en el ciclo.
- `piece3d-view.js`: Play/Pausa, secuencia completa, reinicio, velocidad, barra de avance, selector de pasos y controles 3D anteriores. Control limpio de `requestAnimationFrame` al abandonar la pantalla.
- Pruebas: 183 Node (incluidas 9 de cinemática), Playwright en PC, tablet y móviles 390 y 320 px, comprobando desplazamiento del punzón, deformación de la chapa y estabilidad de matriz y tope.
- Importante: no se han incorporado modelos CAD certificados, leyes constitutivas, contacto sólido, ejes físicos, fuerzas o evaluación de seguridad. **NO CNC / NO FABRICACIÓN**.
- Se mantiene la imagen aprobada en `assets/referencia-aprobada.webp` y `styles.css` sin cambios.
- Próximo paso recomendado: sincronizar cinemática 3D con un modelo mecánico contrastado (planos de montaje, alturas reales, topes, cinemática de máquina), y realizar barrido de colisiones fiable antes de evaluar uso industrial.


## v0.26 — cribado discreto durante cinemática 3D

- `sweep3d.js`: 25 posiciones nominales por ciclo; cribado de alas previas frente a prismas de punzón, matriz y tope. Guarda primer instante de proximidad y mínimo observado con porcentaje, herramienta y segmento.
- `piece3d-view.js`: panel de texto y marcas temporales (sin colores de colisión), exportación JSON, caché de informe por proyecto/paso/ancho para que la animación conserve fluidez.
- NO hay barrido continuo, pliegue activo validado, reorientación de chapa, CAD del fabricante, contacto real ni garantía de seguridad; reporte con bloqueos CNC/seguridad.
- 189 pruebas Node superadas y navegación Playwright en 1440/820/390/320 px. El boceto Inicio y `styles.css` no cambian.
- Siguiente fase sugerida: verificaciones geométricas de contacto activo, enclavamientos de utillaje y topes basados en datos dimensionales fiables, nunca certificación de seguridad por aproximación.

## v0.27 — módulo Planos por cliente

Nuevo módulo Planos sin rediseñar Inicio: carpetas de cliente, importación desde almacenamiento o cámara, búsqueda, cambio de cliente y borrado. IndexedDB local conserva fichero original, miniatura cuando es posible y una copia PDF.
Fotos JPG/PNG/WebP: PDF con imagen real y miniatura. DXF 2D ASCII admitido: vista de inspección rasterizada en PDF y miniatura, SIN escala certificada. PDFs originales: conservados. Otros archivos (STEP, DWG, SolidWorks, etc.): PDF de ficha de archivo, NO conversión de sólidos ni CAM; original disponible siempre.
Exportaciones: PDF, original, copia ZIP por carpeta o global con índice JSON. Compartir PDF mediante Web Share cuando el dispositivo lo permite; de lo contrario descargar PDF y preparar correo con adjunto manual. Formatos aconsejados DXF/DWG, STEP/IGES, SLDPRT/SLDDRW/SLDASM, STL/3MF, SVG y NC/G-code, sin producir conversiones falsas.
Miniatura geométrica real para fotografía y DXF compatible; para otros tipos (PDF importado y sólidos no interpretables) se muestra identificación de formato, NO siluetas inventadas. El almacenamiento no se sincroniza y puede perderse al borrar datos del navegador: hacer copias ZIP. Límites 22 MB/archivo y 150 documentos. No integración CNC ni certificación industrial.
Pruebas locales: 193 Node; verificaciones del navegador general y del módulo Planos a 1440/820/390/320 px. La prueba aislada de Planos emula IndexedDB porque el navegador de ensayo bloquea URLs locales.
