# Plegar Pro Plus — Punto de continuidad v0.30

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

- Nuevo botón **Planos** en el menú lateral, sin alterar Inicio ni sus imágenes/estilos. Biblioteca local en IndexedDB, carpetas por cliente, búsqueda, cambio de carpeta, eliminación, importación de archivos y captura desde cámara móvil (`capture=environment`).
- Al importar fotos JPG/PNG/WebP compatibles, genera PDF con la fotografía real y miniatura de la pieza. Para DXF ASCII 2D admitidos por el lector v0.24, genera una vista rasterizada de geometría y PDF de inspección **sin escala certificada**. Un PDF original permanece sin cambios. STEP, DWG, SolidWorks y demás formatos CAD no interpretables generan un **PDF de ficha documental**, no una conversión de sólidos, y conservan los bytes originales.
- Lista muestra miniatura de fotos y DXF admitidos; otros archivos se identifican por formato, **sin inventar una silueta**. Descarga de PDF o archivo original; compartir PDF con Web Share API cuando existe, o descarga + correo `mailto:` con necesidad de adjuntar manualmente.
- Exportación ZIP por cliente o de todos los planos, con PDFs, originales e índice JSON. Recomendaciones de formatos: PDF, DXF/DWG, STEP/IGES, SolidWorks (SLDPRT/SLDDRW/SLDASM), STL/3MF, SVG y NC/G-code específico de máquina; **no se crean conversiones CAD/CAM falsas**.
- Almacenamiento local del navegador (no sincronizado entre dispositivos ni cuentas). Borrar los datos del navegador elimina los planos si no se exportó una copia ZIP. Límite de importación por archivo 22 MB y máximo de 150 registros.
- Seguridad: ningún documento se activa como geometría del simulador ni se usa para CNC. No se ha incorporado visor de sólidos CAD ni interpretación completa de PDFs nativos.
- Pruebas: `node --test tests/*.test.cjs`, `python tests/browser_check.py` y `python tests/plans-browser-check.py` (esta última utiliza un simulador de IndexedDB porque el navegador de prueba no permite direcciones HTTP locales); verificar integración en GitHub Pages real tras el commit.

## v0.28 - Lotes privados de planos
Nuevo importador de carpeta ZIP almacenado en Planos. Se debe descargar `Trenirtrade_10_planos_PDF_importar.zip` y seleccionar con el botón Importar carpeta ZIP. No subir fotografías ni PDFs reales al repositorio público.


## Continuidad v0.29 (19 oct 2026)
- Carpeta GitHub pública `planos/trenirtrade` con diez PDF fotográficos y diez miniaturas.
- Catálogo `repo-plans.js` muestra la carpeta en Planos sin importar ZIP manual.
- `Planos → Abrir en Programación` carga el nombre y vista previa, NO geometría CAD automática.
- Para simular: introducir medidas y generar perfil editable; simulación de cinemática genérica, NO CNC.
- Diseño de Inicio intacto. Mantener separación de simulación nominal vs verificada.

## v0.29 · 2026-10-19
Planos Trenirtrade: 10 PDF fotográficos públicos, 10 miniaturas y enlaces desde biblioteca a Programación. Para simular una pieza se requieren tramos, ángulos y espesor introducidos por el usuario: NO hay extracción CAD automática. No modificar Inicio aprobado.

## v0.30 — Pantalla de carga (2026-10-19)

Imagen de carga autorizada `assets/splash-plegar-pro.webp`, con dos P animadas mediante brillo y pulso independientes y efecto de estela luminosa; barra de progreso **visual estimado** de 0 a 100, mínimo 4,4 segundos, esperar `load` completo y permitir omisión. Respeta movimiento reducido, PC/tablet/móvil. No modifica dashboard Inicio aprobado. Scripts nuevos: `splash.js`, `splash.css`. Verificar GitHub Pages tras publicar.


## v0.31 — Corrección responsive de la pantalla de carga (2026-10-19)
La pantalla de carga conserva el boceto autorizado y las animaciones separadas de las P, pero utiliza dos encuadres de la misma imagen (desktop y móvil) sin incorporar la barra de 84 % dibujada en la ilustración. La barra efectiva y los textos se posicionan fuera de la ilustración, adaptándose a ancho/alto, orientación horizontal y áreas seguras de iPhone. `100dvh`, `max-height` y flexbox evitan recortes; la presentación conserva omitir y modo movimiento reducido. El progreso es estimado, no progreso real de módulos. `styles.css`, Inicio y los archivos del cliente Trenirtrade no cambian.

## v0.32: restauración y responsive

# Plegar Pro Plus v0.32 — Integridad de Planos y lectura adaptable

Fecha: 2026-10-20.

- Recuperados del historial de GitHub los archivos omitidos accidentalmente en v0.30/v0.31: biblioteca Planos, catálogo `repo-plans.js`, diez PDF Trenirtrade, miniaturas e índices. Recuperación por SHA original, sin alterar el contenido de los documentos.
- Una nueva prueba `tests/repository-integrity.test.cjs` comprueba que no falten scripts, estilos, recursos del caché offline y los diez PDF/miniaturas visibles en Planos.
- `responsive-v32.css` adapta los encabezados y márgenes de los módulos a móviles estrechos y respeta las zonas seguras del móvil. El diseño aprobado del Inicio permanece intacto.
- En Programación 2D las tablas anchas se desplazan dentro de su panel, con indicación visible en móvil; no desplazan horizontalmente toda la aplicación.
- La pantalla de carga conserva el diseño aprobado, P animadas y barra animada.
- Verificado `node --test tests/*.test.cjs`: 201 tests sin errores, `tests/mobile-workspace-check.py`: cinco tamaños (320,390,667 horizontal, 820,1440), `tests/plans-programming.test.py`: cuatro tamaños, `tests/plans-browser-check.py`: cuatro tamaños, `tests/splash-responsive-check.py`: seis tamaños.
- Los archivos PDF publicados en Trenirtrade contienen imágenes de planos originales; no se convierten en geometría CAD ni autorizan programación CNC.

## Continuidad

Siguiente prioridad: ofrecer ampliación con zoom real del plano y trazado asistido de pliegues con validación manual; no inferir automáticamente dimensiones de una fotografía.


## v0.34 — Splash adaptable a cualquier pantalla (2026-10-20)
- Pantalla de carga completa con fondo continuo, composición original y dos encuadres del MISMO diseño (vertical/horizontal), sin remaquetaciones ni bocetos nuevos.
- Barra REAL animada HTML/CSS/JS superpuesta a la imagen, sin porcentaje estático; sin botón de omitir presentación.
- Dos destellos de las P siguen animados. El splash se retira automáticamente al finalizar el arranque, con límite de seguridad para no bloquear el acceso.
- Comprobación visual en diez resoluciones: PC, tablet, smartphone vertical/horizontal; 205 pruebas unitarias previas pasan.
- Se mantienen todos los módulos Planos, Programación y las imágenes Trenirtrade.


### v0.35
Ajuste de presentación a pantalla completa sin franjas de imagen no ocupadas. Sin cambiar el arte aprobado ni los módulos: splash.css, splash.js, sw.js, test responsive y documentación. Compatibilidad comprobada en 10 resoluciones simuladas y tests generales.


## v0.36 — Evitar versiones antiguas en GitHub Pages

- `sw.js`: navegación network-first, offline fallback, caché v36 y exclusión de documentos PDF de cliente en caché dinámica. El modo online prioriza la versión publicada de `index.html`.
- `app.js`: registro del service worker sin cachear su script y comprobación al iniciar, sin actualización forzosa de pestañas con trabajo pendiente.
- `tests/service-worker.test.cjs`: cobertura del precache, HTML online más reciente, fallback offline y no almacenamiento de PDF.
- Pruebas locales: 209 Node, diez orientaciones/resoluciones de splash y navegación PC/tablet/móvil 390/320 px. Diseño e imágenes aprobados sin modificación.
- Al publicar, comprobar el commit de `main` y la acción GitHub Pages. La visibilidad real en el móvil del usuario debe confirmarse allí.

## Continuidad v0.37 · 23 octubre 2026
- Seguimiento 2D: modo opcional «Ciclo completo» con acercamiento, conformado y retirada mediante el motor cinemático compartido con 3D. Modo original conservado por defecto.
- Encuadre estable en vista lateral durante la reproducción, sin aparente movimiento de matriz o tope por reescalado de cámara.
- Visor 3D: cámaras lateral e isométrica; pausa visible de 500 ms al acabar cada pliegue antes del siguiente. La recolocación física entre pasos NO está modelada.
- Caché offline actualizada v37; pruebas de navegación ampliadas. No se valida CNC ni seguridad.

## Continuidad v0.38 — 23 octubre 2026
- Planos: nuevo motor `plan-drawing.js`, ficha PDF combinada 2D+3D, SVG individuales, perfil JSON editable, miniatura y persistencia IndexedDB. Importación «captura» como documento de referencia y conexión con Programación 2D.
- El ancho 3D es un dato explícito, no deducido de una imagen. El plano 2D cotado está basado en longitudes entre vértices teóricos, no en cotas exteriores verificadas.
- Pantalla aprobada conservada. Simulación 3D con cámaras frontal/superior y recálculo de encuadre al cambiar tramos. Caché v38.
- Las pruebas automáticas del motor (GitHub Actions 39944417736) finalizaron correctamente; el navegador real iOS/Android está pendiente.
- Sigue sin haber extracción automática de CAD desde imágenes, modelos sólidos certificados, simulación física o aprobación CNC/seguridad.

## v0.39 — 23 octubre 2026
- Motor `sequence-timeline.js` compartido: en Reproducción 2D y 3D, el botón principal reproduce TODOS los pliegues consecutivamente sin esperar clicks ni introducir pausas visuales. Sólo se detiene al terminar el último, si se pulsa Pausar o si el usuario cambia ajustes. El movimiento físico de recolocación no se representa.
- Orden editable en Programación 2D mediante selector de posición, adelantar/retrasar, reset y modo táctil para ir tocando los vértices B1…Bn en el orden deseado.
- En Simulación/Programación 3D se incorporan selectores de pliegue por paso, que intercambian posiciones preservando la secuencia válida y guardada.
- Motor `examples3d.js`: cuatro piezas de ejemplo (L, U, Z, Omega) con dimensiones, ángulos y tarjetas SVG 3D distintas, calculadas directamente desde los vértices del perfil y su anchura extruida. Accesibles en Programación 2D y en Simulación/Programación 3D.
- Incluye actualizaciones del precaché PWA v39 y scripts de prueba de navegador. No implementa física de recolocación, control CNC ni seguridad.

## Continuidad v0.42 — 23 octubre 2026
- `sample-library.js`: 12 piezas geométricas de ejemplo con nombre, tramos, ángulos, material, espesor, ancho, orden y dibujos 2D/3D independientes. Se añaden a Proyectos conservando registros locales existentes, sin presentarse como planos originales. Planos incluye 12 tarjetas y opciones «Programar 2D» y «Guardar planos 2D/3D».
- Nuevas tarjetas muestran **ambas vistas**, 2D y 3D. Los proyectos de usuario sin geometría confirmada tienen una forma de BORRADOR expresamente advertida; nunca se afirma que coincide con su plano real.
- Programación 2D: panel superior de configuración rápida de material, espesor, ancho, punzón, matriz, radio, K, tope X. Botón de V nominal cercana a 8×espesor. Botón de orden táctil, numeración de paso sobre vértices y detección de repetidos al tocar.
- `engineering-checks.js`: diagnóstico estático de desarrollo, V/espesor, fuerza aproximada con Rm supuesto por material, ala corta y posibles intersecciones del perfil. **No** es cálculo de fabricante, máquina ni seguridad.
- `sheet-offset.js`: geometría de miter limitada y compartida entre `piece3d.js` y `plan-drawing.js` para mejorar la coherencia de espesores en los vértices. No se modelan radios de pliegue reales ni springback.
- Se conserva el diseño aprobado de Inicio y la aplicación es adaptativa. Pendiente: extracción CAD paramétrica de capturas/fotos, geometría exacta de planos de clientes, simulación física, secuencia real de recolocación, límites por máquina y colisiones/posprocesado CNC certificados.

## v0.43 · 23 octubre 2026
- Tarjetas Proyectos: plano y pieza 3D, acciones directas Programar 2D/Simular 3D/Guardar en Planos; borradores sin cotas confirmadas no se guardan como planos de fabricación.
- `bend-workplan.js`: hoja de secuencia según el orden táctil, material, punzón, matriz, alas, giros, fuerza aproximada, advertencias y exportación CSV. NO CNC.
- El ancho confirmado de Programación 2D se propaga al visor 3D. Caché v43.
- Sigue pendiente validar física de contacto, geometrías oficiales, colisiones y fabricación.

## Continuidad v0.44 · restauración de imagen y gestos (23 octubre 2026)
- Inicio abre con fotografía original `assets/maquina.webp` de Bystronic. Dos botones alternan «Máquina» (foto fija) y «Cinemática 3D» (modelo geométrico). Reproducir cambia al modelo animado; la fotografía nunca se declara una simulación real.
- Nuevo motor independiente `touch-view.js` con drag a un dedo/ratón, pellizco a dos dedos para zoom 0,7–4x y doble toque/doble clic para centrar. Se aplica al panel principal, vista previa, Seguimiento 2D y Simulación 3D sin borrar sus vistas al actualizar los fotogramas.
- Botones anteriores de zoom, cámaras y orden se conservan. Los gestos transforman la cámara de presentación y no alteran medidas, coordenadas de fabricación ni la simulación de máquina.
- Actualización de caché offline v44 y precarga del archivo de imagen existente; pruebas Node y Chromium por verificar.

## v0.45 — Desarrollo de chapa y selección de referencia dimensional (23 octubre 2026)
- `bendcalc.js`: mantiene BA, BD y OSSB tradicionales para cotas exteriores como valor por defecto, añade cotas interiores (ISSB), longitudes rectas hasta tangencia, validaciones por tramo, arcos de fibra neutra y coordenadas en el desarrollo de B1…Bn. El motor exige una referencia única para toda la pieza.
- `flat-pattern-view.js`: vista de la tira plana según el modo seleccionado, con zonas de arco, centros de pliegue y cotas acumuladas. El resultado se anula si los tramos son demasiado cortos; no se exporta un corte validado.
- En Programación 2D se eligen modo de cota, Ri, espesor, K; nuevo botón de calibración matemática de K a partir de un ensayo real (requiere medir la probeta). Sensibilidad entre K=0,30 y K=0,50. Los perfiles heredados continúan con referencia exterior para no romper la compatibilidad.
- La hoja de trabajo muestra la referencia y centros de pliegue; el plano 2D/3D generado aclara que es nominal y añade desarrollo calculado, si es viable. Fórmulas no consideran springback, ancho variable, conformado plástico complejo ni tablas reales de máquina; NO apto para CNC ni fabricación sin calibración.

## v0.46 · Módulos de cálculo y comparador V conectados (23 octubre 2026)
- «Calculadora de plegado» recupera el programa, base de cotas, Ri, K, ancho, desarrollo, fuerza orientativa, BA/BD, posiciones de pliegue y banda de sensibilidad.
- «Comparador de V» ofrece las aperturas GENÉRICAS: V/e, ala mínima orientativa, fuerza nominal, avisos de ángulo y apertura, botón para enviar matriz al editor 2D. No varía Ri ni deducciones automáticamente sin una relación física confirmada.
- «Curva perfecta» permanece sin resultados automáticos no verificados.

## v0.52 — Radios y K por pliegue (23 octubre 2026)
- `bendOverrides` opcional permite especificar Ri/K para B1…Bn, heredando valores generales. Se valida, persiste y sincroniza al reordenar, agregar o quitar pliegues.
- Motor geométrico, BA/BD y posiciones del desarrollo aplican Ri/K efectivos de cada B. La calibración del K general se desactiva si hay K locales; la sensibilidad cambia solo K heredado.
- Calculadora, vista desplegada, hoja de secuencia y CSV muestran radios/factores K por pliegue. NO CNC ni datos calibrados de máquina.

## Corrección del sentido de plegado — 24 octubre 2026
- Convenio uniforme en Crear nueva pieza, geometría 2D, seguimiento y malla 3D: **+ = arriba; − = abajo**. Coordenadas SVG descendentes convertidas correctamente en geometría 2D.
- El arco activo conserva su signo y el recorrido de alas anteriores invierte apropiadamente el sentido al caminar a izquierda/derecha. Las 4 figuras L/U/Z/Omega se cotejan geométricamente contra el perfil final incluso al variar la secuencia.
- Los pliegues negativos reflejan la **orientación de la pieza en su sistema geométrico**, no un montaje físicamente simulado. Para plegar sobre una matriz real hay que modelar giro/volteo, contacto y topes verificados; informes de holgura siguen **NO CNC / SIN VALIDAR**.
- Refresco de caché offline v73. Conserva la interfaz aprobada.


## Continuidad v74 — concordancia visual de sentidos (24 octubre 2026)
- Después de fijar +arriba/−abajo en el motor, tres representaciones mantenían inversiones: Crear nueva pieza, Programación 2D y Planos PDF/SVG. Se corrigieron para que la orientación del 2D coincida con el 3D y con el signo del programa.
- Los puntos de pliegue del formulario muestran flechas ↑/↓. El editor anuncia la orientación mediante etiquetas accesibles.
- Pruebas automáticas sobre SVG exportados de +90°, −90°, +45°, −45° y comprobaciones Chromium en PC/móvil de programación y formulario; caché v74.
- Simulación nominal; el volteo/recolocación física, geometría real de útiles, colisiones y CNC siguen sin validar.


## Continuidad v75 — pieza final invariable al cambiar el orden (24 octubre 2026)
- Las tarjetas 3D de la pieza objetivo y la miniatura del paso final ya NO se construyen reusando la chapa orientada por el último golpe de la cinemática. Utilizan el mismo perfil validado y la misma malla de Planos, de modo que la geometría nominal final es independiente de la secuencia.
- La vista del golpe en máquina sigue separada, con sus limitaciones de recolocación física y contacto; no se confunde con la referencia geométrica final.
- Las pruebas comparan mallas exactas de Planos/vista previa y estabilidad de L, U, Z y Omega cuando se invierte el orden. Caché offline v75. No CNC.

## v76 — vista lateral 2D más completa (24 octubre 2026)
- Vista de perfil incluye tren superior (trancha, portapunzón, mordaza), punzón, matriz y portamatriz, mesa con estructura inferior y dedo/brazo/carro de tope trasero. La sección mantiene separadas partes que acompañan al punzón de las fijas y añade sus trazados al encuadre.
- Módulo `machine-section2d.js` con cribado AABB de posibles proximidades por componente y texto de estado. La forma de amarres, máquina y topes es ILUSTRATIVA en ausencia de CAD contrastado; no valida ausencia de colisiones, contacto real ni CNC.
- Pruebas en Chromium de componentes visibles, carrera vertical y estabilidad de mesa, junto con prueba unitaria de sección. Caché offline v76.

## v77 — secuencia Omega (24 octubre 2026)
- Los ejemplos Omega cargan B1→B2→B4→B3 por defecto. El planificador añade el candidato solicitado, con riesgos y datos ausentes visibles. El editor permite utilizar esta propuesta para estudiar la animación; nunca se aprueba CNC ni se supone libre de colisiones.
- La recomendación automática conserva sus bloqueos de riesgos y medidas faltantes. Nuevas regresiones y pruebas de Chromium.

## v78 — inspección del contorno y muestreo del ciclo (24 octubre 2026)
- La proximidad de alas a portapunzón, mordaza, portamatriz, mesa, estructura inferior y topes se estima con distancia al polígono real dibujado, NO solo al AABB. El medio espesor de chapa se incluye en el margen.
- Análisis de 21 posiciones por golpe, con primer posible contacto por componente y fase; panel detallado de nueve zonas. Es muestreo discreto en 2D, no barrido continuo ni certificación CNC.
- Recuadro fijo con posición X nominal del tope, visible sin depender del zoom; el detalle no está a escala. Caché offline v78.

## v79 — forma base del punzón genérico (24 octubre 2026)
- Se abandona el triángulo que crecía de punta a cabeza durante toda la altura del punzón. El perfil nominal incluye una espiga recta y un corto flanco de punta 30°/88° redondeada, con dimensiones de estudio explícitamente NO VERIFICADAS.
- Un punzón H100 y otro H150 mantienen ancho transversal superior análogo en la representación, en vez de multiplicarlo por la altura. Se mantienen selección de herramienta y radio programados. No se incorpora ni se atribuye una geometría oficial de fabricante.
- Pruebas de perfil, amarre y cache v79; la inspección sigue siendo nominal y NO CNC.

## v80 — once zonas de inspección (24 octubre 2026)
- Punzón y matriz incluidos junto a las nueve zonas estructurales en la inspección y el muestreo 2D. Se diferencia expresamente contacto nominal de conformado de una posible interferencia; ninguno supone choque real certificado.
- El cálculo de proximidad emplea perfiles 2D aproximados y permanece NO CNC. Pruebas actualizadas y caché v80.
