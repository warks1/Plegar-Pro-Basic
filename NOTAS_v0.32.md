# Plegar Pro Plus v0.32 — Integridad y adaptación móvil

Fecha: 2026-10-20.

- Recuperados desde el historial de GitHub los archivos Planos omitidos por las versiones responsive: `plans-core.js`, `plans-view.js`, `plans.css`, `repo-plans.js`, 10 PDF y 10 miniaturas de Trenirtrade, y sus pruebas. Se restauraron sus blobs originales.
- `responsive-v32.css` mejora encabezados, márgenes y áreas seguras de módulos sin rediseñar Inicio ni el splash.
- La tabla de pliegues se desplaza horizontalmente dentro de su panel en móviles estrechos, con una indicación y acceso por teclado.
- `tests/repository-integrity.test.cjs` comprueba scripts, hojas de estilo, caché offline, archivos PDF y miniaturas para prevenir pérdidas en futuras versiones.
- `tests/mobile-workspace-check.py` revisa Inicio, Planos, Programación 2D y Simulación 3D en cinco tamaños (320, 390, 667 horizontal, 820, 1440 píxeles).
- Validación local: 201 pruebas Node superadas; Planos → Programación → Simulación 3D y splash responsive probados sin desbordamiento general en los tamaños previstos.

Los documentos fotográficos no equivalen a CAD editable ni autorizan uso CNC. El repositorio es público y los PDF de Trenirtrade también.
