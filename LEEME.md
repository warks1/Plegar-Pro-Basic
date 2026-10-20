# Plegar Pro Plus v0.32 — Continuidad

La versión v0.32 mantiene la pantalla de carga responsive y mejora la navegación de módulos en móvil.

**Corrección prioritaria:** se han recuperado de GitHub los diez PDF de Trenirtrade, sus miniaturas y los archivos del módulo Planos omitidos de la versión desplegada en v0.31. Se añadió prueba contra futuras pérdidas (`tests/repository-integrity.test.cjs`).

Para revisar: `node --test tests/*.test.cjs`, `python tests/mobile-workspace-check.py`, `python tests/plans-programming.test.py` y `python tests/splash-responsive-check.py`.

Abrir: https://warks1.github.io/Plegar-Pro-Basic/

**No industrial:** las simulaciones y las fotos importadas no reemplazan geometría CAD verificada ni autorizan uso CNC.

Versión actual: v0.33. Planos → Programación 2D permite zoom, desplazar imagen y marcar líneas B1… con confirmación manual de medidas. No CAD automático ni CNC.
