# Plegar Pro Plus v0.13 — Registro de fuentes de utillaje

**Consulta:** 19 de octubre de 2026. **Naturaleza:** dimensiones publicadas en páginas o catálogos oficiales de fabricante; no equivalen a un modelo sólido CAD ni a una ficha validada en máquina.

## Referencias de herramientas individuales consultadas

| Fabricante | Serie, tipo y referencia concreta | Valores publicados (mm, salvo fuerza) | Fuente oficial |
| --- | --- | --- | --- |
| AMADA | AMTS, matriz MT 508 V8/30°, variante 50838E | V8, 30°, radio de hombro 1, altura 116, ancho 18, longitud 415, 200 kN/m | [Ficha MT 508](https://www.amada.de/en/tools/bending-tools/amts/dies/1v-die-623.html) |
| AMADA | STANDARD, punzón 202 88° R0,6, variante DX602061 | ángulo 88°, radio punta 0,6, altura 100, longitud 835, 300 kN/m | [Ficha 202](https://m.amada.de/en/tools/bending-tools/standard/punches/standard-punch-202-79.html) |
| AMADA | NEW AFH Standard, punzón cuello de cisne 846, variante ES8467061 | ángulo 88°, radio punta 0,6, altura 120, longitud 835, 450 kN/m | [Ficha 846](https://m.amada.de/en/tools/bending-tools/new-afh/punches/gooseneck-punch-846-827.html) |
| AMADA | AFH, punzón agudo A13 30°, variante AGA13061 | ángulo 30°, radio punta 0,6, altura 120, longitud 835, 450 kN/m | [Catálogo AFH, punzón A13](https://www.amada.de/CentralData/Bending/Tools/AFH/Brochures/EN/AFH_Catalog.pdf) |
| AMADA | NEW AFH Standard, matriz V16/88°, variante ED0777251 | V16, 88°, radio de hombro 2,5, altura 60, ancho 20, longitud 835, 1000 kN/m | [Catálogo New AFH Standard, matriz V16](https://www.amada.de/CentralData/Bending/Tools/NEWAFHStandard/Brochures/EN/NEWAFHStandard_Catalog.pdf) |

**Revisión de catálogo:** para los dos PDF anteriores se ha identificado un copyright © 2018; la revisión/edición de la ficha HTML puede no estar indicada. No se infieren tolerancias ni perfiles a partir de las fotos. La geometría del amarre, garganta, radios adicionales y segmentos de montaje es información distinta que deberá verificarse mediante planos acotados o DXF oficiales.

## Otras fuentes oficiales de consulta, todavía sin fichas de herramienta importadas

- [AMADA AMTS catálogo](https://www.amada.de/CentralData/Bending/Tools/AMTS/Brochures/EN/AMTS_Catalog.pdf), © 2019.
- [AMADA AFH catálogo](https://www.amada.de/CentralData/Bending/Tools/AFH/Brochures/EN/AFH_Catalog.pdf), © 2018.
- [AMADA STANDARD catálogo](https://www.amada.de/CentralData/Bending/Tools/STANDARD/Brochures/EN/STANDARD_Catalog.pdf), © 2018.
- [TRUMPF — bending tools](https://www.trumpf.com/en_INT/products/services/services-machines-systems-and-lasers/tools/bending-tools/), contiene catálogos descargables; no se han importado todavía referencias dimensionales de un útil concreto.

**Actualización del 30/10/2026 — catálogo MECOS fotografiado:** este documento describe exclusivamente las fichas de `manufacturer-references.js`, no la biblioteca completa. En la rama principal hay también `manufacturer-tooling-data.js`, `tool-library.js` y `catalog-pages.js` con **87 punzones y 150 matrices** transcritos de las láminas de utillaje MECOS aportadas por el propietario. **205 de esas 237 referencias** están enlazadas por código a una de las **36 fotografías** guardadas; **32** no tienen aún imagen individual correctamente asociada. Las cotas impresas del catálogo han sido confirmadas como oficiales por el propietario. Los tramos de contorno no acotados siguen siendo reconstrucciones y no equivalen a CAD exacto ni autorizan una comprobación física de colisiones.

## Política de uso

1. Todas las fichas de `manufacturer-references.js` se consultan desde Programación 2D y **no se incorporan a las listas de selección física** del estimador o simulador.
2. El catálogo genérico en `tool-library.js` se mantiene completamente separado; sus medidas siguen siendo supuestos internos y se muestran como **SIN VERIFICAR**.
3. La documentación de fabricante respalda únicamente las cotas declaradas para esa variante y referencia. **No** confirma que sea compatible con una máquina particular, con los amarres instalados, ni que el sólido CAD esté completo.
4. Antes de elegir herramientas reales para plegar deberán comprobarse fabricante y sistema de montaje, herramienta exacta (referencia, segmento y longitud), dibujos completos de contorno, tolerancias, carga admisible, estado físico de herramienta y limitaciones de la máquina.
5. Las referencias externas pueden modificarse; comprobar la edición y accesibilidad al utilizar una ficha en el futuro. La fecha de consulta es la del primer registro y **no** implica actualización en tiempo real.
