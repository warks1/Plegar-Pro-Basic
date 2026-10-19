# Plegar Pro Plus — Estado guardado v0.17

- **Repositorio:** https://github.com/warks1/Plegar-Pro-Basic
- **Rama:** `main` (consultar el último commit confirmado; no asumir que GitHub Pages ya desplegó la actualización).
- **Identidad visual aprobada:** `assets/referencia-aprobada.webp`. Conservar la pantalla Inicio, estilos globales y recursos originales.
- **Versión del prototipo:** v0.17, importación DXF con arcos y vista de orientación nominal para inspección.

## Capacidades actuales (resumen)

- Programación 2D editable, orden de plegado, deshacer/rehacer, guardado local y JSON.
- Desarrollo orientativo, selección de utillajes genéricos y catálogo documental AMADA; las herramientas genéricas no tienen geometría certificada.
- Seguimiento 2D y visor 3D paramétricos ilustrativos con controles, cribado de interferencias **aproximado** y avisos; no aptos para validar una fabricación.
- Inspección de DXF ASCII: `LWPOLYLINE` y `LINE` 2D en múltiples capas/contornos, escalado por `$INSUNITS` o selección manual, vista previa y comparación de cotas por elemento. Límite 2 MB, 100 entidades, 1500 vértices.
- Documentación de fuentes parciales de fabricante en `FUENTES_UTILLAJE.md`.

## Lo que NO hace v0.17

- **No** convierte contornos DXF a sólidos, **no** ejecuta CNC, **no** activa herramientas importadas, **no** verifica compatibilidad ni colisiones.
- Rechaza entidades no admitidas: SPLINE, INSERT y bloques, DXF binario, DWG, STEP, perfiles con elevación no nula y anchuras de polilínea; ARC, CIRCLE y bulges ya son inspeccionables con discretización visual.
- LINE se representa por separado; sin construcción automática de perfiles encadenados ni inferencia de cierres.
- No se ha publicado ni certificado una aplicación en tiendas móviles o Microsoft Store.

## Próxima fase v0.19

Investigar perfiles dimensionales completos y trazabilidad de montaje sin asumir compatibilidad de utillaje, y preparar pruebas de validación CAD externa. Mantener las advertencias y no habilitar simulación de seguridad sin validación mecánica.

## Instrucciones para continuar

1. Recuperar el último commit del repositorio y ejecutar las pruebas con Node 22.
2. Mantener exactamente el diseño aprobado.
3. Comprobar importador, compatibilidad v0.14, UI a 1440/820/390/320 px, y comprobar estado Pages tras cada commit.
4. Separar claramente lo experimental de cualquier geometría verificada antes de habilitar operaciones reales.

### Guardado v0.16 — 2026-10-19

- DXF ASCII con segmentos `LINE`, `LWPOLYLINE`, `ARC`, `CIRCLE` y bulges por vértice.
- Reconstrucción de arcos únicamente para vista 2D; verificación de cierre y autointersección sobre la polilínea muestreada.
- Informe descargable JSON/CSV, cotas por entidad y capas, estado **SIN VERIFICAR**.
- Nuevos ejemplos y 103 pruebas automáticas superadas más pruebas de navegador en cuatro anchuras.
- No se modifica la portada aprobada ni los motores de colisión/cálculo CNC; las geometrías CAD no participan en fabricación ni simulación física.
- Siguiente: DXF con tolerancias y sólidos paramétricos después de validar geometría y amarre.

### Guardado v0.17 — 2026-10-19

- Inspección DXF con rotación 0/90/180/270°, espejo y cinco referencias de origen **NOMINALES** obtenidas de la envolvente 2D.
- Vista orientada independiente; cruz naranja = origen nominal, nunca amarre verificado.
- Cotejo de altura Y/ancho X orientados contra ficha documental de fabricante con tolerancia configurable (0 a 10 mm); coincidencia NO acredita compatibilidad.
- Informes JSON/CSV con metadatos de orientación y `amarre_validado=false`, `activado_en_simulacion=false`.
- 113 pruebas automáticas y cuatro tamaños de pantalla comprobados en navegador de pruebas.
- No se han modificado estilos ni recursos de Inicio; **no** se ha integrado el DXF en motor 3D o CNC.


## Punto de recuperación: v0.19

Añadido registro voluntario de metadatos de DXF con SHA-256 de los bytes originales, exportación JSON y borrado local. **No se guarda el DXF ni se activa en simulación/CNC**. 129 pruebas Node y cuatro anchos de interfaz comprobados. Diseño de Inicio intacto. Siguiente fase: ampliar comprobaciones CAD y documentación de amarre, sin certificar utillaje sin evidencia real. Ver `NOTAS_v0.19.md`.
