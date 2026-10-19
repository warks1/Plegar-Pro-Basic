# Plegar Pro Plus · Prototipo v0.12

Repositorio: `warks1/Plegar-Pro-Basic`.

**Identidad visual:** la pantalla Inicio mantiene la disposición e imágenes del boceto aprobado, localizado en `assets/referencia-aprobada.webp`. El diseño de Inicio sigue siendo ilustrativo, no una simulación 3D ni un gemelo digital.

## Programación 2D

Editor funcional en el navegador: tramos nominales entre vértices teóricos agudos, giros firmados, orden de plegado, deshacer/rehacer, guardado local y JSON (exportación de versión 2, lectura compatible con versión 1). Sincronización entre dispositivos y salida CAD/CAM: pendientes.

### Estimador de desarrollo — **NO PARA FABRICACIÓN**

En **Programación 2D**, el usuario elige espesor, radio interior supuesto `Ri`, factor `K`, punzón genérico y matriz genérica. El cálculo presupone que cada longitud introducida es una **longitud de perfil medida entre intersecciones virtuales de caras rectas** (vértices teóricos de pliegue). Para cada giro de magnitud `θ`:

- `BA = θ(rad) × (Ri + K × espesor)` (longitud de arco en fibra neutra modelada).
- `OSSB = (Ri + espesor) × tan(θ/2)`.
- `BD = 2 × OSSB − BA`.
- `Desarrollo estimado = suma de longitudes entre vértices − suma BD`.

El ángulo firmado controla la orientación del dibujo. Su magnitud es el cambio de dirección exterior en radianes; `ángulo interior = 180° − |giro|`. **No** introducir las cotas exteriores, alas terminadas u otras referencias como si fueran distancias entre vértices sin reinterpretarlas antes. El cálculo **no** modela variación de espesor, radio resultante a partir de V, recuperación elástica, K real, resistencia, carga, eje Y, topes, mínima ala, colisiones ni secuencia CNC.

Los punzones y las matrices son ejemplos **genéricos**, identificados solo por ángulo, apertura V y radio nominal de punta. No son réplicas ni datos dimensionales homologados de MECOS, AMADA, TRUMPF o Bystronic. La orientación `V ≈ 8 × espesor`, y el rango orientativo `V/e=6–10`, requieren confirmar utillaje, material, proceso y máquina reales.

Si un tramo es más corto que la suma de los dos retranqueos geométricos de sus extremos, se muestra «No calculable» (en lugar de ofrecer una falsa longitud de corte). **Los resultados nunca deben usarse para fabricar una pieza sin una validación dimensional previa con material, herramientas y máquina reales.**

## Archivos

- `index.html`, `styles.css`, `app.js`: interfaz general original.
- `geometry2d.js`: vértices y validaciones del perfil.
- `bendcalc.js`: matemáticas del desarrollo, validación del utillaje nominal y advertencias.
- `editor2d.js` y `editor2d.css`: controles, dibujos y resultados.
- `sw.js` y `manifest.webmanifest`: PWA experimental con caché versionada.
- `tests/geometry2d.test.cjs`, `tests/bendcalc.test.cjs`, `tests/browser_check.py`: pruebas.

## Ejecutar y probar

Servir desde HTTP: `python -m http.server 8000`, después abrir `http://localhost:8000`.

- `node --test tests/*.test.cjs`
- `python tests/browser_check.py` (requiere Playwright y Chromium compatibles)

Para GitHub Pages: es necesario habilitar explícitamente la publicación en *Settings → Pages*, si no está configurada. No basta con subir los archivos al repositorio.


## v0.4 — Seguimiento geométrico de perfil (NO motor físico)

El apartado **Simulación 2D** presenta una vista lateral ilustrativa con punzón, matriz V, chapa y tope trasero. Los parámetros y la secuencia proceden del perfil guardado en **Programación 2D**, donde también aparece la misma vista.

- Controles: selección de pliegue por secuencia, anterior, siguiente, reproducción, pausa, avance manual y zoom.
- Un único pliegue activo a la vez: `profundidad ilustrativa = (V/2) × tan((|giro| × avance)/2)`; esta función NO determina la carrera real de una máquina.
- Las longitudes de ala representadas son los dos tramos nominales adyacentes al vértice seleccionado. El tope queda inmóvil en su posición inicial de referencia; los apoyos reales NO se calculan.
- La chapa es una línea central de espesor nominal, dibujada como dos segmentos rectos SIN zona curva, deformación física, propiedades elásticas ni compensaciones. No incorpora la pieza plegada completa ni las interferencias con otras alas.
- El cambio de orientación para pliegues negativos NO está simulado; el programa lo advierte.
- Cuando el modelo idealizado no alcanza los hombros de V o supera su profundidad teórica muestra advertencias. NO equivalen a una certificación de colisión o de seguridad.

**No usar la animación para programar una plegadora, evitar colisiones o verificar piezas.** El diseño visual de Inicio se conserva.

Archivos nuevos: `forming2d.js` (modelo cinemático comprobable), `forming2d-view.js`, `forming2d.css`, `tests/forming2d.test.cjs`.


## v0.5 — Arco tangente y espesor nominal en el seguimiento 2D

La sección local del pliegue dejó de dibujarse como dos líneas que se unen en un vértice agudo. El esquema ahora utiliza un **arco circular tangente** entre dos tramos rectos, basado en un **radio interior supuesto `Ri`** y un radio del eje medio de la chapa `Rm = Ri + espesor/2`. El **factor K** solo se usa en el cálculo separado de desarrollo; no controla el dibujo del eje medio.

- Se calcula el retranqueo nominal de tangencia `Rm × tan(giro/2)`; el sistema avisa si un ala es demasiado corta para el arco.
- La chapa se representa con espesor y un arco suave muestreado, en lugar de una punta sin radio.
- La chapa se coloca en relación con los hombros de la matriz V usando una aproximación geométrica de apoyo. Se advierte si la zona curva alcanza esos hombros, si un ala no llega a ellos o si el perfil nominal rebasa la profundidad V. **Estas advertencias no son verificaciones de colisiones reales.**
- El punzón se dibuja de forma genérica con punta suavizada, pero NO se realiza cálculo físico de contacto ni de fuerza. El tope es una referencia fija, sin movimiento de ejes ni control de contacto.
- Continúan pendientes: deformación del material, radios reales importados CAD, recuperación elástica, dimensiones exactas de fabricantes, giros de pieza para signos negativos, alas ya plegadas, sólidos 3D y colisiones certificables.

Comprobación: `node --test tests/*.test.cjs` y `python tests/browser_check.py` (Chromium/Playwright). Los tests automatizados no equivalen a validación con máquina física.

## v0.6 — Posición nominal de tope X y cribado de solapamientos 2D (NO seguridad)

En **Programación 2D → Parámetros de desarrollo** se puede introducir una **posición nominal del tope X** en mm (1–10000), medida horizontalmente desde el eje teórico del pliegue en el modelo aislado. No es el eje X real de ninguna máquina ni se transfieren instrucciones a una plegadora. El valor queda guardado con el perfil y viaja en el JSON, con deshacer/rehacer e importación de perfiles anteriores mediante un valor por defecto de 120 mm.

La vista de **Seguimiento de plegado · Perfil** permite comprobar cómo cambia, durante la animación del pliegue elegido, la separación horizontal nominal del extremo derecho respecto al tope fijo. Puede indicar **separado**, **contacto nominal** o **interferencia** según un test de solapamiento 2D conservador con un bloque de tope genérico. Asimismo, se calcula si la envolvente simplificada de chapa sobrepasa el contorno en V de la matriz idealizada, sin usar la geometría real del fabricante. Se muestran alertas y no se bloquea el avance del dibujo.

**Limitaciones críticas:** no se calcula la posición vertical real del tope, el contacto físico, desplazamiento del material, el eje Y, las holguras reales de útiles, el punzón frente a las alas, el giro y orientación para pliegues negativos, las paredes de piezas anteriores ni colisiones 3D. Un resultado «sin alertas geométricas» no significa que el proceso esté libre de colisiones o sea seguro. No utilizar los avisos como validación para plegado o preparación CNC. Para ello son necesarios modelos dimensionales certificados, verificación de interferencias de sólidos y contraste con la máquina real.

Archivos nuevos: `interference2d.js` y `tests/interference2d.test.cjs`. Se mantienen intactos los estilos e imágenes de la pantalla Inicio aprobada.

## v0.7 — Contornos genéricos de herramientas y alas anteriormente plegadas (cribado plano)

Se incorporan perfiles **paramétricos orientativos** de punzón con punta circular tangente a las caras nominales de 30°/88°, y matriz V triangular genérica. El gráfico usa los mismos contornos que se examinan numéricamente para las alertas, pero NO son perfiles de fabricante ni sólidos CAD; faltan sus cotas reales, segmentos de montaje, adaptadores, radios de hombro y geometría de máquina.

Para los pliegues anteriores en la secuencia del usuario, el modelo intenta trazar **únicamente las alas contiguas** al pliegue activo, como trazos naranjas discontinuos. Los giros ya realizados se tratan como **bisagras agudas en un mismo plano**, con signos tomados del perfil, sin corregir posición de mordazas, topes ni apoyo, y sin modelar el radio en los pliegues anteriores. Las alas no contiguas que requieran pasar por un pliegue aún no ejecutado no se reconstruyen.

Se calcula la distancia nominal 2D entre segmentos auxiliares y los contornos simplificados del punzón, matriz y tope. Al restar medio espesor se identifican **posibles interferencias planas**, que se presentan únicamente como advertencias. Sin alerta NO significa ausencia de colisión real. No se examinan movimientos barridos ni cambios de orientación, contacto físico, recuperación elástica, piezas 3D, alturas verificadas ni cinemática CNC. Las secuencias con pliegues negativos necesitan recolocación física no implementada.

Nuevos archivos: `toolprofiles2d.js`, `previousbends2d.js`, `clearance2d.js`, `tests/priorflanges.test.cjs`. Se incrementa la caché PWA a `v7` y se mantienen sin cambios los recursos de la portada aprobada (`assets/*`, `styles.css`, `app.js`).

**Advertencia industrial:** esta es una maqueta de investigación geométrica que NO se debe usar para certificar ausencia de colisiones, definir parámetros de máquina o realizar trabajos de fabricación.

## v0.8 — Perfil completo y primera malla 3D ilustrativa

**Pantalla Inicio, logotipo, recursos originales y disposición**: sin cambios. En **Programación 2D / Simulación 2D** ahora se muestran también los tramos de la pieza que siguen al pliegue activo, incluidos los pendientes (azul) y los pliegues anteriores en forma de bisagra aguda (naranja). El dibujo utiliza el mismo perfil nominal guardado. Se centra y escala dinámicamente para intentar mostrar el conjunto sin desbordar; el zoom permite inspeccionarlo. El cálculo del plegado activo sigue siendo un arco tangente supuesto con espesor nominal y **no representa fuerzas, contacto, colisiones reales, giro de la pieza ni recuperaciones elásticas**. El cribado de interferencias previo **solo** verifica las alas previas contiguas que el modelo v0.7 sabía trazar; **NO** se amplía automáticamente a todo el contorno de la v0.8.

Se ha incorporado una **previsualización 3D geométrica** en los módulos «Programación 3D» y «Simulación 3D». Un motor independiente (`piece3d.js`) construye una malla de caras desde el contorno entero 2D, con el espesor nominal y un **ancho de demostración configurable (por defecto 100 mm)**, sin almacenarlo como dimensión real de la pieza. El visor SVG (`piece3d-view.js`) proyecta esa malla y ofrece rotación, zoom, selección de paso y avance del pliegue; no depende de un motor WebGL, con lo cual funciona como representación estática proyectada, no como CAD manipulable o sólida verificada.

**Importante:** esta malla se genera a partir de segmentos nominales y bisagras agudas de pliegues previos; los offsets son aproximados y no tienen radios completos en cada pliegue, intersecciones CAD, validación de solidez ni colisiones 3D. Un giro negativo se representa sin recolocación física. No sirve para decidir si un plegado es seguro ni para generar CNC. La vista de máquina del dashboard Inicio sigue siendo una fotografía/ilustración original, **no** un gemelo digital animado.

Archivos nuevos: `assembly2d.js`, `piece3d.js`, `piece3d-view.js`, `piece3d.css`, `tests/assembly3d.test.cjs`. Se actualizan `forming2d.js`, `forming2d-view.js`, `app.js`, `index.html`, `sw.js`, `tests/browser_check.py` y la documentación. Caché PWA `v8`.


## v0.9 — Utillaje genérico 3D sincronizado con Programación 2D

En los módulos **Programación 3D / Simulación 3D** se representan conjuntamente las caras de chapa extruidas y las envolventes paramétricas de **punzón**, **matriz** y **tope X**, compartiendo coordenadas (x: perfil en mm, y: descendente, z: ancho ilustrativo). Las formas de punzón y matriz se obtienen de los perfiles 2D genéricos presentes en `toolprofiles2d.js` y `forming2d.js`: **no son sólidos CAD de fabricantes ni útiles certificados**. La matriz es una extrusión de su V nominal; el punzón parte de su ángulo y radio nominal. El tope es un bloque estático sin eje CNC.

- `tooling3d.js`: extruye contornos con tapas y laterales y agrupa sus caras con el modelo de chapa existente en una sola escena/proyección.
- `piece3d.js`: conserva etiquetas de grupo para diferenciar chapa, punzón, matriz y tope en la representación.
- `piece3d-view.js`, `piece3d.css`: permiten ocultar/mostrar **independientemente** las tres herramientas y mantienen giro, zoom, paso y ancho ilustrativo.
- `index.html` y `sw.js`: incluyen el módulo geométrico y la versión de caché `v9`. El diseño, imágenes y estilos de la portada aprobada **no se alteran**.
- `tests/tooling3d.test.cjs`: pruebas de volumen nominal, correspondencia de coordenadas, visibilidad y geometría inválida; pruebas del visor integradas en `tests/browser_check.py`.

**Limitación esencial:** un contorno 2D extruido y proyectado NO acredita solidez CAD, trayectorias barridas, cinemática real de máquina, deformación plástica, fuerzas de plegado ni ausencia de colisiones, incluso si las piezas se ven separadas. El orden de plegado previo sigue siendo aproximado; la geometría de fabricantes y las comprobaciones industriales están pendientes. No utilizar este prototipo para fabricación, CNC o seguridad.


## v0.10 — Estados de chapa y distancias orientativas en visor 3D

El visor **Simulación 3D** colorea de forma distinta los segmentos *realizados*, el pliegue *activo* y los *pendientes* de la secuencia. Se pueden ocultar las caras pendientes para inspeccionar el resto y alternar el resaltado, sin alterar la geometría. La etiqueta del segmento se rastrea hasta el contorno original incluso en progreso 0%, cuando la sección circular colapsa y se fusionan puntos.

La nueva zona de inspección resume los cálculos **ya existentes** de proximidad de alas previas y perfiles genéricos **en 2D**. **No es un motor de colisiones 3D**: las distancias no cubren lados de herramienta, ejes, posicionamiento de topes ni la trayectoria barrida, y no garantizan seguridad de fabricación. Se mantienen los avisos para pliegues negativos sin recolocación resuelta.

Pruebas: `node --test tests/*.test.cjs` y `python tests/browser_check.py` con Playwright Chromium. Sin cambios en los estilos de Inicio ni en los recursos originales del boceto aprobado.

## v0.11 — Cribado nominal tridimensional de prismas extruidos (NO detección CAD)

**Se conserva intacta la pantalla Inicio aprobada:** no se modifican `styles.css`, `app.js` ni los recursos originales de `assets/`. La nueva función sólo aparece en **Simulación 3D / Programación 3D**.

La biblioteca `proximity3d.js` toma los **tramos ya completados** del perfil nominal (representados como bandas de espesor constante extruidas sobre el ancho ilustrativo) y calcula una distancia euclídea aproximada contra prismas de punzón, matriz y tope. Para cada par considera la distancia entre polígonos en la sección XY y la separación de sus intervalos Z. Cuando los polígonos y las bandas Z se solapan, el resultado es **0 mm (posible intersección del modelo)**; esto no es una penetración verificada en la máquina real. La matriz y el punzón comparten el ancho ilustrativo más márgenes de dibujo; el tope ocupa un bloque nominal centrado en ese ancho. Los mismos prismas nominales ahora se obtienen de `tooling3d.prisms()`, que utiliza también el renderizado para evitar diferencias de coordenadas entre visualización e inspección.

Los resultados de este cribado 3D se muestran en un **panel propio** y se mantienen separados de las holguras planas de v0.10. En el primer paso, cuando no hay tramos completados, el programa no inventa una distancia mínima. El cálculo no es una validación industrial: las alas anteriores se basan en un perfil de bisagras con radios incompletos, el ancho es ilustrativo, las herramientas son extrusiones genéricas sin geometría CAD contrastada, no se modelan carriles/amarres/cuerpo de máquina, trayectorias barridas ni reposicionamientos de la chapa, y el contacto deliberado con los útiles puede aparecer como intersección nominal. **Nunca interpretar una distancia positiva como garantía de ausencia de colisión**.

Se amplían las pruebas con casos de contacto, separación XY y Z, intervalos inválidos, correspondencia de prismas visibles, tramo no evaluable y cribado de pliegues anteriores. Comprobar con `node --test tests/*.test.cjs` y `python tests/browser_check.py` (Chromium/Playwright).

**Pendiente v0.12:** sección de catálogos dimensionales con trazabilidad de fuentes; geometría de montaje/adaptadores; modelos de máquina y ejes verificables; motor CAD de sólidos y barrido de trayectorias para colisiones industriales; publicación GitHub Pages y validación en dispositivos físicos.

## v0.12 — Biblioteca de utillaje paramétrico SIN VERIFICAR

- `tool-library.js` define 8 punzones y 21 matrices de demostración, sin atribuirlos a fabricantes; todos tienen ID, fuente, revisión y `verified: false`.
- Series genéricas 30°/88°, V6–V50 y alturas nominales H100/H120/H150 para punzones seleccionados. **No** representan perfiles CAD certificados ni cotas oficiales.
- Se conservan los IDs anteriores para recuperar proyectos JSON previos; el editor, el cálculo, el seguimiento 2D y la vista 3D comparten los mismos datos.
- Fichas de la herramienta seleccionada en Programación 2D; avisos claros «SIN VERIFICAR». El 3D utiliza alturas nominales cuando existen.
- Pruebas: `node --test tests/*.test.cjs` y `python tests/browser_check.py` (1440, 820, 390, 320 px).
- **No usar para fabricar** ni garantizar fuerzas, amarres, tolerancias, secuencia CNC o colisiones.

Próxima fase: fichas oficiales con fabricante, referencia, versión, URL, fecha, medidas, amarre y tolerancias comprobables.
