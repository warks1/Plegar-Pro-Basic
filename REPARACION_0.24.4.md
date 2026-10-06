# Plegar Pro — reparación de la beta

- Se eliminó el arranque que apuntaba a un bundle inexistente.
- Se reconstruyó la estructura `app / components / features / core / data / store / types` que faltaba en el ZIP.
- Se retiraron versiones HTML históricas y duplicados de código de la raíz.
- Se añadió la sección **Colisiones y secuencia** con vista CAD de punzón, matriz y chapa.
- La sección permite recorrer los pasos de plegado, reproducir la secuencia y mostrar el estado de colisión.
- Los lanzadores de Windows se corrigieron para arrancar mediante Vite en `127.0.0.1:4186`.
- El bundle ejecutable incluido en `assets/` conserva la beta compilada y la ruta de colisiones actualizada.
