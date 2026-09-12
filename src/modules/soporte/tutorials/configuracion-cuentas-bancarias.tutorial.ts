import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createConfiguracionCuentasBancariasTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-configuracion-cuentas-bancarias"]',
      popover: {
        title: '1. Cuentas bancarias de la empresa',
        description:
          'Cuentas donde recibes transferencias, Yape o Plin. Al cobrar con esos medios en el POS o en cuentas por cobrar, eliges en qué cuenta entró el dinero.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por titular, número de cuenta o CCI.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuentasbancarias-nuevo"]',
      popover: {
        title: '3. Nueva cuenta',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="cuentasbancarias-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="cuentabancaria-datos"]',
      popover: {
        title: '4. Datos de la cuenta',
        description: `${bulletList([
          ['Titular y alias', 'nombre del titular y un alias corto para identificarla rápido («BCP soles»).'],
          ['Banco y tipo', 'entidad y si es corriente o de ahorros.'],
          ['Número y CCI', 'para que el cliente pueda transferir.'],
          ['Teléfono Yape/Plin', 'si la cuenta recibe billeteras móviles.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuentabancaria-medios"]',
      popover: {
        title: '5. Medios de pago que recibe',
        description:
          'Marca con qué medios (transferencia, Yape, Plin…) se ofrece esta cuenta al cobrar. «Predeterminada» hace que se proponga sola en ese medio.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuentabancaria-principal"]',
      popover: {
        title: '6. Cuenta principal',
        description: 'La cuenta principal es la que se imprime en los comprobantes como dato para transferencias.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuentabancaria-guardar"]',
      popover: {
        title: '7. Guardar',
        description: 'Registra la cuenta; aparecerá al cobrar y en los depósitos de caja.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    tableStep('[data-tutorial="cuentasbancarias-ver"]', {
      popover: {
        title: '8. Acciones',
        description: `${bulletList([
          ['Ver', 'ficha de la cuenta y medios asociados.'],
          ['Editar', 'cambia datos o medios de pago.'],
          ['Eliminar', 'baja lógica; los cobros ya registrados se conservan.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('configuracion-cuentas-bancarias'),
      },
    }),
  ])
}
