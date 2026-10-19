# Plegar Pro Plus — Estado recuperable

Fecha de actualización: 2026-10-19  
Versión: **v0.13** (prototipo)  
Repositorio: https://github.com/warks1/Plegar-Pro-Basic  
Versión de referencia antes de v0.13: `9aca62115171eba3790ecfae74cfc5294e25c7e7` (v0.12).

## Diseño aprobado

El boceto de Inicio **no se debe sustituir por otra interfaz**. Referencia: `assets/referencia-aprobada.webp`. La pantalla debe conservar menú, paneles, disposición, imágenes y estética industrial aprobada. Usar distribución adaptativa en PC, tablet y móvil.

## Funciones construidas

- Programación 2D con edición de segmentos, ángulos y orden, guardado local, deshacer/rehacer e importación/exportación JSON.
- Desarrollo nominal estimado por Ri, K y espesor; advertencias sobre hipótesis.
- Seguimiento 2D de perfil con punzón, matriz, tope X, radio ilustrativo y cribado de distancias.
- Visor de chapa 3D y herramientas extruidas genéricas, giro/zoom, estados de secuencia y cribados geométricos aproximados.
- **v0.13:** biblioteca de herramientas paramétricas `tool-library.js`, 8 punzones y 21 matrices, identificadores estables, fichas de dimensiones y origen no verificado, integración con perfiles 2D/3D y pruebas.

- **v0.13:** 5 fichas dimensionales AMADA consultables (3 punzones, 2 matrices) con fuentes oficiales y 4 referencias de catálogos; `manufacturer-references.js`, `FUENTES_UTILLAJE.md` y pruebas. Las fichas oficiales no alimentan todavía el motor de geometría.

## Advertencias indispensables

**Nada está validado para producción industrial.** No hay gemelos digitales oficiales, tolerancias reales, control CNC, fuerza, recuperación elástica ni colisiones CAD barridas. Las nuevas alturas y medidas de herramientas se crean para el prototipo: **no representan cotas certificadas de MECOS, AMADA, Trumpf u otros fabricantes**. La web puede publicarse mediante GitHub Pages; la publicación debe verificarse para cada commit.

## Próxima fase v0.14

Verificar y ampliar las referencias de catálogos con planos dimensionales completos y perfiles CAD contrastados; crear importación de geometrías de utillaje con comprobaciones de integridad y compatibilidad antes de activarlas en simulación. Mantener el diseño aprobado, publicar solo tras pruebas y verificar GitHub Pages para cada commit.
