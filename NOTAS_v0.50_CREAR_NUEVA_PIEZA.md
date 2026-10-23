# Plegar Pro Basic — v0.50 | Crear nueva pieza en 2D y 3D

Nueva función integrada en los dos módulos de programación, manteniendo el diseño aprobado del menú y de la portada.

## Flujo

1. En **Programación 2D** pulsar **Crear nueva pieza** encima de la tabla de medidas, o desde controles principales.
2. En **Programación 3D** pulsar **Crear nueva pieza 3D** encima del visor.
3. Introducir **nombre, material, espesor, ancho total, punzón, matriz V, radio interior supuesto, factor K, referencia de cotas, tope X y altura H opcional de matriz**.
4. Añadir o retirar alas. Introducir **longitud de cada tramo**, y para cada pliegue los **grados** y si se quiere **arriba (+)** o **abajo (−)** en la vista nominal.
5. Elegir **orden** con el selector de cada pliegue o pulsando sucesivamente **B1, B2...** en el dibujo. La vista previa 2D acotada y 3D cambian con las medidas.
6. Pulsar **Crear pieza y abrir 2D / 3D**. Se guardan las medidas en el editor compartido y se abre el módulo desde donde se inició el asistente.
7. **Cancelar** descarta el borrador y conserva íntegramente el programa que estaba abierto.

La creación admite entre **2 y 24 tramos**, con **1 a 23 pliegues**. Se valida cada tramo y ángulo; cada pliegue aparece exactamente una vez en el orden.

## Conceptos dimensionales

Los ángulos introducidos son **giros nominales firmados de los segmentos**, no ángulos de apertura del control numérico. Un signo positivo dibuja el giro hacia arriba en el sistema del perfil, un signo negativo hacia abajo. Para ejecutar un pliegue negativo en una máquina puede requerirse reorientar la pieza. El programa no calcula ese volteo físico.

**El modelo visual es nominal, sin CAD ni trayectoria real certificada; los órdenes programados no acreditan que se eviten colisiones con mesa, trancha, matriz, punzón o topes.** El desarrollo calculado depende del radio, la referencia de las cotas y el factor K supuestos. No es un programa CNC validado.

## Verificación

- `node --test tests/*.test.cjs` incluye pruebas de límites, material, espesor, formas, sentidos y elección táctil de secuencia.
- `python tests/continuity-examples-browser.py` cubre creación/cancelación desde 2D, creación desde 3D, captura de ancho sin corrupción, carga de perfil resultante y adaptabilidad PC/móvil.
- Caché offline actualizada a `plegar-pro-forming2d-v50`.
