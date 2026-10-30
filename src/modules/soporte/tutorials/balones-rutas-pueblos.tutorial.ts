import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createBalonesRutasPueblosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-rutas-pueblos"]',
      popover: {
        title: '1. Ruta pueblos',
        description:
          'Salida de un chofer con cilindros llenos a vender en pueblos. Se registra qué sale, qué vuelve y con cuánto gas, para detectar descuadres.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="rutas-nueva"]',
      popover: {
        title: '2. Nueva ruta',
        description: 'Pulsa «Siguiente» para ver cómo se arma una ruta.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="rutas-nueva"]'),
      },
    },
    {
      element: '[data-tutorial="ruta-datos"]',
      popover: {
        title: '3. Datos de la ruta',
        description: 'Fecha, almacén del que salen los cilindros, chofer/repartidor y una observación con la zona o pueblos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="ruta-cilindros"]',
      popover: {
        title: '4. Cilindros a enviar',
        description:
          'Añade cada cilindro e ingresa manualmente sus libras y m³ de salida. Al retornar se ingresan ambas lecturas otra vez. El stock utiliza los m³, sin convertir libras.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="ruta-productos"]',
      popover: {
        title: '5. Productos',
        description: 'Opcional: accesorios u otros productos que también van en la ruta para venderse.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="ruta-guardar"]',
      popover: {
        title: '6. Crear ruta',
        description: 'La ruta queda ABIERTA, sin descontar gas todavía. Al iniciarla se descuentan los m³ de salida; después se registra el retorno y se cierra.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '7. Buscar y filtrar',
        description: 'Busca por almacén, chofer u observación; filtra por estado y rango de fechas.',
        side: 'bottom',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="rutas-ver"]', {
      popover: {
        title: '8. Ver detalle',
        description:
          'Cilindros enviados, libras y m³ manuales de salida y retorno, consumo de gas y descuadre.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="rutas-acciones"]', {
      popover: {
        title: '9. Ciclo de la ruta',
        description: `${bulletList([
          ['Iniciar ruta', 'descuenta los m³ de salida del stock y pone los cilindros en ruta.'],
          ['Registrar retorno', 'ingresa las libras y m³ que vuelven; solo los m³ retornados se suman al stock.'],
          ['Cerrar ruta', 'compara el consumo con los m³ de ventas reportados, sin descontar stock otra vez.'],
          ['Cancelar / Eliminar', 'rutas que no salieron.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('balones-rutas-pueblos'),
      },
    }),
  ])
}
