# TRUMPF TrumaBend V85 · 29/10/2026

Máquina principal para programas nuevos y perfiles anteriores sin identificación de máquina. Se conservan piezas, cotas, signos y secuencias. La Bystronic continúa documentada en machine-references.js como referencia histórica.

## Datos aportados

Transcripción de cuatro fotografías de pantallas Cybelec del propietario (IMG_8960/61/62/63). No se ha verificado documentación oficial del fabricante de forma independiente. `machine-v85.js` conserva todas las cotas L, orígenes, anchos, Stop/Support y datos de encoders/cilindros. Las imágenes y el vídeo no se publican en el repositorio.

- Trancha/portaútil: origen 0, ancho 2040 mm. Tool-Working distance: 30 mm.
- Trancha L1–L10: 1340;28;2;25.4;20;30;125;20;39;28 mm.
- Mesa L1–L7: 820;80;25.25;25.25;50;20;20 mm.
- Stop L1–L6: 70;100;18;25;12;0. Support: 70;100;8;25;12;8 mm. L6max/min, Ox/Oz: 0. Distancia preferida: 80 %.
- Encoder Y1: 50 mm; Y1–Y2: 3900 mm; cilindros: 3700 mm. Se conservan sin inferir geometría; discrepan del ancho 2040 y requieren aclaración.

## Comportamiento

La portada abre con la cinemática de la TRUMPF V85, sin depender de preferencias antiguas que mostraban la foto Bystronic archivada. El perfil lateral sigue como cámara predeterminada. La referencia Bystronic queda rotulada como referencia anterior; la tarjeta de máquina activa usa un esquema frontal de la V85.

La vista lateral representa la pieza completa, pliegues previos y pendientes, matriz fija y punzón/trancha solidarios en aproximación, plegado y retirada. Se indica la separación nominal punta/chapa. La sección reconstruida de mesa, trancha y dedo sustituye las envolventes rectangulares de la V85 en el cribado 2D, y alimenta los prismas 3D. La visualización recorta las zonas lejanas de trancha/mesa para mostrar el golpe; los cálculos conservan los contornos completos. Se marca en rojo una posible interferencia, distinguiendo el contacto local previsto con el punzón y los apoyos de matriz de un ala remota que toca esas herramientas.

El vídeo de referencia muestra un ciclo lateral de seis golpes y reposicionamientos; se ha revisado en nueve instantes. No identifica por sí solo las dimensiones de la pieza B ni las geometrías de su utillaje. No se ha inventado un programa dimensional para esa pieza.

## Límites pendientes

La sección exterior es una reconstrucción interpretada del esquema de pantalla. L3/L5/L6/L8/L10 de la trancha se preservan como cotas, pero no se usan para inventar los rebajes del amarre. El canal de mesa se interpreta como 20 mm de profundidad con base de matriz apoyada en su fondo. Montaje preliminar punta-trancha: altura nominal del punzón + 30 mm; editable en Máquinas. Si el punzón no tiene altura acotada, se utiliza la altura de su silueta y se advierte expresamente.

Faltan plano de amarre, montaje de cada útil, posición/anchura Z de dedos, bastidor/garganta y un modelo de retirada/volteo entre golpes. Las interferencias son geométricas nominales y el ciclo se muestrea de forma discreta. No es física de contacto, barrido continuo ni certificación de ausencia de colisiones. No sirve para CNC.

## Validación

387 pruebas Node locales superadas; comprobación de sintaxis JavaScript y diferencias sin errores. Navegador local no disponible y descarga de Chromium fallida; la revisión visual local no se ha realizado. Se actualiza el ensayo de navegador de GitHub Actions para V85 y cámara de perfil; su resultado debe comprobarse para el commit publicado. Inicio usa cinemática y cámara de perfil por defecto; conserva preferencias explícitas del usuario.

## Continuación del 29/10/2026

La vista de cada ciclo reconstruye ahora todo el perfil desde la secuencia: conserva giros concluidos aunque no sean vecinos del pliegue activo y mantiene planos los pendientes. La sección V85 puede revisar esas alas remotas durante el golpe. Los dobleces anteriores siguen representados con bisagras agudas y el cambio de máquina entre pasos aún no interpola retirada, giro y recolocación física.
