# Plegar Pro Basic / Plus v0.48 — Envolventes de máquina (cribado nominal)

Fecha: 2026-10-23. Continuación de v0.47, manteniendo la interfaz aprobada.

## Cambios

- Programación 2D admite cotas opcionales: altura de matriz H, alcance de mesa X−, alcance de mesa X+, ancho de trancha (en perfil) y distancia vertical desde punta del punzón hasta el canto inferior de trancha.
- No se establecen dimensiones de mesa ni trancha por defecto. Los campos vacíos significan **DESCONOCIDO**, no «sin colisiones».
- `machine-clearance.js` representa zonas nominales rectangulares y usa intersección de segmentos con rectángulos ampliados por semiespesor para marcar **posibles interferencias**.
- Se revisan alas plegadas, alas todavía rectas y extremos del pliegue activo en varios estados de aproximación, conformado y retirada (muestreo, no barrido continuo).
- `sequence-planner.js` penaliza candidatos con posibles choques de mesa y trancha, conserva el orden manual y nunca ofrece aprobación CNC.
- `tooling3d.js` representa mesa y trancha con sólidos paramétricos únicamente cuando se introducen dimensiones; se pueden mostrar u ocultar en Simulación 3D.
- Actualización de la caché offline v48 y pruebas unitarias y de navegador en PC y smartphone.

## Referencia geométrica

En vista de perfil: eje X a lo largo del desarrollo local; signo X− hacia izquierda y X+ derecha; eje Y positivo hacia mesa; hombros de V en y=0. Mesa en y=H de matriz; se representa fuera de la huella nominal de matriz y hasta los alcances introducidos X− / X+. La trancha se representa como un rectángulo centrado en el punzón, solidario con el movimiento Y nominal, con su canto inferior a la distancia introducida desde la punta del punzón.

Estas cotas **no se obtienen automáticamente del modelo de máquina**. La geometría puede cambiar durante una reorientación física de la pieza, que este programa aún no resuelve. Los rectángulos son envolventes de trabajo y pueden dar falsos positivos o pasar por alto colisiones físicas. La ausencia de alerta no demuestra seguridad.

## Restricciones

- No hay CAD original verificado de máquina, utillaje y fijaciones, ni posición real de topes/ejes, ciclo Y, extracción o vuelta de pieza.
- Los radios del perfil son supuestos y el 3D procede de extrusiones geométricas ilustrativas.
- La altura de matriz H y la profundidad de omega **no bastan por sí solas** para demostrar imposibilidad o viabilidad de un plegado; el sistema señala su incompatibilidad potencial.
- **NO CNC / NO APTO PARA VALIDACIÓN DE SEGURIDAD O FABRICACIÓN.**

## Verificación

Ejecutar `node --test tests/*.test.cjs` y `python tests/continuity-examples-browser.py`. Comprobar los workflows de GitHub Actions y el despliegue Pages del commit integrado.