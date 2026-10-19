# Plegar Pro Plus — Entrega v0.17

Ejecutar con servidor web local o GitHub Pages. Inicio mantiene la interfaz visual aprobada. Entrar en **Programación 2D → Importar DXF 2D v0.17**.

1. Seleccionar el archivo `EJEMPLO_PERFIL_MULTICAPA.dxf`.
2. Dejar `$INSUNITS` automático. Comprobar la vista previa y las tres capas.
3. Cambiar la capa y elegir otro contorno: se muestran cotas individuales y la comparación documental correspondiente.

Importador **solo para inspección**, sin agregar DXF a simulación ni CNC; los datos de fabricante tampoco certifican un sólido geométrico. Ejecutar `node --test tests/*.test.cjs` y `python tests/browser_check.py` (requiere Chromium y Playwright).

**v0.16:** arcos DXF y bulges de LWPOLYLINE, informe CSV/JSON local; ver README y ESTADO_PROYECTO.

**v0.17:** Tras importar, selecciona un contorno y prueba el giro, el espejo y el origen nominal. La cruz naranja es una referencia visual calculada, no un amarre real. Puedes descargar un informe con la orientación. Los datos son de inspección; la simulación/CNC no los utiliza.

La v0.19 añade registro de inspecciones DXF solo con metadatos locales. Consultar NOTAS_v0.19.md.
