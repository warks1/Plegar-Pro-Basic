# Comprobación de contornos de matriz y tope — v115

La comprobación anterior de matriz usaba una V triangular incluso cuando el dibujo mostraba fondos planos o radios. Ahora comprueba cruces entre franjas con el espesor de chapa y el polígono representado de la matriz, incluyendo el perfil ensamblado de alas previas.

El tope deja de comprobarse con una única línea de muestreo. Se emplea su contorno representado (dedo V85 cuando corresponde, rectángulo nominal para otras máquinas). Esto detecta también alas verticales cuyo espesor penetra en el tope sin que lo atraviese su eje.

Los bordes en contacto no se consideran penetración. Cada franja se reduce una tolerancia de hasta 0,05 mm por lado para evitar alertas por ruido numérico. Un borde detrás del tope sin cruce del contorno produce una alerta de colocación separada de la alerta de penetración. La vista 2D muestra estos estados directamente, conservando la distancia X proyectada como dato separado.

El campo heredado `maxDiePenetration` pasa a `null`: ya no se proporciona una profundidad ficticia respecto a la V triangular. Se devuelven los índices de segmentos con solape (`dieOverlapSegments`, `backgaugeOverlapSegments`) y `contactTolerance`.

Validación: 23 pruebas de contacto, contornos, catálogo, hombros y caché. Incluyen contacto frontal, alas verticales, cruces entre muestras, contención, huecos cóncavos, perfil completo y colocación detrás del tope. No se ha realizado revisión visual completa en navegador.

Limitaciones: no resuelve las uniones entre franjas, la profundidad exacta de penetración, trayectorias barridas ni contacto físico. Depende de la fidelidad de los contornos y la pose ensamblada, que siguen teniendo partes provisionales. No certifica ausencia de colisiones ni seguridad de máquina.
