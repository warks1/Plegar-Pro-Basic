# Plegar Pro Plus v0.21 — Conectividad nominal DXF

- Nuevo grafo no destructivo de extremos de entidades DXF 2D abiertas.
- Detecta cadenas nominalmente abiertas, ciclos nominales, bifurcaciones y agrupamientos ambiguos por tolerancia transitiva.
- Comparte tolerancia 0–1 mm y filtro de misma capa del análisis topológico v0.20.
- Informe JSON descarga solo metadatos del diagnóstico, estado NO HABILITADO e identificación SHA-256 del DXF (si disponible).
- No une líneas, no garantiza cierre geométrico, no genera sólidos 3D ni habilita CNC o control de colisiones.
- No se modifica la interfaz Inicio ni el perfil activo.

## Pruebas

`node --test tests/*.test.cjs`: 147 pruebas superadas.
`python tests/browser_check.py`: cuatro tamaños PC/tablet/móviles; sin desbordamientos ni errores JS detectados.

## Uso

Abrir Programación 2D, importar un DXF, revisar el nuevo panel de conectividad situado bajo Topología DXF y descargar el informe si se precisa.
