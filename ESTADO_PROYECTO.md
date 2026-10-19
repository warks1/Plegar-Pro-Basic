# Plegar Pro Plus — Punto de recuperación

**Fecha de guardado:** 2026-10-19  
**Última versión desarrollada:** v0.10  
**Repositorio:** https://github.com/warks1/Plegar-Pro-Basic  
**Rama principal:** main  
**Commit de la versión 0.10 (anterior a esta nota):** bf6d67cacbfe9334af2cc5d2c0139d972915ca49

## Identidad visual aprobada — no sustituir

La referencia visual elegida por el usuario es el boceto conservado como `assets/referencia-aprobada.webp`. Debe respetarse la distribución visual y estética de la pantalla Inicio: menú lateral, paneles 2D/3D, máquina principal, utillaje, cálculos, colores azul noche y azul eléctrico. No reinterpretar ni rediseñar la interfaz sin petición expresa. Adaptar las funciones a PC, tablet y smartphone.

## Estado del desarrollo hasta v0.10

- Programación 2D editable: tramos, ángulos, secuencia, deshacer/rehacer, guardado y JSON.
- Cálculo orientativo de desarrollo y selección independiente de punzón y matriz.
- Vista de seguimiento 2D de perfil con chapa, punzón, matriz, tope X configurable y arcos tangentes aproximados.
- Primeras representaciones de alas previas, perfiles paramétricos e indicadores de proximidad/interferencia orientativos.
- Visor geométrico 3D con chapa extruida, herramientas genéricas, giro, zoom, visibilidad y sincronización con Programación 2D.
- Versión v0.10: identificación de tramos plegados, activos y pendientes en el visor, y panel de holguras orientativas 2D.
- Comprobaciones automáticas registradas hasta v0.10: 59 pruebas, más comprobaciones de interfaz en cuatro tamaños, según el registro del desarrollo.

## Límites que se deben mantener claros

- La simulación 2D/3D es ilustrativa: no es una validación de colisiones CAD ni una certificación de seguridad industrial.
- Los modelos actuales de punzones, matrices, topes y máquinas son genéricos; aún no son gemelos CAD verificados de máquinas reales.
- Los desarrollos son estimaciones hasta validación contra material, utillaje y parámetros reales.
- GitHub Pages no se había confirmado publicado en v0.10.
- La publicación en App Store, Microsoft Store y Google Play sigue pendiente de empaquetado, pruebas y revisión.

## Siguiente fase: v0.11

1. Mejorar perfiles geométricos de chapa y utillaje en 3D.
2. Ampliar modelado y posiciones nominales de máquina, tope y herramientas.
3. Preparar un cribado de interferencias tridimensionales, rotulado como aproximado hasta validarlo.
4. Conservar siempre la pantalla Inicio basada en el boceto aprobado.
5. Ejecutar pruebas técnicas, revisar responsividad y subir los cambios verificados a este mismo repositorio.

## Instrucción de continuidad

Al recibir «Seguir», retomar desde el último commit verificado de `main`; comprobar el código existente antes de editar, mantener el diseño aprobado, ejecutar pruebas y publicar un commit para los cambios validados. No afirmar que la app está desplegada o validada sin comprobación directa.
