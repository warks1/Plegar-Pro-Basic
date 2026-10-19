# Plegar Pro Plus 0.18 — Auditoría dimensional nominal de montaje

**Estado:** prototipo técnico de inspección. **SIN VERIFICAR / NO PARA CNC / NO PARA VALIDAR COLISIONES.**

## Qué se añadió

- Panel autónomo de auditoría en Programación 2D → Importar DXF, sin reemplazar ni modificar la portada aprobada.
- Elección de línea horizontal nominal desde el borde inferior o superior del contorno 2D orientado, con desplazamiento de -500 a +500 mm.
- Informe de distancias nominales a los extremos y diferencias con altura y ancho publicados en la ficha seleccionada (cuando están disponibles).
- Lista explícita de requisitos sin resolver: geometría CAD sólida, superficie real de amarre, adaptador/compatibilidad máquina, tolerancias y colisiones.
- Exportación descargable de la auditoría en JSON; la salida incluye `mountingVerified=false`, `approvedForSimulation=false` y `approvedForCNC=false` en todos los casos.
- 8 pruebas automáticas nuevas, total 121 tests Node exitosos, y pruebas de interacción en 1440×900, 820×1180, 390×844 y 320×720 píxeles.

## Sin atajos de validación

Una coincidencia de altura o anchura **no acredita** compatibilidad de máquina ni montaje. La línea nominal es un artificio de dibujo para comparar medidas, no una referencia mecánica confirmada. Los DXF siguen aislados del utillaje activo y del motor de simulación. No se añadieron datos falsos de fabricantes, geometrías inventadas ni códigos CNC.

## Continuidad v0.19

Preparar esquema CAD de herramienta con identidad de fuente, ejes y plano de amarre definidos por documentación verificable. Solo permitir usar un contorno extruido en comprobaciones experimentales separadas cuando la geometría sea válida y marcada explícitamente como no certificada. Antes de cualquier uso industrial, contrastar CAD y montaje con perfiles de fabricante y máquina física.

**Repositorio:** https://github.com/warks1/Plegar-Pro-Basic
**Boceto aprobado:** `assets/referencia-aprobada.webp`. No modificar sin aprobación.
