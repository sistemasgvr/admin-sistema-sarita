import {
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createConfiguracionSunatTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-configuracion-sunat"]',
      popover: {
        title: '1. Configuración SUNAT',
        description:
          'Credenciales para emitir comprobantes electrónicos y guías de remisión. Sin esta configuración las facturas y boletas no se envían a SUNAT.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="sunat-empresa"]',
      popover: {
        title: '2. Empresa',
        description: 'Cada empresa (RUC) tiene su propia configuración. Selecciona la empresa antes de editar.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="sunat-sol"]',
      popover: {
        title: '3. Credenciales SUNAT',
        description: `${bulletList([
          ['Usuario y clave SOL', 'usuario secundario creado en el portal SUNAT con permisos de facturación.'],
          ['Certificado digital', 'archivo .pfx y su contraseña, para firmar los XML.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="sunat-ambiente"]',
      popover: {
        title: '4. Ambiente',
        description:
          'Beta (pruebas) o Producción. Usa Beta mientras haces pruebas: los comprobantes no tienen validez. Cambia a Producción solo cuando la empresa esté habilitada.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="sunat-pse"]',
      popover: {
        title: '5. Conexión PSE / OSE',
        description:
          'Si emites a través de un proveedor de servicios electrónicos, actívalo aquí y registra su URL, token o usuario. Si envías directo a SUNAT, déjalo desactivado.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="sunat-oauth"]',
      popover: {
        title: '6. OAuth GRE',
        description:
          'Client ID y Client Secret generados en el portal SUNAT. Son obligatorios para emitir guías de remisión electrónicas (GRE) desde documentos de salida.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="sunat-guardar"]',
      popover: {
        title: '7. Guardar',
        description: 'Guarda la configuración. Las claves se almacenan cifradas y no se muestran de nuevo.',
        side: 'top',
        align: 'end',
        onNextClick: () => finish('configuracion-sunat'),
      },
    },
  ])
}
