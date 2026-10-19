# Notas de versión v0.23

- Detecta retrocesos solapados entre dos segmentos adyacentes del mismo contorno: la versión anterior ignoraba cualquier par adyacente.
- Informa coordenadas nominales X/Y de cruces, uniones T, solapes y proximidades (aproximaciones sobre tramos muestreados).
- Panel con cinco casos visibles; informe JSON mantiene hasta 80 ejemplos. No transforma el documento DXF.
- Cinco pruebas automáticas nuevas (164 total). Playwright revisado en 1440/820/390/320 px.
- Preserva la interfaz Inicio, la selección de punzón/matriz y las advertencias SIN VERIFICAR / NO CNC.

## Límites

Los arcos se trabajan mediante discretización, no con intersecciones paramétricas CAD exactas. El resultado sigue siendo una ayuda de revisión, nunca una certificación de seguridad ni una instrucción de fabricación.
