# Plegar Pro Plus v0.42 · Catálogo de piezas, planos y Programación 2D

Se actualizó directamente el repositorio `warks1/Plegar-Pro-Basic` en la rama `main`.

## Entregas
- Catálogo de 12 perfiles de chapa distintos en `sample-library.js`: soportes, cubiertas, bandejas y perfiles L, U, Z, Omega, con retornos y escalones. Cada ejemplo contiene su propio plano SVG 2D con tramos y pliegues, dibujo 3D, material, espesor, orden y ancho NOMINALES.
- `Proyectos` representa dos vistas por tarjeta y conserva los proyectos previamente guardados. Los ejemplos están identificados; nuevos proyectos sin plano producen BORRADOR 2D/3D para completar, nunca geometría verificada.
- `Planos`: biblioteca visible de 12 parejas 2D/3D. Botones para editar su perfil o guardar PDF, vistas SVG y JSON en IndexedDB. Los datos existentes no se eliminan. Se corrigió el click de guardar/programar.
- `Programación 2D`: panel de configuración visible desde arriba, sin buscar los campos más abajo. Punzón, matriz, material, espesor, ancho real, radio Ri supuesto, factor K y tope X nominal, más acceso directo a reproducción.
- Selección del orden: modo táctil y pasos visibles junto a cada círculo de pliegue, con prevención de asignación doble. Edita automáticamente la secuencia guardada en programa.
- `engineering-checks.js`: fuerza nominal estimada a partir de resistencia supuesta (Rm), longitud de plegado y V, comparación V/e, ala corta, intersecciones y desarrollo; valores orientativos sin datos de máquina.
- `sheet-offset.js`: espesores en bisectriz y límite de miter para ángulos extremos, compartido entre planos 3D y mallas de simulación.

## Validación
- `node --test tests/*.test.cjs` — pruebas de cálculos, motores, hojas de planos y perfiles de ejemplo.
- `python tests/continuity-examples-browser.py` — navegador de escritorio y móvil, incluye edición de herramientas/espesor/orden, SVG por tarjeta y reproducción 2D/3D.
- Verificar el último estado de GitHub Actions antes de anunciar publicación definitiva. Los archivos de clientes existentes en el repositorio público no se modificaron.

## Alcance pendiente
No convierte automáticamente capturas ni PDF en sólidos exactos. Los perfiles 2D no contienen agujeros, formas libres ni radios constructivos completos salvo que se introduzcan en un futuro motor CAD. Las piezas de ejemplo **no corresponden a planos originales** de clientes. No hay posprocesador CNC, cálculos de carga calibrados, movimientos y ejes reales, ni validación de colisiones certificada. No utilizar las simulaciones para fabricar o avalar seguridad.
