# Catálogos de productos completos

Los selectores usan `productosService.listarCatalogo` o `useProductosCatalogoQuery`.
Ambos recorren todas las páginas, conservando los filtros de búsqueda, tipo y almacén.
`pagina` y `limite` de los consumidores no limitan el catálogo: el tamaño de cada
petición se gestiona en `cargarCatalogoCompleto`.

No sustituir esto por una petición con un límite grande: un catálogo puede crecer
y el servidor puede devolver menos registros por página de los solicitados.
Si una página falla o queda vacía antes de completar el total, la carga falla y no
publica un catálogo parcial. Las consultas de Vue Query cancelan la carga anterior
al cambiar sus filtros y usan claves distintas de los listados paginados.

## Puntos revisados

- Selector compartido de productos: documentos de salida, movimientos/traslados,
  recargas, préstamos, alquileres, tipos y formularios de balones, lotes/protocolos.
- Productos de rutas a pueblos, con exclusión de duplicados por línea.
- Compras, POS y edición de comprobantes.
- Mantenimientos y cobros de garantías.
- Productos del catálogo de precios e impresión de ubicaciones.
- Búsqueda por código de barras y resolución del producto contable de venta de envase.
- Consulta de stock de productos del documento de salida (`useStockCatalogoQuery`).
- Consulta de stock de gas del POS (`stockGasService.listarCatalogo`).

El listado principal de productos conserva `useProductosQuery`, porque tiene
paginación visible y búsqueda en servidor. Las exportaciones ya recorren páginas.
Los filtros de negocio siguen vigentes: por ejemplo, servicios, productos
inactivos, productos internos y productos ya elegidos pueden excluirse según el formulario.

## Verificación

- `npx vitest run src/shared/utils/cargarCatalogoCompleto.spec.ts src/modules/productos/articulos/services/productos-catalogo.spec.ts`
- `npx vue-tsc -b --pretty false`
- Con Vite local en el puerto 5188: `node test/catalogos-productos-completos.cjs`.
  La API simulada contiene 615 productos y stocks, devuelve como máximo 100 por
  página y coloca argón en la última. Comprueba rutas a pueblos y documentos de
  salida, incluyendo las existencias de 60 m³ de argón.
- `E2E_BASE_URL=http://127.0.0.1:5188 node test/inventario-producto-traslado.cjs`
  (en PowerShell, establecer la variable con `$env:E2E_BASE_URL`).

Las pruebas de navegador interceptan la API y no cambian inventario real.
