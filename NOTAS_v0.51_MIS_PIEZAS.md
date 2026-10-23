# Plegar Pro Basic — v0.51 Mis piezas y edición de perfiles

## Qué ha cambiado

**Programación 2D**: junto a Crear nueva pieza se ofrecen Editar pieza actual, Mis piezas y Guardar en Mis piezas.

**Programación 3D**: junto al botón Crear nueva pieza están Editar pieza actual, Mis piezas y Guardar pieza.

**Crear una nueva pieza** guarda su perfil validado en la biblioteca local cuando se confirma, además de cargarla en ambos módulos. **Editar pieza** abre el mismo formulario con las cotas actuales y, al confirmar, actualiza el registro activo en lugar de duplicarlo. **Cancelar** no modifica la geometría vigente.

**Mis piezas** muestra perfiles de ejemplo diseñados por el usuario, con miniatura acotada nominal, material, espesor, ancho, longitudes, ángulos y orden. Permite abrir en 2D o 3D, guardar cambios explícitos, eliminar con confirmación, exportar un respaldo JSON y restaurar piezas sin duplicar IDs.

## Persistencia y límites

- Almacenamiento exclusivamente **local del navegador**. No hay sincronización entre smartphones, PC, sesiones privadas o dispositivos. Si se borran los datos del navegador, también se pierden las piezas que no se hayan exportado.
- Hasta 80 piezas, con 2–24 tramos cada una; se validan datos y cotas antes de guardar, actualizar e importar.
- «Guardar en Mis piezas» actualiza el programa existente cuando se abrió desde la biblioteca. Si es una nueva geometría todavía sin registro, crea uno nuevo. Los cambios normales en la programación se conservan en el estado activo del navegador, pero **para actualizar la copia de Mis piezas es necesario guardar expresamente**.
- El JSON exportado guarda los datos del programa, NO un archivo CAD/CAM, ni utillajes originales ni programas CNC.
- La biblioteca no sustituye la biblioteca de documentos Planos/IndexedDB: son módulos distintos.

## Seguridad industrial

Los modelos 2D/3D son perfiles nominales. El orden, las interferencias y los desarrollos dependen del montaje real y no demuestran que el plegado sea físicamente ejecutable. **NO utilizar como código CNC validado ni como certificado de ausencia de colisiones.**

## Pruebas

`node --test tests/*.test.cjs` cubre almacén y validaciones. `python tests/continuity-examples-browser.py` prueba creación de dos piezas, edición sin duplicación desde 3D, recuperación desde 2D, preservación de ancho y cotas, y layout en ordenador/móvil.
