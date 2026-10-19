# Plegar Pro Plus · pantalla de carga adaptable v0.31

- Se conservan la imagen aprobada, las dos P con animaciones independientes y la barra real con avance estimado hasta el 100 %.
- Se crean dos encuadres de la imagen original para PC/tablet y móviles, sin usar el 84 % fijo dibujado en el boceto como barra funcional.
- `splash.css` usa viewport dinámico, contención, diseño horizontal en móviles girados y áreas seguras. Se mantienen omitir presentación y preferencia de movimiento reducido.
- Los cambios son exclusivos de la pantalla de carga. `styles.css` e Inicio no cambian.
- Pruebas: `node --test tests/*.test.cjs`, `python tests/splash-responsive-check.py`, `python tests/splash-browser-check.py`. Se probaron 1440×900, 820×1180, 390×844, 320×700, 844×390 y 667×375.
- GitHub Pages: limpiar caché del navegador si aparece la versión anterior.
