# Versión 0.33 — Visor y trazado asistido
## v0.33 — Visor de planos con zoom y marcado asistido (2026-10-20)

- `Planos → Abrir en Programación` abre ahora el plano seleccionado en un **visor ampliado con zoom entre 100 y 500 %**, rueda del ratón o controles +/−, centrado y desplazamiento por arrastre (ratón/dedo). La fotografía original de la ficha de cliente se conserva en PDF, y los 10 PDF públicos de Trenirtrade disponen de vistas WebP de 1260 píxeles basadas en las fotografías originales, sin OCR ni alteración de las cotas.
- El botón **Marcar pliegue** permite seleccionar dos puntos sobre el plano y superponer una línea numerada B1, B2, etc. Las marcas visuales se guardan en el `localStorage` del navegador **por identificador de plano** (máximo 24) y pueden deshacerse. No se convierten en ejes CAD ni aportan cotas automáticamente.
- Las longitudes y ángulos siguen introduciéndose y confirmándose manualmente antes de simular. Si el usuario cambia una cota de la ficha tras configurar el perfil, se deshabilita la navegación a simulación hasta volver a crear el perfil. Todos los resultados siguen etiquetados SIN VERIFICAR / NO CNC.
- Se conservan la interfaz de Inicio, pantalla de carga animada, documentos PDF, miniaturas, biblioteca Planos y programación/simulación previa.
- Pruebas: `node --test tests/*.test.cjs`; `python tests/plans-zoom-trace.test.py` y `python tests/plans-programming.test.py`, `python tests/browser_check.py`, además de las pruebas existentes para móvil.
- Limitaciones: sin vectorización OCR/IA certificada, sin conversión automática de fotos a CAD/CAM y sin inferencia de espesor o radios. Las vistas WEBP forman parte del repositorio público, como los PDF ya publicados.
