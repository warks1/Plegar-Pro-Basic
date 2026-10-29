# Agenda y Curva perfecta — v112

## Agenda
Trabajos con fecha y hora local, duración, proyecto, operario, notas y estado. Filtros por día, siete días, estado y texto. Edición, terminado/reapertura y borrado con deshacer. Advierte coincidencias horarias del mismo operario, incluyendo trabajos que cruzan medianoche.

Guarda en `plegar-agenda-v1` del navegador. Las copias JSON se combinan por identificador: versiones distintas del mismo trabajo se rechazan sin sobrescribir. No envía avisos externos ni sincroniza entre dispositivos. Los fallos de almacenamiento se muestran y mantienen el estado anterior.

## Curva perfecta
Calcula desarrollo nominal sobre la fibra neutra `(Ri + K × espesor) × giro en radianes`, con rectos inicial y final. Reparte hasta 360 golpes por cantidad o separación máxima. Permite copiar material, espesor, K y herramientas del programa actual, sin modificarlo.

La vista anima los giros del perfil con pausa, repetición y avance manual. La tabla presenta marcas medidas sobre el desarrollo desde ambos extremos, giro incremental y acumulado. Se conserva la longitud de los tramos durante la animación. La poligonal es una aproximación geométrica con facetas; no simula la deformación plástica del material.

Una curva se guarda en `plegar-curve-v1`; permite exportar/importar JSON y exportar tabla CSV. Las marcas no son coordenadas X del tope. No calcula compensación elástica, penetración Y, fuerza ni certifica apoyo o colisiones. No se transfiere automáticamente al editor estándar, cuyo límite de pliegues es menor.

## Validación
`node --test tests/workshop-core.test.cjs tests/service-worker.test.cjs`: 12 pruebas, incluidos 88 golpes, conservación de longitud, direcciones, límites, años bisiestos, solapamientos, copias y caché v112.

La comprobación visual en navegador queda pendiente: el navegador no estaba instalado y la descarga de Chromium no produjo un archivo válido en este entorno.

Los perfiles exactos de todo el catálogo MECOS y la validación de colisiones de la máquina siguen siendo trabajo separado; esta entrega no los da por terminados.
