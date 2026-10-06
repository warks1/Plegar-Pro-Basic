# Plegar Pro Modern

Base profesional de Plegar Pro construida con React, TypeScript, Vite, Zustand, Vitest y Playwright.

## Estado actual

- `main`: base estable 0.1.0.
- `develop`: integración 0.2.0.
- Diseño visual bloqueado en la línea comercial aprobada.
- Estado central compartido entre Desarrollo, Programación, Simulación y Validación.
- Deshacer/Rehacer, edición técnica de plegados y validación previa a fabricación.

## Puesta en marcha

Requiere Node.js 22 y acceso al registro público de npm.

```bash
npm install
npm run dev
```

## Calidad

```bash
npm run lint
npm test
npm run build
npm run test:e2e
node scripts/verify-structure.mjs
```

## Flujo Git

- `main`: entregas estables.
- `develop`: integración.
- `feature/*`: una función o módulo por rama.
- No fusionar una función que no tenga pruebas y documentación de limitaciones.

## Propiedad

Propietario del software: **Antonio Molina Sánchez**.


## Iteración 0.3.0

La simulación y las bibliotecas CAD comparten la selección persistente de máquina, punzón y matriz. Los modelos incluidos son reconstrucciones paramétricas y no deben considerarse CAD oficial mientras no se validen con documentación del fabricante.

## v0.4.0-beta — módulos empresariales
La rama `develop` incorpora Agenda, Clientes, Proveedores, Producción, Calidad, Mantenimiento, Materiales y una Matriz de requisitos visible. Los datos se almacenan en el estado central de Zustand y se conservan localmente.

La matriz de requisitos evita presentar como terminadas funciones todavía parciales o pendientes, especialmente réplicas CAD oficiales, sincronización entre equipos y actualización diaria mediante conectores autorizados.

## Novedades v0.5.0-beta

Esta iteración añade Curva Perfecta, Comparador de V, Soldadura, Importación CAD/IA, Acerca de y Ajustes persistentes. Los cálculos son orientativos hasta su validación con documentación oficial de material, máquina y utillaje.

### Sprint v0.6.0
Incluye Almacén, Presupuestos, Rutas de fabricación, Notificaciones y Chat técnico persistente.


## Estado actual

Versión de integración: **v0.7.0-beta**. El núcleo geométrico y el motor de simulación por estados están incorporados en la rama `develop`. Consulte `TEST_REPORT.md` para las comprobaciones y limitaciones.

## v0.10.0-beta
La iteración añade gestión documental, revisiones técnicas y liberación controlada a producción. Ningún trabajo debe liberarse sin geometría, máquina, utillaje, plano aprobado, revisión, ruta, orden y control de calidad definidos.


## v0.13.0-beta · Registro CAD y auditoría

La aplicación puede inspeccionar localmente archivos OBJ y STL, registrar metadatos de modelos STEP/IGES/GLB/DXF y conservar la huella SHA-256, fuente, licencia y estado de validación. El registro no convierte un modelo en oficial sin documentación y comprobación dimensional.

Auditoría adicional:

```bash
npm run audit:ui
npm run verify
```

## Catálogos técnicos y archivos CAD
La v0.14.0 añade almacenamiento local de archivos CAD mediante IndexedDB y paquetes de catálogo versionados con esquema `plegar-pro.catalog.v1`. Los binarios permanecen en el navegador; para sincronizarlos entre dispositivos se requerirá un backend documental.
