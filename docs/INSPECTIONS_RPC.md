# Migración: Creación de Inspecciones vía Supabase RPC

Este documento describe la migración desde Netlify Functions a un RPC (función SQL) en Supabase para la creación de inspecciones. El objetivo es centralizar reglas de negocio (validaciones, deduplicación y snapshot) del lado de la base de datos.

## Resumen del cambio

- Se reemplaza la función serverless `netlify/functions/inspections.js` por el RPC `create_inspection_v2` en Supabase.
- El frontend ahora llama `supabase.rpc('create_inspection_v2', ...)` desde `inspectionService.createInspection()` y `parcelService.requestInspection()`.
- La UI y el realtime no cambian: `InspectionQueue` y `InspectionList` siguen leyendo de la tabla `inspections`.

## Flujo actualizado

1) `ParcelCard` → usuario hace clic en "Solicitar Inspección".
2) `useCreateInspection` → `inspectionService.createInspection`.
3) `inspectionService.createInspection` → `supabase.rpc('create_inspection_v2', { p_parcel_id, p_notes })`.
4) El RPC valida:
   - Parcela existe y está activa (`parcels.is_active = true`).
   - No hay inspección abierta para la misma parcela (`status in ('pendiente','programada','en_progreso')`).
   - Inserta inspección con `metadata.snapshot` de la parcela.
5) React Query invalida `['inspections']`; `InspectionQueue` la muestra y el canal realtime mantiene la lista al día.

## Estados utilizados

- Base de datos: `pendiente`, `programada`, `en_progreso`, `completada`, `cancelada`.
- UI: Se normaliza a `pending`, `scheduled`, `overdue`, `completed`, `cancelled` únicamente para visualización.
- `ParcelCard.checkInspectionStatus` compara con estados en español para detectar si ya existe una inspección activa.

## SQL del RPC

Ver archivo: `supabase/migrations/2025-09-12_create_inspection_v2.sql`

## Pasos para aplicar en Supabase

1) Abrir el SQL Editor en el proyecto Supabase.
2) Pegar y ejecutar el contenido de `supabase/migrations/2025-09-12_create_inspection_v2.sql`.
3) Verificar que existe la columna `parcels.is_active` (boolean). Si no existe, crearla o ajustar la validación del RPC.
4) Revisar políticas RLS para permitir a los usuarios ejecutar el RPC y leer las inspecciones creadas.

## Limpieza y deprecación

- Eliminar `netlify/functions/inspections.js` del repositorio.
- Si no se usa `src/lib/api.js` para otras APIs, puede eliminarse también.
- Actualizar `README.md` (sección más abajo) para reflejar el nuevo flujo.

## Verificación rápida

- Crear inspección para una parcela activa sin inspección abierta → OK, estado `pendiente`.
- Intentar crear otra para la misma parcela → error "Ya existe una inspección activa para esta parcela".
- `InspectionQueue` y `InspectionList` siguen funcionando (leen la tabla `inspections`).
