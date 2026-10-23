# Plegar Pro Plus v0.37 — mejoras de reproducción y cinemática

- Perfil 2D: botón «Ciclo completo» que utiliza las mismas tres fases del motor 3D: aproximación (0–22 %), conformado (22–78 %) y retirada (78–100 %). Se mantiene «solo conformado» como funcionamiento predeterminado anterior.
- Encuadre del perfil fijo en las fases del paso, para que matriz/tope no parezcan desplazarse al moverse el punzón.
- 3D: vista de perfil e isométrica con botones directos.
- Reproducción completa 3D: cada pliegue terminado queda visible 500 ms antes de avanzar; aviso expreso de recolocación no calculada.
- PWA: caché v37, preservando modo offline y red primero para la página principal.
- Tests de navegador ampliados para fases 2D, punzón, matriz estática y vistas de cámara 3D.

Pruebas a ejecutar en entorno con Node y Playwright:
`node --test tests/*.test.cjs`
`python tests/browser_check.py`
`python tests/splash-responsive-check.py`

**Seguridad:** Cinemática ilustrativa; sin contacto físico, ejes CNC reales, repliegue/recolocación validada ni geometrías certificadas. No usar para fabricación o verificación de colisiones.
