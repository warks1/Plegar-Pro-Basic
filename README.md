# Plegar Pro Plus · Prototipo v0.4

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

## v0.4 · Vista cinemática 2D (no validada para fabricación)

En **Programación 2D** y **Simulación 2D** hay una vista de perfil con punzón arriba, matriz V abajo, tope posterior fijo y chapa. Utiliza el mismo perfil local, orden de plegado, ángulos firmados, punzón genérico, matriz y espesor.

Control de reproducción, pausa, avance manual, pasos, selección de pliegue y zoom. Se dibuja solo el par de tramos adyacentes al pliegue activo. La carrera es una geometría cinemática ilustrativa: `profundidad = (V/2) * tan((|ángulo|*avance)/2)`; NO es una carrera real de máquina. El punzón y la matriz son símbolos genéricos y el tope no sigue la chapa.

**No representa:** radios reales, deformación plástica, contacto, fuerzas, recuperación elástica, interferencias con alas previamente plegadas, reorientación de pieza para pliegues negativos ni seguridad. Alertas por geometría idealizada NO son una detección de colisiones verificada.

Archivos: `forming2d.js`, `forming2d-view.js`, `forming2d.css` y `tests/forming2d.test.cjs`. La portada aprobada permanece sin cambios.
