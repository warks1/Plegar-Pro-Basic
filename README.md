# Plegar Pro Plus · Prototipo v0.16

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


## v0.12 · Fichas de utillaje paramétrico SIN VERIFICAR

- Archivo fuente: `tool-library.js`, con 8 punzones y 21 matrices de DEMOSTRACIÓN. Todas las entradas tienen identificador único, revisión, procedencia interna y `verified: false`; las referencias no corresponden a productos oficiales ni permiten garantizar compatibilidad con marcas o amarras.
- Punzones genéricos 30° / 88°, radios R1 / R2; tres alternativas ilustrativas H100/H120/H150 para punta R1 a 30°. Matrices nominales 30° / 88° y V6–V50 según la tabla incluida. El modelo no tiene tolerancias de fabricación ni cotas certificadas.
- Las opciones anteriores se conservan para abrir JSON de versiones previas. Las selecciones, cálculos y simulaciones 2D/3D comparten el mismo identificador de herramienta.
- Las fichas aparecen bajo los selectores de Programación 2D y señalan `SIN VERIFICAR`, la fuente y las dimensiones disponibles. Si no hay altura documentada, se indica claramente.
- Los perfiles 2D y 3D de demostración reflejan las alturas especificadas; no existe geometría CAD sólida de fabricante ni comprobación de trayectorias barridas.
- No utilizar los resultados para aprobar fabricación, fuerza, amarre, interferencias reales o seguridad de la máquina.
- Pruebas: `node --test tests/*.test.cjs` (72 pruebas) y `python tests/browser_check.py` en 1440 / 820 / 390 / 320 px.

**Próximo paso:** introducir perfiles oficiales de fabricantes únicamente tras obtener documentación dimensional contrastable (DXF, STEP o planos acotados), conservar fabricante, referencia exacta, URL, versión, fecha, sistema de amarre y tolerancias, sin sobrescribir los modelos genéricos actuales.


## v0.13 — Referencias dimensionales de fabricante (consulta separada)

Se crea `manufacturer-references.js` con **cinco referencias concretas AMADA**, documentadas mediante fichas o catálogos publicados por el propio fabricante: **tres punzones y dos matrices**. Cada registro identifica fabricante, serie, modelo, referencia comercial de la variante, cotas publicadas, origen URL, fecha de consulta, revisión cuando se identifica y límites del dato. La ficha puede filtrarse por punzón/matriz y abrir su fuente original en Programación 2D. Se incluyen **cuatro entradas de catálogo**, entre ellas TRUMPF, aún sin datos de herramienta individual importados.

- La nueva biblioteca es **solo de consulta**. No se añade ningún útil de fabricante a los desplegables de selección del motor geométrico ni se usa una ficha parcial para generar un sólido de colisión.
- El motor continúa con los 8 punzones y 21 matrices genéricos de v0.12, marcados SIN VERIFICAR; la portada aprobada y sus recursos no se han modificado.
- No hay referencias MECOS importadas, pues todavía no se ha comprobado una fuente dimensional suficiente.
- Ver [FUENTES_UTILLAJE.md](FUENTES_UTILLAJE.md) para referencias, dimensiones, fechas y advertencias.
- Pruebas: `node --test tests/*.test.cjs` y `python3 tests/browser_check.py`.

**Advertencia:** cota publicada ≠ geometría CAD verificada ≠ aptitud para producción. La geometría del amarre y la compatibilidad de máquina permanecen sin contrastar.

## v0.14 — Importador de perfiles CAD DXF ASCII 2D (solo inspección)

En **Programación 2D → Importar perfil CAD v0.14**, se puede abrir **un DXF ASCII** con **una única entidad LWPOLYLINE** de líneas rectas 2D, cerrada o abierta. El programa:

- comprueba que los códigos/valores DXF estén emparejados, que los vértices estén completos, que no existan arcos bulge, grosores o elevaciones y que el contorno no tenga autointersecciones;
- reconoce `$INSUNITS`: milímetros, pulgadas, centímetros y metros; **si falta** o es incompatible, exige que se indiquen las unidades manualmente (no da por supuestos los milímetros);
- calcula una vista previa SVG, límites X/Y en milímetros, longitud del contorno y número de vértices; admite archivos de hasta 2 MB y 1.500 vértices, con límites dimensionales;
- compara orientativamente el ancho y alto de la envolvente con las dimensiones publicadas de la referencia AMADA seleccionada, tolerancia ilustrativa ±0,5 mm. La orientación se deduce sólo para esta comparación; **no** se confirma la identidad del fabricante;
- procesa la geometría **localmente**, no la guarda en el perfil de la pieza ni la traslada al motor de simulación, no genera G-code y no modifica los punzones/matrices activos. Al abandonar/reconstruir el editor se pierde esta importación, por diseño.

**Formatos NO admitidos:** DWG, STEP, IGES, DXF binario, bloques INSERT, SPLINE, ARC, CIRCLE, polilíneas con bulges, entidades LINE separadas, múltiples contornos, piezas 3D o planos de trayectorias. Para trabajar con ellos se deberá incorporar un intérprete CAD específico y verificaciones adicionales. El archivo de prueba `EJEMPLO_PERFIL_UTILLAJE.dxf` **es ficticio**: no pertenece a ningún fabricante. No permite inferir amarre, tensiones, radios, colisiones o seguridad.

Archivos nuevos: `cad-profile.js`, `cad-profile-view.js`, `tests/cad-profile.test.cjs`, `EJEMPLO_PERFIL_UTILLAJE.dxf`. Cambios: `editor2d.js`, `editor2d.css`, `index.html`, `sw.js`, `tests/browser_check.py`, documentación.

Pruebas: `node --test tests/*.test.cjs` y `python tests/browser_check.py` (Chromium Playwright en entorno local aislado). La interfaz Inicio aprobada, imágenes, colores y disposición **no se han modificado**.

## v0.15 — DXF ASCII multicapas y varios contornos (solo inspección)

En **Programación 2D → Importar DXF 2D v0.15**, el usuario puede inspeccionar varias entidades `LWPOLYLINE` y `LINE` rectas, respetando la pertenencia a capas DXF y seleccionando el contorno concreto para el cotejo de cotas con las fichas de fabricante. El dibujo muestra todos los contornos en gris y el seleccionado en cian. No reconstruye cadenas de LINE, no infiere superficies cerradas ni traslada la geometría al cálculo, utillaje, simulación o CNC.

Admite `$INSUNITS` en mm, cm, m o pulgadas y la selección manual de unidad para archivos no declarados. Límite por archivo: 2 MB, 100 entidades y 1500 vértices. Continúa rechazando geometrías complejas (ARC/CIRCLE/SPLINE, bulges, polilíneas 3D, INSERT, formatos binarios, DWG y STEP), además de elevaciones no nulas, puntos degenerados y autointersecciones dentro de un mismo contorno. Un perfil cerrado puede tener huecos solo visuales; **no** hay booleanas ni reconstrucción de sólidos.

Nuevos archivos: `EJEMPLO_PERFIL_MULTICAPA.dxf`, `tests/cad-multilayer.test.cjs`. Cambios: `cad-profile.js`, `cad-profile-view.js`, `editor2d.css`, `sw.js`, `tests/browser_check.py`, documentos de continuidad. El método heredado `PlegarCadProfile.parse()` sigue admitiendo exactamente un contorno para mantener la compatibilidad con v0.14. Se incorpora `PlegarCadProfile.parseDocument()` para documentos multientidad.

La importación y la comparación siguen siendo **orientativas y SIN VERIFICAR**. No pueden emplearse para certificar compatibilidad de utillaje o seguridad de la plegadora.


## v0.16 — Arcos DXF y exportación de informe dimensional (SOLO INSPECCIÓN)

En Programación 2D, el importador admite ahora entidades LINE, LWPOLYLINE con bulge, ARC y CIRCLE de DXF ASCII 2D, en diferentes capas. Verifica el estado abierto/cerrado y detecta segmentos degenerados y autointersecciones del contorno discretizado. Límite de 2 MB, 100 entidades y 1500 puntos de vista previa. Los arcos se representan por cuerdas con tolerancia nominal de 0,04 mm; sus longitudes se calculan analíticamente. La verificación de autointersecciones usa la aproximación por segmentos y no garantiza exactitud CAD por debajo de ese límite.

Los botones Informe JSON e Informe CSV generan un informe local con capas, entidades, ancho, alto, longitud y número de arcos. Ambos se marcan **NO VERIFICADO / NO VÁLIDO PARA FABRICACIÓN**. Los datos DXF no se envían al servidor ni pasan al simulador, al CNC o al utillaje activo.

Siguen rechazándose SPLINE, INSERT, bloques, datos 3D, DWG y STEP, elevaciones, arcos inválidos y otros datos que no se puedan representar con seguridad. Las entidades sueltas no se ensamblan automáticamente.

Archivos: cad-profile.js, cad-profile-view.js, editor2d.css, sw.js, EJEMPLO_ARCOS_CAPAS.dxf, tests/cad-arcs-report.test.cjs y actualizaciones de pruebas/documentación. Pruebas finales: 103 casos automatizados y navegador en PC (1440 px), tablet (820 px) y móviles (390 y 320 px) sin errores JavaScript ni desbordamiento horizontal detectados. Esto NO equivale a una certificación geométrica o industrial.
