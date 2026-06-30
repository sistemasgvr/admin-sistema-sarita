import { ICONS, type IconName } from '@/shared/constants/icons'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export interface ConfiguracionHubItem {
  key: string
  title: string
  description: string
  path: string
  icon: IconName
  permission: PermissionBandera
}

export const configuracionHubItems: ConfiguracionHubItem[] = [
  {
    key: 'sucursales',
    title: 'Sucursales',
    description: 'Administra las sucursales de la empresa.',
    path: '/admin/configuracion/sucursales',
    icon: ICONS.building2,
    permission: PermisoBanderas.SUCURSALES_LISTAR,
  },
  {
    key: 'almacenes',
    title: 'Almacenes',
    description: 'Gestiona los almacenes por sucursal.',
    path: '/admin/configuracion/almacenes',
    icon: ICONS.warehouse,
    permission: PermisoBanderas.ALMACENES_LISTAR,
  },
  {
    key: 'condiciones-pago',
    title: 'Condiciones de pago',
    description: 'Define plazos y condiciones de cobro.',
    path: '/admin/configuracion/condiciones-pago',
    icon: ICONS.creditCard,
    permission: PermisoBanderas.CONDICIONES_PAGO_LISTAR,
  },
  {
    key: 'empresas',
    title: 'Empresa',
    description: 'Datos fiscales y de contacto de la empresa.',
    path: '/admin/configuracion/empresas',
    icon: ICONS.building,
    permission: PermisoBanderas.EMPRESAS_VER,
  },
  {
    key: 'sunat',
    title: 'SUNAT',
    description: 'Credenciales y certificados para facturación electrónica.',
    path: '/admin/configuracion/sunat',
    icon: ICONS.fileKey,
    permission: PermisoBanderas.CONFIGURACION_SUNAT_VER,
  },
  {
    key: 'servicios',
    title: 'Servicios externos',
    description: 'Configura integraciones y servicios de terceros.',
    path: '/admin/configuracion/servicios',
    icon: ICONS.plug,
    permission: PermisoBanderas.CONFIGURACION_SERVICIOS_LISTAR,
  },
]
