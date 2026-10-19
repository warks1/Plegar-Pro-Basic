# Plegar Pro Plus — Entrega v0.25

**Ver en web (GitHub Pages):** https://warks1.github.io/Plegar-Pro-Basic/  
**Repositorio:** https://github.com/warks1/Plegar-Pro-Basic

La interfaz de Inicio y su imagen aprobada en `assets/referencia-aprobada.webp` se mantienen sin cambios.

## Probar el nuevo panel

1. Abre **Programación 2D** e importa `EJEMPLO_PERFIL_MULTICAPA.dxf` o `EJEMPLO_ARCOS_CAPAS.dxf`.
2. En **Topología DXF y referencias A–B**, examina abiertos/cerrados y las posibles coincidencias de extremos. El filtro por capa y la tolerancia 0–1 mm son configurables.
3. Selecciona un contorno orientado. Los puntos A–B se calculan de la **envolvente**, no representan amarres reales.
4. En **Conectividad de contornos v0.21**, revisa cadenas nominales, extremos y bifurcaciones: los ciclos siguen sin validación para 3D.
5. Revisa los cruces y retrocesos solapados DXF, con coordenadas X/Y nominales en el nuevo panel v0.23.
6. Exporta los informes; no se activa ningún DXF para CNC.

Pruebas: `node --test tests/*.test.cjs` y `python tests/browser_check.py` (Python Playwright + Chromium). El conjunto incluye 164 pruebas Node.

**NO APTA PARA FABRICACIÓN.** DXF, cotas, anidamientos y puntos A–B son exclusivamente orientativos; faltan geometría de sujeción, validación de sólidos CAD, datos de máquina y verificación industrial.

## Nuevo en v0.24

En **Programación 2D**, importa `EJEMPLO_TANGENCIAS_DXF.dxf` y baja hasta **Tangencias de arcos DXF**. Ajusta la tolerancia angular 0–10 grados y revisa el análisis independiente del módulo de cruces. El botón **Exportar informe de tangencias JSON** guarda los resultados de inspección con el bloqueo `NO CNC`.

Para los arcos circulares se calculan también las cotas X/Y extremas desde el centro y radio originales; la previsualización sigue aproximada por puntos. Ninguna tangencia constituye un amarre verificado ni puede activar geometría real en una máquina.


## NUEVO: Simulación 3D (v0.25)

1. Abre **Simulación 3D**. Pulsa **Reproducir paso** para ver cómo baja el punzón, se pliega la chapa y se retira.
2. Usa **Reproducir secuencia** para ejecutar de forma visual los pliegues en el orden programado.
3. Puedes pausar, ajustar velocidad o arrastrar la barra de ciclo. El control no mueve una máquina real.
4. El motor sigue una trayectoria supuesta; NO permite certificar colisiones ni enviar datos CNC.

Pruebas v0.25: 183 automáticas y navegación Playwright 1440, 820, 390, 320 px.


**v0.26:** La simulación 3D tiene un nuevo panel de muestreo de proximidades durante el ciclo. Revisa alas anteriores, punzón, matriz y tope nominales en 25 posiciones y permite exportar JSON. No comprueba movimiento continuo ni colisión física; no usar para fabricación. Pruebas: 189 Node y cuatro resoluciones de navegador.

**v0.27 Planos:** abre Planos desde el menú. Crea una carpeta, importa una foto o un fichero; encontrarás PDF y miniatura donde el formato permite dibujarla. Conserva copias ZIP por cliente porque el almacenamiento es local del dispositivo y puede perderse al borrar datos del navegador. Para STEP/DWG/SolidWorks se crea ficha PDF, no sólido convertido.

**v0.28:** Nuevo botón **Importar carpeta ZIP** en Planos para instalar carpetas privadas de PDFs y miniaturas. Los 10 documentos de Trenirtrade se entregan en un ZIP aparte: no se publican en GitHub.


### Planos Trenirtrade
En **Planos → Trenirtrade** se ven los diez PDFs del repositorio, sus miniaturas y la opción **Abrir en Programación**. Al abrir un plano aparece junto al editor 2D; introduce los dos primeros tramos, el ángulo y el espesor, pulsa **Crear perfil 2D** y completa todos los pliegues reales en el editor antes de pulsar **Simular 2D/3D**. El resultado es una representación del perfil que programes, no una interpretación CAD automática del PDF. Los PDFs son públicos en el repositorio; las copias privadas importadas al navegador no se publican.