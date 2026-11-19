export interface ActionMenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  /**
   * Por qué está deshabilitada, en palabras del usuario
   * («Disponible cuando SUNAT acepte el comprobante»). Se muestra bajo la
   * etiqueta. Usar en vez de `hidden` cuando el bloqueo es por estado y no por
   * permiso.
   */
  disabledReason?: string
  loading?: boolean
  danger?: boolean
  hidden?: boolean
}
