# Plegar Pro Plus — Entrega v0.20

**Ver en web (GitHub Pages):** https://warks1.github.io/Plegar-Pro-Basic/  
**Repositorio:** https://github.com/warks1/Plegar-Pro-Basic

La interfaz de Inicio y su imagen aprobada en `assets/referencia-aprobada.webp` se mantienen sin cambios.

## Probar el nuevo panel

1. Abre **Programación 2D** e importa `EJEMPLO_PERFIL_MULTICAPA.dxf` o `EJEMPLO_ARCOS_CAPAS.dxf`.
2. En **Topología DXF y referencias A–B**, examina abiertos/cerrados y las posibles coincidencias de extremos. El filtro por capa y la tolerancia 0–1 mm son configurables.
3. Selecciona un contorno orientado. Los puntos A–B se calculan de la **envolvente**, no representan amarres reales.
4. Pulsa **Exportar topología y referencias JSON**; todo se procesa en el navegador y no se activa en CNC.

Pruebas: `node --test tests/*.test.cjs` y `python tests/browser_check.py` (Python Playwright + Chromium). El módulo nuevo incluye 10 pruebas topológicas.

**NO APTA PARA FABRICACIÓN.** DXF, cotas, anidamientos y puntos A–B son exclusivamente orientativos; faltan geometría de sujeción, validación de sólidos CAD, datos de máquina y verificación industrial.
