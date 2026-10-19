# Plegar Pro Plus · v0.19 — Registro local de inspecciones DXF

**Referencia visual oficial:** `assets/referencia-aprobada.webp`. No se han modificado los archivos ni los estilos de Inicio.

## Funciones nuevas

- Huella **SHA-256** calculada sobre los **bytes originales** de cada DXF ASCII admitido (límite 2 MiB).
- Botón **Registrar inspección local**. Solo con pulsación explícita se guardan: nombre del DXF, tamaño, huella, unidades, capa y contorno seleccionados, orientación, fecha, referencia documental seleccionada y envolvente dimensional.
- **Historial limitado a 20 entradas**, con sustitución de registros repetidos del mismo archivo, contorno y orientación.
- **Exportar registro JSON** para mantener una copia de los metadatos. El archivo DXF completo **no se almacena** ni se incluye en la exportación.
- **Borrar registro individual** o **todos** con confirmación, en el almacenamiento local del navegador.
- Al importar de nuevo un fichero con la misma huella, aparece una indicación de coincidencia con un archivo ya registrado.
- No se envían geometrías CAD a servidores desde esta función. El almacenamiento local puede desaparecer al borrar datos del navegador.

## Seguridad y limitaciones

Una huella SHA-256 demuestra coincidencia de bytes **solo frente a un archivo previamente registrado**; no valida procedencia de fabricante, cotas, topología, amarre, solidez 3D, interferencias ni seguridad. Todos los registros fuerzan `verified=false`, `activeInSimulation=false` y `approvedForCNC=false`. No existe opción para habilitar el uso en CNC desde esta función.

## Pruebas

- `node --test tests/*.test.cjs` → **129 pruebas superadas**.
- `python tests/browser_check.py` → PC 1440, tablet 820, móvil 390 y móvil compacto 320 px; sin excepciones JavaScript ni desbordamientos horizontales detectados.
- SHA-256 cotejada con `node:crypto` (incluido el caso de 2 MiB), validación de registros, borrado, límite, deduplicación, exportación y cambio de archivo.

Pendiente: inspección de validez dimensional de los sólidos 3D y de puntos de amarre reales con referencias de fabricante verificables. No confundir historial documental con verificación industrial.
