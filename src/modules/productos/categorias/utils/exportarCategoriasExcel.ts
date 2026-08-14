import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProductoListFilters } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { toastInfo } from '@/shared/composables/useToast'
import { downloadExcelWorkbook, fetchAllPages } from '@/shared/utils/exportExcel'

export async function exportarCategoriasExcel(
  filters: CategoriaProductoListFilters,
): Promise<void> {
  const rows = await fetchAllPages(categoriasProductoService.listar, filters)

  if (!rows.length) {
    toastInfo('No hay categorías que coincidan con los filtros actuales')
    return
  }

  const fecha = new Date().toISOString().slice(0, 10)

  await downloadExcelWorkbook({
    filename: `categorias-producto_${fecha}`,
    sheets: [
      {
        name: 'Categorías',
        rows,
        columns: [
          { key: 'nombre', header: 'Nombre', width: 28, value: (r) => r.nombre },
          {
            key: 'descripcion',
            header: 'Descripción',
            width: 40,
            value: (r) => r.descripcion,
          },
          {
            key: 'subcategorias',
            header: 'Subcategorías',
            width: 48,
            value: (r) => (r.nombres_sub_categorias ?? []).join(', '),
          },
          {
            key: 'total',
            header: 'Total subcategorías',
            width: 20,
            value: (r) => Number(r.total_sub_categorias ?? r.nombres_sub_categorias?.length ?? 0),
          },
          {
            key: 'estado',
            header: 'Estado',
            width: 12,
            value: (r) => (r.estado === 1 ? 'Activo' : 'Inactivo'),
          },
        ],
      },
    ],
  })
}
