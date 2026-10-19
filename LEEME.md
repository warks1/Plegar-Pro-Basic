# Plegar Pro Plus — v0.14

Continúa el prototipo original aprobado (sin rediseñar Inicio).

**Nueva función:** inspección de un contorno DXF ASCII 2D LWPOLYLINE con unidades, cotas, validación geométrica y comparación no certificada con fichas AMADA. Archivo de prueba incluido: `EJEMPLO_PERFIL_UTILLAJE.dxf` (ficticio).

Abre `index.html` mediante servidor web local o GitHub Pages, navega a **Programación 2D → Importar perfil CAD**. El DXF no modifica las piezas ni el utillaje del simulador.

Pruebas: `node --test tests/*.test.cjs` y `python tests/browser_check.py`.

La simulación no está validada para producción ni para garantizar seguridad de máquina.
