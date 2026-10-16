# Exportaciones Excel en los listados — 16 de octubre de 2026

Se agregaron exportaciones simples a las 35 vistas compartidas de listados que no las tenían. Retenciones y percepciones usan la misma vista, de modo que ambas opciones quedan cubiertas. También se agregó exportación al mapa de clientes, caja del día y las cuatro pestañas del dashboard: 41 vistas modificadas en total.

## Cobertura nueva

| Área | Opciones con Excel agregado |
| --- | --- |
| Compras y caja | Retenciones, gastos de caja, historial de sesiones y caja del día |
| Ventas | Percepciones, comprobantes, notas de crédito, ventas sin documento y resúmenes diarios |
| Cilindros | Tipos, préstamos, alquileres, recargas, mantenimientos, lotes y protocolos, bajas pendientes y rutas a pueblos |
| Inventario | Movimientos y documentos de salida |
| Clientes y relaciones | Mapa de clientes, solicitudes de baja/reactivación, contactos, direcciones, vehículos, choferes y cuentas bancarias |
| Productos | Subcategorías y catálogo de precios |
| Empresa y configuración | Activos, permisos y certificados, sucursales, almacenes, condiciones de pago y servicios |
| Administración | Usuarios, roles y permisos del sistema |
| Dashboard | Indicadores de panel principal, gestión de clientes, analítica de productos y control de cilindros; detalle de cuentas por cobrar, rotación y bajas mostradas en el panel |

Se mantienen los exportadores existentes de compras, clientes, productos, categorías, stock, cilindros, actividades, antigüedad de préstamos/alquileres, cuentas financieras, garantías y libro diario.

## Comportamiento

- Los nuevos reportes paginados consultan todas las páginas usando una copia de los filtros activos, aunque el usuario cambie los filtros durante la descarga.
- Retenciones y percepciones usan el parámetro `tamano`; los otros listados usan `limite`. Se respeta el tamaño efectivo informado por el servidor.
- El reporte es una hoja sencilla con encabezados legibles y campos definidos explícitamente por cada módulo. No se vuelcan automáticamente todos los atributos de la API.
- Los importes y cantidades se exportan como números; documentos, teléfonos, correlativos y códigos se conservan como texto. Los roles se exportan por nombre.
- Usuarios y servicios no exportan contraseñas ni tokens.
- Sin resultados, se informa al usuario. Si una página falla o falta parte del total informado, no se entrega un archivo parcial.
- Notas de crédito y ventas sin documento conservan su tipo de comprobante. El reporte de comprobantes aplica también la exclusión local de ventas sin documento que usa su listado.
- Los indicadores y tablas del dashboard exportan la colección actualmente cargada, incluidos sus límites visibles (por ejemplo, el ranking de 20 productos); no representan un reporte exhaustivo de todo el inventario.
- Caja del día reutiliza el reporte existente de libro diario con la fecha y sucursal seleccionadas.
- No se modificaron columnas ni anchos de las tablas.

Las pantallas de formularios, edición de configuración y navegación no requieren un reporte de listado independiente. Los exportadores existentes mantienen su alcance anterior; los límites de finanzas y del reporte individual de cliente señalados en la revisión previa quedan pendientes.

## Corrección relacionada de fechas

Al confirmar una fecha escrita con Enter, el selector leía el valor anterior de la prop antes del siguiente render del padre. Esto podía vaciar el texto y quitar el filtro al perder el foco. Ahora conserva directamente la fecha ISO recién validada. La prueba de exportación comprueba que el rango siga presente después de salir del campo.

## Verificación

- 78 pruebas unitarias aprobadas; nueve cubren el helper nuevo (paginación completa, `tamano`, copia de filtros, selección local, errores, resultados incompletos, vacíos, tipos y campos explícitos).
- `node scripts/verificar-exportables.mjs`: vistas reales de retenciones, percepciones, gastos de caja y usuarios, API simulada, 501 registros por reporte, lectura de los XLSX generados y comprobación de filtros, tipos, ceros iniciales y ausencia de credenciales.
- Compilación TypeScript, build de producción y lint de los archivos modificados.
- Auditoría de vistas con `AppListToolbar`: ninguna opción de listado queda sin exportador.

Cambios locales, sin modificaciones de base de datos ni despliegue a producción.
