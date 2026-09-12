import {
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createConfiguracionEmpresaTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-configuracion-empresas"]',
      popover: {
        title: '1. Empresa',
        description:
          'Datos fiscales y de contacto de la empresa. Se imprimen en los comprobantes y guías, y son la base para la configuración de SUNAT.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="empresa-ruc"]',
      popover: {
        title: '2. RUC',
        description: 'Número de RUC del emisor. Debe coincidir con el registrado en SUNAT para que los comprobantes sean aceptados.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="empresa-razon-social"]',
      popover: {
        title: '3. Razón social y nombre comercial',
        description: 'La razón social va en los documentos electrónicos; el nombre comercial es el que se muestra en el sistema y en los tickets.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="empresa-direccion"]',
      popover: {
        title: '4. Dirección fiscal',
        description: 'Domicilio fiscal que aparece en facturas y guías de remisión.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="empresa-contacto"]',
      popover: {
        title: '5. Contacto',
        description: 'Teléfono y correo que se imprimen en los comprobantes para que el cliente pueda comunicarse.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="empresa-parametros"]',
      popover: {
        title: '6. Parámetros operativos',
        description: `${bulletList([
          ['Tolerancia ruta pueblos (m³)', 'al cerrar una ruta, avisa si el gas calculado y el reportado difieren más de este valor.'],
          ['PSI mínimo útil', 'presión por debajo de la cual un cilindro se considera vacío y se envía a planta.'],
        ])}`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="empresa-guardar"]',
      popover: {
        title: '7. Guardar',
        description: 'Aplica los cambios en todo el sistema. Solo los usuarios con permiso de configuración pueden editar.',
        side: 'top',
        align: 'end',
        onNextClick: () => finish('configuracion-empresa'),
      },
    },
  ])
}
