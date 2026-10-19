# Plegar Pro Plus — Estado guardado v0.15

- **Repositorio:** https://github.com/warks1/Plegar-Pro-Basic
- **Rama:** `main` (consultar el último commit confirmado; no asumir que GitHub Pages ya desplegó la actualización).
- **Identidad visual aprobada:** `assets/referencia-aprobada.webp`. Conservar la pantalla Inicio, estilos globales y recursos originales.
- **Versión del prototipo:** v0.15, importación DXF multicontorno/multicapa solo para inspección.

## Capacidades actuales (resumen)

- Programación 2D editable, orden de plegado, deshacer/rehacer, guardado local y JSON.
- Desarrollo orientativo, selección de utillajes genéricos y catálogo documental AMADA; las herramientas genéricas no tienen geometría certificada.
- Seguimiento 2D y visor 3D paramétricos ilustrativos con controles, cribado de interferencias **aproximado** y avisos; no aptos para validar una fabricación.
- Inspección de DXF ASCII: `LWPOLYLINE` y `LINE` 2D en múltiples capas/contornos, escalado por `$INSUNITS` o selección manual, vista previa y comparación de cotas por elemento. Límite 2 MB, 100 entidades, 1500 vértices.
- Documentación de fuentes parciales de fabricante en `FUENTES_UTILLAJE.md`.

## Lo que NO hace v0.15

- **No** convierte contornos DXF a sólidos, **no** ejecuta CNC, **no** activa herramientas importadas, **no** verifica compatibilidad ni colisiones.
- Rechaza entidades que aún no se puedan inspeccionar con garantías: ARC/CIRCLE/SPLINE, INSERT, bloques de entidades, DXF binario, DWG, STEP, perfiles con elevación no nula y anchos/bulges de polilínea.
- LINE se representa por separado; sin construcción automática de perfiles encadenados ni inferencia de cierres.
- No se ha publicado ni certificado una aplicación en tiendas móviles o Microsoft Store.

## Próxima fase v0.16

Proponer inspección de segmentos con arco DXF (`ARC` / bulge) a tolerancia de discretización explícita, validación de cerrados y perfiles conexos y posibilidad de exportar la información de inspección como informe. Mantener las mismas advertencias industriales y no activar geometría sin validación.

## Instrucciones para continuar

1. Recuperar el último commit del repositorio y ejecutar las pruebas con Node 22.
2. Mantener exactamente el diseño aprobado.
3. Comprobar importador, compatibilidad v0.14, UI a 1440/820/390/320 px, y comprobar estado Pages tras cada commit.
4. Separar claramente lo experimental de cualquier geometría verificada antes de habilitar operaciones reales.
