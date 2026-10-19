# Plegar Pro Plus · Prototipo v0.5

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
