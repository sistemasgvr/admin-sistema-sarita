import { downloadExcelWorkbook, type ExcelColumn } from '@/shared/utils/exportExcel'
import { toastInfo } from '@/shared/composables/useToast'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import { getClienteNombrePrincipal } from '@/modules/clientes/utils/clienteNombre'
import {
  estadoTexto,
  fetchAll,
  nombreClienteRelacionado,
  processInBatches,
  siNo,
} from '@/modules/clientes/utils/exportExcelHelpers'
import type { Cliente, ClienteListFilters } from '@/modules/clientes/interfaces/cliente.interface'
import type { Direccion } from '@/modules/direcciones/interfaces/direccion.interface'
import type { Vehiculo } from '@/modules/vehiculos/interfaces/vehiculo.interface'
import type { Chofer } from '@/modules/choferes/interfaces/chofer.interface'
import type { CuentaBancaria } from '@/modules/cuentas-bancarias/interfaces/cuenta-bancaria.interface'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import { cuentasBancariasService } from '@/modules/cuentas-bancarias/services/cuentas-bancarias.service'
  
function conNivelDeGrupo<T>(registros: T[]): (T & { outlineLevel: number })[] {
  return registros.map((registro, index) => ({ ...registro, outlineLevel: index === 0 ? 0 : 1 }))
}


interface ClienteRow {
  cliente: string
  documento: string
  tipoCliente?: string | null
  tipoPersona?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  distrito?: string | null
  provincia?: string | null
  departamento?: string | null
  pais?: string | null
  estado: string
}

interface DireccionRow {
  outlineLevel: number
  cliente: string
  documento?: string | null
  direccion?: string | null
  descripcion?: string | null
  distrito?: string | null
  provincia?: string | null
  departamento?: string | null
  pais?: string | null
  referencia?: string | null
  principal: string
  estado: string
}

interface VehiculoRow {
  outlineLevel: number
  cliente: string
  documento?: string | null
  placa?: string | null
  placa2?: string | null
  marca?: string | null
  modelo?: string | null
  marca2?: string | null
  anio?: number | null
  color?: string | null
  tipoVehiculo?: string | null
  estado: string
}

interface ChoferRow {
  outlineLevel: number
  cliente: string
  documentoCliente?: string | null
  nombres: string
  tipoDocumento?: string | null
  numeroDocumento: string
  telefono?: string | null
  codigoLicencia?: string | null
  tipoLicencia?: string | null
  categoriaLicencia?: string | null
  fechaEmision?: string | null
  fechaVencimiento?: string | null
  estado: string
}

interface CuentaRow {
  outlineLevel: number
  cliente: string
  documento?: string | null
  banco?: string | null
  tipoCuenta?: string | null
  numeroCuenta?: string | null
  cci?: string | null
  telefonoBilletera?: string | null
  principal: string
  estado: string
}

const clienteColumns: ExcelColumn<ClienteRow>[] = [
  { key: 'cliente', header: 'Cliente', width: 32, value: (r) => r.cliente },
  { key: 'documento', header: 'Documento', width: 14, value: (r) => r.documento },
  { key: 'tipoCliente', header: 'Tipo cliente', width: 16, value: (r) => r.tipoCliente },
  { key: 'tipoPersona', header: 'Tipo persona', width: 14, value: (r) => r.tipoPersona },
  { key: 'telefono', header: 'Teléfono', width: 14, value: (r) => r.telefono },
  { key: 'email', header: 'Email', width: 26, value: (r) => r.email },
  { key: 'direccion', header: 'Dirección', width: 32, value: (r) => r.direccion },
  { key: 'distrito', header: 'Distrito', width: 16, value: (r) => r.distrito },
  { key: 'provincia', header: 'Provincia', width: 16, value: (r) => r.provincia },
  { key: 'departamento', header: 'Departamento', width: 16, value: (r) => r.departamento },
  { key: 'pais', header: 'País', width: 12, value: (r) => r.pais },
  { key: 'estado', header: 'Estado', width: 10, value: (r) => r.estado },
]

const direccionColumns: ExcelColumn<DireccionRow>[] = [
  { key: 'cliente', header: 'Cliente', width: 32, value: (r) => r.cliente },
  { key: 'documento', header: 'Documento', width: 14, value: (r) => r.documento },
  { key: 'direccion', header: 'Dirección', width: 32, value: (r) => r.direccion },
  { key: 'descripcion', header: 'Descripción', width: 22, value: (r) => r.descripcion },
  { key: 'distrito', header: 'Distrito', width: 16, value: (r) => r.distrito },
  { key: 'provincia', header: 'Provincia', width: 16, value: (r) => r.provincia },
  { key: 'departamento', header: 'Departamento', width: 16, value: (r) => r.departamento },
  { key: 'pais', header: 'País', width: 12, value: (r) => r.pais },
  { key: 'referencia', header: 'Referencia', width: 26, value: (r) => r.referencia },
  { key: 'principal', header: 'Principal', width: 10, value: (r) => r.principal },
  { key: 'estado', header: 'Estado', width: 10, value: (r) => r.estado },
]

const vehiculoColumns: ExcelColumn<VehiculoRow>[] = [
  { key: 'cliente', header: 'Cliente', width: 32, value: (r) => r.cliente },
  { key: 'documento', header: 'Documento', width: 14, value: (r) => r.documento },
  { key: 'placa', header: 'Placa', width: 12, value: (r) => r.placa },
  { key: 'placa2', header: 'Placa 2', width: 12, value: (r) => r.placa2 },
  { key: 'marca', header: 'Marca', width: 16, value: (r) => r.marca },
  { key: 'modelo', header: 'Modelo', width: 16, value: (r) => r.modelo },
  { key: 'marca2', header: 'Marca 2', width: 16, value: (r) => r.marca2 },
  { key: 'anio', header: 'Año', width: 8, value: (r) => r.anio },
  { key: 'color', header: 'Color', width: 12, value: (r) => r.color },
  { key: 'tipoVehiculo', header: 'Tipo de vehículo', width: 18, value: (r) => r.tipoVehiculo },
  { key: 'estado', header: 'Estado', width: 10, value: (r) => r.estado },
]

const choferColumns: ExcelColumn<ChoferRow>[] = [
  { key: 'cliente', header: 'Cliente', width: 32, value: (r) => r.cliente },
  { key: 'documentoCliente', header: 'Doc. cliente', width: 14, value: (r) => r.documentoCliente },
  { key: 'nombres', header: 'Nombres', width: 26, value: (r) => r.nombres },
  { key: 'tipoDocumento', header: 'Tipo doc.', width: 12, value: (r) => r.tipoDocumento },
  { key: 'numeroDocumento', header: 'N° documento', width: 16, value: (r) => r.numeroDocumento },
  { key: 'telefono', header: 'Teléfono', width: 14, value: (r) => r.telefono },
  { key: 'codigoLicencia', header: 'Código licencia', width: 16, value: (r) => r.codigoLicencia },
  { key: 'tipoLicencia', header: 'Tipo licencia', width: 14, value: (r) => r.tipoLicencia },
  { key: 'categoriaLicencia', header: 'Categoría', width: 14, value: (r) => r.categoriaLicencia },
  {
    key: 'fechaEmision',
    header: 'F. emisión',
    width: 14,
    value: (r) => r.fechaEmision?.slice(0, 10),
  },
  {
    key: 'fechaVencimiento',
    header: 'F. vencimiento',
    width: 14,
    value: (r) => r.fechaVencimiento?.slice(0, 10),
  },
  { key: 'estado', header: 'Estado', width: 10, value: (r) => r.estado },
]

const cuentaColumns: ExcelColumn<CuentaRow>[] = [
  { key: 'cliente', header: 'Cliente', width: 32, value: (r) => r.cliente },
  { key: 'documento', header: 'Documento', width: 14, value: (r) => r.documento },
  { key: 'banco', header: 'Banco', width: 18, value: (r) => r.banco },
  { key: 'tipoCuenta', header: 'Tipo de cuenta', width: 16, value: (r) => r.tipoCuenta },
  { key: 'numeroCuenta', header: 'N° Cuenta', width: 20, value: (r) => r.numeroCuenta },
  { key: 'cci', header: 'CCI', width: 22, value: (r) => r.cci },
  { key: 'telefonoBilletera', header: 'Tel. billetera', width: 14, value: (r) => r.telefonoBilletera },
  { key: 'principal', header: 'Principal', width: 10, value: (r) => r.principal },
  { key: 'estado', header: 'Estado', width: 10, value: (r) => r.estado },
]


function buildClienteRow(cliente: Cliente): ClienteRow {
  return {
    cliente: getClienteNombrePrincipal(cliente),
    documento: cliente.numero_documento,
    tipoCliente: cliente.nombre_tipo_cliente,
    tipoPersona: cliente.nombre_tipo_persona,
    telefono: cliente.telefono,
    email: cliente.email,
    direccion: cliente.direccion,
    distrito: cliente.nombre_distrito,
    provincia: cliente.nombre_provincia,
    departamento: cliente.nombre_departamento,
    pais: cliente.nombre_pais,
    estado: estadoTexto(cliente.estado),
  }
}

function buildDireccionRows(direcciones: Direccion[]): DireccionRow[] {
  return conNivelDeGrupo(
    direcciones.map((d) => ({
      cliente: nombreClienteRelacionado(d),
      documento: d.cliente_numero_documento,
      direccion: d.direccion,
      descripcion: d.descripcion,
      distrito: d.nombre_distrito,
      provincia: d.nombre_provincia,
      departamento: d.nombre_departamento,
      pais: d.nombre_pais,
      referencia: d.referencia,
      principal: siNo(d.es_principal),
      estado: estadoTexto(d.estado),
    })),
  )
}

function buildVehiculoRows(vehiculos: Vehiculo[]): VehiculoRow[] {
  return conNivelDeGrupo(
    vehiculos.map((v) => ({
      cliente: nombreClienteRelacionado(v),
      documento: v.cliente_numero_documento,
      placa: v.placa,
      placa2: v.placa2,
      marca: v.marca,
      modelo: v.modelo,
      marca2: v.marca2,
      anio: v.anio,
      color: v.color,
      tipoVehiculo: v.nombre_tipo_vehiculo,
      estado: estadoTexto(v.estado),
    })),
  )
}

function buildChoferRows(choferes: Chofer[]): ChoferRow[] {
  return conNivelDeGrupo(
    choferes.map((c) => ({
      cliente: nombreClienteRelacionado(c),
      documentoCliente: c.cliente_numero_documento,
      nombres: [c.nombres, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' '),
      tipoDocumento: c.nombre_tipo_documento,
      numeroDocumento: c.numero_documento,
      telefono: c.telefono,
      codigoLicencia: c.codigo_licencia,
      tipoLicencia: c.nombre_tipo_licencia,
      categoriaLicencia: c.nombre_categoria_licencia,
      fechaEmision: c.fecha_emision,
      fechaVencimiento: c.fecha_vencimiento,
      estado: estadoTexto(c.estado),
    })),
  )
}

function buildCuentaRows(cuentas: CuentaBancaria[]): CuentaRow[] {
  return conNivelDeGrupo(
    cuentas.map((cb) => ({
      cliente: nombreClienteRelacionado(cb),
      documento: cb.cliente_numero_documento,
      banco: cb.nombre_banco,
      tipoCuenta: cb.nombre_tipo_cuenta,
      numeroCuenta: cb.numero_cuenta,
      cci: cb.numero_cuenta_interbancaria,
      telefonoBilletera: cb.telefono_billetera,
      principal: siNo(cb.es_principal),
      estado: estadoTexto(cb.estado),
    })),
  )
}


export async function exportarClientesExcel(filters: ClienteListFilters): Promise<void> {
  const baseFilters: ClienteListFilters = {
    buscar: filters.buscar,
    soloActivos: filters.soloActivos,
    idTipoCliente: filters.idTipoCliente,
  }

  const clientes = await fetchAll(clientesService.listar, baseFilters)

  if (!clientes.length) {
    toastInfo('No hay clientes que coincidan con los filtros actuales')
    return
  }

  const porCliente = await processInBatches(clientes, 5, async (cliente) => {
    const [direcciones, vehiculos, choferes, cuentas] = await Promise.all([
      direccionesService.listar({ idCliente: cliente.id, pagina: 1, limite: 500 }),
      vehiculosService.listar({ idCliente: cliente.id, pagina: 1, limite: 500 }),
      choferesService.listar({ idCliente: cliente.id, pagina: 1, limite: 500 }),
      cuentasBancariasService.listar({ idCliente: cliente.id, pagina: 1, limite: 500 }),
    ])

    return {
      cliente,
      direcciones: buildDireccionRows(direcciones.data),
      vehiculos: buildVehiculoRows(vehiculos.data),
      choferes: buildChoferRows(choferes.data),
      cuentas: buildCuentaRows(cuentas.data),
    }
  })

  const clienteRows = clientes.map(buildClienteRow)
  const direccionRows = porCliente.flatMap((p) => p.direcciones)
  const vehiculoRows = porCliente.flatMap((p) => p.vehiculos)
  const choferRows = porCliente.flatMap((p) => p.choferes)
  const cuentaRows = porCliente.flatMap((p) => p.cuentas)

  const fecha = new Date().toISOString().slice(0, 10)

  await downloadExcelWorkbook({
    filename: `clientes_${fecha}`,
    sheets: [
      {
        name: 'Clientes',
        columns: clienteColumns,
        rows: clienteRows,
      },
      {
        name: 'Direcciones',
        columns: direccionColumns,
        rows: direccionRows,
        outlineLevel: (r: DireccionRow) => r.outlineLevel,
        bold: (r: DireccionRow) => r.outlineLevel === 0,
      },
      {
        name: 'Vehículos',
        columns: vehiculoColumns,
        rows: vehiculoRows,
        outlineLevel: (r: VehiculoRow) => r.outlineLevel,
        bold: (r: VehiculoRow) => r.outlineLevel === 0,
      },
      {
        name: 'Choferes',
        columns: choferColumns,
        rows: choferRows,
        outlineLevel: (r: ChoferRow) => r.outlineLevel,
        bold: (r: ChoferRow) => r.outlineLevel === 0,
      },
      {
        name: 'Cuentas Bancarias',
        columns: cuentaColumns,
        rows: cuentaRows,
        outlineLevel: (r: CuentaRow) => r.outlineLevel,
        bold: (r: CuentaRow) => r.outlineLevel === 0,
      },
    ],
  })
}
