# Plegar Pro Plus v0.32 — Continuidad

La versión v0.32 mantiene la pantalla de carga responsive y mejora la navegación de módulos en móvil.

**Corrección prioritaria:** se han recuperado de GitHub los diez PDF de Trenirtrade, sus miniaturas y los archivos del módulo Planos omitidos de la versión desplegada en v0.31. Se añadió prueba contra futuras pérdidas (`tests/repository-integrity.test.cjs`).

Para revisar: `node --test tests/*.test.cjs`, `python tests/mobile-workspace-check.py`, `python tests/plans-programming.test.py` y `python tests/splash-responsive-check.py`.

Abrir: https://warks1.github.io/Plegar-Pro-Basic/

**No industrial:** las simulaciones y las fotos importadas no reemplazan geometría CAD verificada ni autorizan uso CNC.

Versión v0.34: pantalla de arranque completa y adaptable. Las P y la barra siguen animadas. Eliminado «Omitir presentación». Sin cambios en el diseño de Inicio.

Pantalla de carga v0.35: composición expandida a toda el área disponible y barra visible (PC, tablet y smartphone vertical/horizontal).


**v0.36:** navegación de GitHub Pages con página principal desde la red cuando está disponible y respaldo offline si falla. La aplicación consulta actualizaciones del service worker al iniciar sin recargar a la fuerza. La imagen y las animaciones de carga v0.35 no cambian. Detalle en `NOTAS_v0.36.md`.
