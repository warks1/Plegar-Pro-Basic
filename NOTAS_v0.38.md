# Plegar Pro Plus v0.38 · Planos 2D/3D vinculados a Programación

## Alcance entregado
- Se amplió el módulo Planos existente, sin crear un segundo módulo. Mantiene carpetas por cliente, importación de PDF, fotos, imágenes, DXF, cámara y ZIP.
- Nuevo botón «Importar captura»: selecciona una captura del dispositivo y la guarda como PDF de referencia. El reconocimiento automático de medidas desde píxeles no se declara implementado; es necesario indicar dimensiones en Programación 2D antes de crear un dibujo geométrico.
- Nuevo `plan-drawing.js` genera un SVG 2D con longitudes nominales, signos de ángulos y número/orden de pliegues desde los tramos del perfil validado; extruye esos puntos para crear una malla volumétrica nominal y renderiza una vista axonométrica SVG 3D con ancho introducido explícitamente.
- Programación 2D: «Crear y guardar plano 2D + 3D» y campo de ancho. Módulo Planos: mismo motor, nombre opcional, carpeta de cliente y ancho.
- El guardado IndexedDB incluye una ficha PDF combinada de ambas vistas, los SVG individuales, miniatura y archivo JSON de geometría editable, que se puede recuperar con «Abrir en Programación».
- La copia ZIP de los planos generados añade los SVG y el JSON, junto a PDF; los planos previos mantienen su estructura.
- Simulación 3D: vistas Perfil, Frontal, Superior e Isométrica. Se corrige la invalidez del encuadre caché al editar el perfil.
- La pantalla de inicio aprobada, fotografías existentes y plano originales no se alteraron. Precaché PWA v38 para actualizar scripts.

## Pruebas
- Nuevos tests Node de generación documental `tests/plan-drawing.test.cjs`.
- Workflow `.github/workflows/motores.yml` que ejecuta `node --test tests/*.test.cjs` bajo Node 22; corregidas tres referencias indefinidas en test legado `tests/cad-crossings.test.cjs`.
- GitHub Actions run 39944417736 terminado con éxito (23-10-2026).
- Pendiente: pruebas end-to-end del guardado de PDF/IndexedDB y visualización en navegadores físicos, especialmente Safari iOS y tablets.

## Limitaciones y seguridad
- Documentación geométrica nominal sin garantía de fabricación: el perfil representa vértices teóricos y la malla 3D es una extrusión de espesor, no un sólido CAD certificado con radios, tolerancias ni recuperación elástica.
- Importar una captura no extrae automáticamente cotas, pliegues ni geometría 3D; los perfiles se derivan solo de medidas y ángulos introducidos o confirmados.
- No exporta STEP/DWG/STL nativos ni envía CNC. No valida colisiones reales, cargas, topes, contacto físico ni secuencias de la máquina.
- Los archivos nuevos permanecen en IndexedDB del dispositivo actual. Sin copia ZIP externa, el borrado de datos del navegador los eliminaría. No hay sincronización entre dispositivos.
