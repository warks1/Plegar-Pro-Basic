# Corrección de contacto del utillaje — v113

- Los 87 punzones del catálogo usan ahora una punta circular de radio nominal, tangente a los flancos del ángulo indicado. Se elimina la cara plana ancha que antes sustituía la punta. El punto inferior queda en el centro de la herramienta y en la coordenada de contacto del simulador.
- Las matrices de barra con fondo plano usan una misma profundidad en el contorno y en la simulación. Antes la simulación utilizaba la profundidad virtual de una V aguda, por debajo del fondo representado.
- Las matrices de la página 40 no reciben un falso radio de fondo cuando la ficha no lo especifica.
- Las fichas muestran cotas adicionales de ancho total, cuerpo, radio de hombro y pie, conservando el mismo contorno para la representación 2D y la extrusión ilustrativa 3D.

Validación: 10 pruebas de catálogo, integración con la escena y caché; incluyen todos los punzones, matrices de las páginas 40/41 y cuatro estados de plegado con la matriz 22.325. Inspección estática de fichas SVG renderizadas. No se ha realizado una prueba visual de la aplicación completa en navegador.

Limitaciones: los radios de hombro de las matrices se muestran como cotas pero aún no se incorporan al contorno. La altura del pie no acotada y las formas de los cuerpos/cuello de los punzones siguen siendo reconstrucciones provisionales. Esta corrección no convierte los perfiles en CAD oficial ni valida físicamente las colisiones.
