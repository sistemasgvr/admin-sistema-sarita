import { runTutorial, type TutorialOptions } from '@/modules/soporte/tutorials/tutorial-base'

export function createClienteTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-clientes"]',
      popover: {
        title: '1. Módulo Clientes',
        description:
          'Ubica el módulo Clientes en el menú lateral. Desde aquí accedes al listado, direcciones, contactos y mapa.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="cliente-documento"]',
      popover: {
        title: '2. Documento',
        description:
          'Selecciona el tipo de documento e ingresa el número. Puedes consultar RENIEC o SUNAT con el botón lateral.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cliente-datos-generales"]',
      popover: {
        title: '3. Datos generales',
        description: 'Completa el tipo de cliente, contribuyente y sus nombres o razón social.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cliente-contacto"]',
      popover: {
        title: '4. Contacto y ubicación',
        description:
          'Registra teléfono, correo, dirección y, si aplica, la ubicación exacta en el mapa.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cliente-sunat"]',
      popover: {
        title: '5. Configuración SUNAT',
        description:
          'Puedes configurar la información de SUNAT para este cliente, como el tipo de contribuyente y el régimen tributario. Útil para Contabilidad.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cliente-observaciones"]',
      popover: {
        title: '6. Observaciones',
        description:
          'Si deseas, puedes agregar observaciones adicionales sobre el cliente. Por ejemplo, información relevante que pueda ser útil para futuras referencias.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cliente-guardar"]',
      popover: {
        title: '7. Crear cliente',
        description:
          'Cuando los datos requeridos estén completos, selecciona este botón para registrar el cliente.',
        side: 'top',
        align: 'end',
        onNextClick: () => finish('crear-cliente'),
      },
    },
  ])
}
