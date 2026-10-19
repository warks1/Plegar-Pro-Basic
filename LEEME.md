# Plegar Pro Plus v0.23

**Abrir:** https://warks1.github.io/Plegar-Pro-Basic/

En **Programación 2D**, carga `EJEMPLO_CRUCES_DXF.dxf` y consulta el panel **Cruces y continuidad de perfiles DXF**. Ajusta la tolerancia en el panel de topología y exporta el informe JSON. No se modifican utillajes ni CNC.

**NO PARA FABRICACIÓN.** Curvas discretizadas, sin sólidos CAD ni validación de amarres/colisiones. Los recuentos PARCIALES no demuestran ausencia de fallos. Inicio conserva el diseño aprobado.

Pruebas: `node --test tests/*.test.cjs` y `python tests/browser_check.py`.

**Nuevo en v0.23:** informa también retrocesos solapados entre segmentos consecutivos y muestra coordenadas X/Y nominales de las primeras incidencias. Los DXF permanecen fuera del simulador y CNC.
