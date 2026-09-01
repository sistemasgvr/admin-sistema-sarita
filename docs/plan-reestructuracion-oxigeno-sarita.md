# Plan de Reestructuración — Sistema Oxígeno Sarita

> **Fuente base:** apuntes del PDF *"Organización Oxígeno Sarita"* + ficha ICP *"Protocolo de Análisis Cilindros"* (ver Anexo A).
> **Fecha:** 2026-09-01
> **Alcance:** roadmap completo por fases (BD + API + Frontend).
> **Enfoque acordado:** reestructuración **desde cero, sin migración de datos**. Se diseña el esquema objetivo limpio; los datos actuales (semilla / pruebas) se regeneran, no se migran.

---

## 0. Cómo leer este documento

- La **Sección 1** resume el estado actual del sistema.
- La **Sección 2** fija los principios transversales de la reestructuración.
- La **Sección 3** detalla las fases (F1 = núcleo fundacional, según lo acordado).
- La **Sección 4** es el mapa de trazabilidad: cada apunte del PDF → fase donde se implementa. **Nada del PDF queda fuera.**
- La **Sección 5** lista decisiones abiertas que requieren tu confirmación antes o durante cada fase.
- Los **Anexos** contienen el detalle de la ficha ICP y las convenciones.

Cada fase incluye: objetivo, cambios de BD (esquema objetivo, en borrador), cambios de API, cambios de Frontend, criterios de aceptación y dependencias.

---

## 1. Estado actual del sistema (resumen)

### 1.1 Arquitectura

| Capa | Detalle |
|---|---|
| **Frontend** (`admin-sistema-sarita`) | Vue 3 + TS + Vite, Pinia, TanStack Query, Tailwind 4. ~30 módulos funcionales. SPA con guards de permisos (226 flags `modulo.accion`). |
| **API** (`api-sistema-sarita`) | NestJS. Capa delgada: casi toda la lógica de negocio vive en **funciones PL/pgSQL** en Supabase (`database_sql/funciones/`, ~500 archivos). |
| **BD** | PostgreSQL (Supabase). ~80 tablas. Esquema de referencia en `api-sistema-sarita/database_sql/databaseActualSupabase.sql`. Prefijos: `age_` agenda/actividades, `auth_`, `bal_` balones, `cli_` clientes, `com_` compras, `fin_` finanzas/caja, `gen_` generales/config, `gre_` guías de remisión, `pro_` productos, `ven_` ventas, `tra_` trabajadores, `act_` activos. |

### 1.2 Patrón "efectos laterales"

`ven_crear_comprobante` / `ven_actualizar_comprobante` / `ven_eliminar_comprobante` (y sus equivalentes en compras y recargas) son funciones grandes que, en una sola transacción, disparan:
`pro_movimientos` (kardex de producto), `bal_movimiento` (movimiento de cilindros), `fin_cuenta` + `fin_pago` (CxC/CxP), `gre_guia_remision`, efectos de caja y traslados.
La migración `migraciones/20260814_efectos_laterales.sql` (232 KB) concentra este orquestador.

> **Implicación para el plan:** la unificación de movimientos (F1) obliga a reescribir este orquestador. Como se trabaja "desde cero", se rediseña con una **API interna de dominio** (funciones pequeñas y componibles) en lugar de una macro-función.

### 1.3 Hallazgos frente a los apuntes

| Apunte del PDF | Estado actual |
|---|---|
| Pagos vinculados a cuenta bancaria + sincronizar con Caja | `ven_comprobante` tiene **solo** `id_medio_pago` (sin `id_cuenta_bancaria`, sin tabla de pagos múltiples). `fin_caja_gasto`, `fin_garantia`, `ven_garantia` tienen medio de pago pero **no** cuenta bancaria. `fin_caja_deposito` y `fin_pago` **sí** tienen `id_cuenta_bancaria`. `gen_cuenta_bancaria` hoy es **de clientes** (`id_cliente`), no existe el concepto de cuenta bancaria **propia de la empresa**. |
| Unificar Órdenes de salida + Recarga planta externa + GRE | Hoy separadas: `bal_recarga_planta` (+ `_detalle`), `gre_guia_remision` (+ `_detalle`, + `gre_documentos_referencia`). **No existe** tabla "orden de salida". |
| Unificar movimientos (producto / balones / órdenes) | Separadas: `bal_movimiento` (cilindros) y `pro_movimientos` (productos), cada una con su propio `id_documento_ref` / `id_tipo_documento_ref`. |
| Balón sin estado (lleno/vacío/semilleno) ni cantidad → stock global de gas | `bal_balon` lleva `id_estado_contenido`, `capacidad_restante`, `capacidad_restante_lb`, `presion_actual`. `bal_movimiento` guarda snapshots `id_estado_contenido`. Existe módulo `stock-gas` que hoy agrega a nivel balón. El gas ya es `pro_producto.es_gas = true`. |
| Oxígeno medicinal: LOTE + PROTOCOLO con historial por recarga | `bal_movimiento_recarga` y `bal_recarga_planta` tienen `lote`, `fecha_vencimiento_lote`, `fecha_prueba_hidrostatica`. **No hay** ficha de protocolo completa (analista, N° protocolo, valoración %, presión de muestreo, relación de envases aprobados…) ni historial dedicado. |
| Actividades: verificación salida + llegada por código de barras + ranking | `age_actividad` + `age_actividad_item` existen (con `id_comprobante`, `id_guia_remision`, `id_balon`, `id_producto`). **Faltan:** estado de verificación de salida y de llegada por ítem, captura por escaneo, y el ranking de usuarios. Recojos ya viven en `bal_recojo` (+ `_detalle`), separados de actividades. |
| Compras: actualizar stock al editar/eliminar | Existe `com_anular_compra`, `com_tiene_movimientos_inventario`, `com_revertir_cilindros_recarga_compra`. Cobertura parcial: edición de detalle no siempre re-cuadra stock. |
| Cliente: "SD" en vez de "VSD" | Es un valor en `gen_lista_opciones` (lista de tipos de documento). Cambio de etiqueta + código. |

---

## 2. Principios de la reestructuración

Estos principios aplican a **todas** las fases:

1. **Un movimiento por acción física.** Cada entrada/salida de inventario (producto o balón) genera **exactamente un** registro en la tabla unificada `inv_movimiento`. Si una venta ya generó el movimiento, emitir después la orden de salida / GRE **no** vuelve a moverlo: solo referencia el movimiento existente.
2. **El gas es un producto con stock global por almacén.** El balón es un envase con identidad y trazabilidad, pero **no** almacena "cuánto gas tiene" como dato de negocio. El contenido se deriva del stock del producto-gas y de los movimientos. (La presión física medida se conserva solo como lectura de control de calidad, no como saldo.)
3. **Todo dinero tiene medio de pago + cuenta.** Cualquier registro que mueva dinero (venta, pago, gasto de caja, garantía, depósito, reembolso) lleva `id_medio_pago` y, cuando el medio no es efectivo, `id_cuenta_bancaria` (de la empresa). La caja se alimenta de estos registros, no de valores sueltos.
4. **Un solo documento de salida.** Órdenes de salida, recargas en planta externa y guías de remisión son **el mismo documento** en distintos estados de un ciclo de vida (`BORRADOR → GENERADA → EMITIDA_SUNAT`), con un `tipo` que distingue el caso de uso.
5. **Detalle no duplicado.** Si un documento de salida proviene de una venta, guarda solo `id_venta` y toma el detalle por JOIN. Si no proviene de venta, tiene su propio detalle y gestiona su propio movimiento.
6. **Trazabilidad por escaneo.** Las operaciones de campo (entregas, recojos) se verifican ítem por ítem con lectura de código de barras, registrando estado de verificación en salida y en llegada.
7. **PDFs desde el backend.** La generación de PDF (órdenes, guías, comprobantes) se hace en el backend y el frontend solo la muestra/descarga.
8. **Sin migración.** No se escriben scripts de migración de datos. Se entrega el esquema nuevo + seeds. Los catálogos (`gen_lista`, `gen_lista_opciones`, ubigeo, permisos) se regeneran desde los archivos `database_sql/seeds/`.

---

## 3. Fases

### Fase 1 — Núcleo: Movimientos unificados + Stock global de gas *(fundacional)*

**Objetivo:** una sola tabla de movimientos de inventario y el gas gestionado como stock de producto. Todo lo demás se apoya en esto.

#### BD — esquema objetivo (borrador)

**`inv_movimiento`** (reemplaza `pro_movimientos` + `bal_movimiento`)

| Columna | Tipo | Nota |
|---|---|---|
| `id` | serial PK | |
| `fecha` | timestamp | |
| `id_tipo_movimiento` | FK `gen_lista_opciones` | ENTRADA, SALIDA, TRASLADO, AJUSTE, RECARGA_CLIENTE, RECARGA_PLANTA, DEVOLUCION, PRESTAMO, RETORNO_PRESTAMO, ALQUILER, MANTENIMIENTO… |
| `naturaleza` | enum (`PRODUCTO`, `BALON`) | discrimina el tipo de ítem |
| `id_producto` | FK `pro_producto` NULL | obligatorio si `naturaleza='PRODUCTO'` o si el balón mueve gas |
| `id_balon` | FK `bal_balon` NULL | obligatorio si `naturaleza='BALON'` |
| `cantidad` | numeric | + entra / − sale (o columna `signo`) |
| `id_unidad_medida` | FK NULL | |
| `id_almacen_origen` | FK NULL | |
| `id_almacen_destino` | FK NULL | traslados |
| `id_cliente` | FK NULL | contraparte |
| `id_documento_origen` | int NULL | id del documento que lo originó |
| `id_tipo_documento_origen` | FK `gen_lista_opciones` NULL | VENTA, COMPRA, ORDEN_SALIDA, RECARGA_PLANTA, PRESTAMO, ALQUILER, RECOJO, ACTIVIDAD, AJUSTE_MANUAL… |
| `id_movimiento_padre` | FK `inv_movimiento` NULL | anti-duplicación: si otro proceso ya generó el movimiento, se referencia y no se crea uno nuevo |
| `stock_anterior` / `stock_nuevo` | numeric NULL | solo cuando aplica a stock de producto |
| `snapshot_id_estado_balon` | FK NULL | estado operativo del balón (EN_ALMACEN, CON_CLIENTE, EN_PLANTA, EN_MANTENIMIENTO, BAJA) — **no** contenido |
| `glosa` | varchar | |
| auditoría | `estado`, `id_usuario_creacion`, `fecha_creacion`, … | |

Índices: `(id_tipo_documento_origen, id_documento_origen)`, `(id_balon, fecha)`, `(id_producto, id_almacen_origen, fecha)`, `id_movimiento_padre`.

**Cambios en `bal_balon`:** eliminar del modelo de negocio `id_estado_contenido`, `capacidad_restante`, `capacidad_restante_lb`. `presion_actual` pasa a ser lectura opcional de control de calidad (o se mueve a `bal_balon_lectura`). Se conserva `id_estado_balon` (estado operativo del envase) e `id_producto_gas` (qué gas contiene ese balón por diseño).

**Stock de gas:** se usa `pro_stock` (por `id_almacen`, `id_producto`) tal cual. El producto-gas debe tener `es_gas = true` y `afecta_stock = true`.
- Recarga a cliente (Sarita → cliente): `inv_movimiento` SALIDA de `id_producto_gas` del almacén, cantidad = m³ recargados.
- Ingreso por recarga en planta externa (planta → Sarita): `inv_movimiento` ENTRADA de `id_producto_gas` según el gas asociado al balón.
- El "stock de gas" que hoy vive a nivel balón se elimina; la vista `bal_listar_stock_gas` se reimplementa sobre `pro_stock` + `inv_movimiento`.

#### API

- Nuevo módulo `inventario-movimientos` (unifica `movimientos-inventario` + `movimientos-balon`). Endpoints: listar (con filtros por naturaleza, documento origen, balón, producto, almacén, rango de fechas), obtener, crear ajuste manual, anular.
- **API interna de dominio** (funciones PL/pgSQL pequeñas y componibles, reemplazan al orquestador monolítico):
  - `inv_registrar_movimiento(...)` — punto único de escritura; valida anti-duplicación por `id_movimiento_padre` / `(tipo_doc, id_doc)`.
  - `inv_revertir_por_documento(tipo_doc, id_doc)` — revierte todos los movimientos de un documento.
  - `inv_stock_producto(id_producto, id_almacen)` / `inv_saldo_gas(id_producto_gas, id_almacen)`.
- Reescritura de `ven_crear_comprobante`, `com_crear_compra`, `bal_crear_recarga_cliente`, `bal_crear_recarga_planta`, préstamos, alquileres, recojos y mantenimientos para que **todos** llamen a `inv_registrar_movimiento`.

#### Frontend

- Fusionar `productos/movimientos` y `balones/movimientos` en una sola vista **Movimientos** con pestañas/filtro por naturaleza (Producto / Balón) y columna "Documento origen" enlazable.
- `balones/stock-gas` → reapuntar a los nuevos endpoints; el badge de contenido del balón pasa a mostrarse como derivado (informativo), no editable.
- Quitar de formularios de balón los campos de estado de contenido y capacidad restante.

#### Criterios de aceptación

- Una venta de gas + su posterior orden de salida generan **un** movimiento de salida de gas (no dos).
- El saldo de gas por almacén se obtiene de `pro_stock` y cuadra con la suma de `inv_movimiento`.
- Anular una venta revierte exactamente sus movimientos (producto y balón) y nada más.
- El libro de cilindros ya no muestra columnas de estado/cantidad de contenido (ver F8).

#### Dependencias
Ninguna. Es la base de F2, F4, F5, F7.

---

### Fase 2 — Documento de salida unificado (Órdenes de salida + Recarga planta + GRE)

**Objetivo:** un solo documento con ciclo de vida, que cubre orden de salida interna, recarga en planta externa y guía de remisión electrónica.

#### BD — esquema objetivo (borrador)

**`doc_salida`** (reemplaza `bal_recarga_planta` + `gre_guia_remision` y añade "orden de salida")

| Columna | Nota |
|---|---|
| `id`, `numero` (correlativo interno) | |
| `id_tipo_orden` | FK `gen_lista_opciones`: `ORDEN_SALIDA_VENTA`, `ORDEN_SALIDA_INTERNA`, `RECARGA_PLANTA_EXTERNA`, `TRASLADO`… (apunte 1.c.iv.5) |
| `id_estado_ciclo` | `BORRADOR` → `GENERADA` (documento listo) → `EMITIDA_SUNAT` (aceptada) → `ANULADA` |
| `emitido_sunat` | boolean (apunte 1.c.iv.5: "una vez emitido a SUNAT, True/False") |
| `id_venta` | FK `ven_comprobante` NULL — si viene de una venta, **el detalle se toma por JOIN** y no se duplica (apunte 1.c.iv.4) |
| `id_proveedor` / `id_planta` | para recarga en planta externa |
| `id_cliente` / `id_destinatario` | |
| `id_sucursal`, `id_almacen` | |
| `fecha`, `fecha_traslado`, `fecha_retorno` | |
| Bloque GRE | `serie`, `numero_sunat`, `id_estado_sunat`, `ticket_sunat`, `hash_documento`, `xml_firmado`, `cdr_respuesta`, motivo/modalidad de traslado, transportista, chofer, vehículo, peso, bultos, direcciones origen/llegada, distritos |
| Bloque recarga planta | `serie_guia_salida`, `numero_guia_salida`, `serie_guia_ingreso`, `numero_guia_ingreso`, `id_comprobante_compra`, `lote`, `fecha_vencimiento_lote`, `fecha_prueba_hidrostatica` (se enriquece en F5) |
| `id_comprobante_pdf` | archivo generado en backend (apunte 1.c.iv.7) |
| auditoría | |

**`doc_salida_detalle`** (solo se puebla cuando **no** proviene de venta; apunte 1.c.iv.4)

| Columna | Nota |
|---|---|
| `id`, `id_doc_salida`, `item` | |
| `id_producto` NULL / `id_balon` NULL | |
| `descripcion`, `id_unidad_medida`, `cantidad`, `glosa` | |
| `id_movimiento` | FK `inv_movimiento` — el movimiento propio que este detalle generó |

**`doc_salida_referencia`** (reemplaza `gre_documentos_referencia`): documentos SUNAT relacionados.
**`doc_rango_numeracion`** (reemplaza `gre_rango_numeracion`).

Reglas:
- `ORDEN_SALIDA_VENTA` con `id_venta`: al pasar a `GENERADA` se puede "convertir" a GRE (llenar bloque GRE) y luego `EMITIDA_SUNAT` (apunte 1.c.iv.1). El movimiento de inventario ya existe (lo creó la venta) → se enlaza vía `inv_movimiento.id_movimiento_padre`, **no se recrea** (apunte 1.c.iv.6).
- `RECARGA_PLANTA_EXTERNA`: lleva datos de GRE (bloque GRE opcional) y puede emitirse a SUNAT (apunte 1.c.iv.2). Su ingreso de balones/gas se registra como **compra** (ver F7, apunte 4.b.ii) y genera su propio movimiento.
- Toda `doc_salida` puede imprimirse (uno o varios) desde un botón; PDF generado en backend (apunte 1.c.iv.7).

#### API

- Módulo `documentos-salida` (unifica `guias-remision` + `recargas-planta` a nivel de documento). Endpoints: CRUD, `generar` (BORRADOR→GENERADA), `emitir-sunat`, `consultar-cdr`, `anular`, `pdf` (blob), `pdf-lote` (varias en un PDF).
- Integración con el servicio de facturación electrónica existente (`facturacion-electronica`).
- `crear-desde-venta(id_venta)` — crea `doc_salida` tipo `ORDEN_SALIDA_VENTA` enlazada, sin duplicar detalle ni movimiento (apuntes 1.c.ii, 1.c.iv.4).

#### Frontend

- `ventas/guias-remision` + `balones/recargas/recargas-planta` → se consolidan en **Documentos de salida** con filtro por tipo. Vistas de lista, formulario y detalle únicas.
- En POS y en el detalle de comprobante: botón **"Crear orden de salida"** (opcional) tras la venta (apunte 1.c.ii).
- Botón **Imprimir** (individual y selección múltiple) que pide el PDF al backend.
- Badge de estado de ciclo + badge SUNAT.

#### Criterios de aceptación

- Una orden de salida creada desde una venta muestra el detalle de la venta sin registros duplicados y sin un segundo movimiento de inventario.
- Una recarga en planta externa puede llevar datos de GRE y emitirse a SUNAT desde la misma pantalla.
- El correlativo interno y la numeración SUNAT son independientes y consistentes.

#### Dependencias
F1 (usa `inv_movimiento` y `id_movimiento_padre`).

---

### Fase 3 — Caja, medios de pago y cuentas bancarias

**Objetivo:** todo movimiento de dinero queda vinculado a medio de pago **y** cuenta bancaria; la caja se organiza por resúmenes y notifica al ADMIN.

#### BD — esquema objetivo (borrador)

- **Cuentas bancarias de la empresa:** ampliar `gen_cuenta_bancaria` con `id_empresa` (o `ambito` = `CLIENTE` | `EMPRESA`), `alias`, `id_medio_pago_asociado`. Una cuenta de empresa se asocia a uno o varios medios de pago (apuntes 1.c.i, 1.c.vi).
- **Pagos de venta multi-medio:** nueva **`ven_comprobante_pago`** (`id_comprobante`, `id_medio_pago`, `id_cuenta_bancaria` NULL, `monto`, `numero_operacion`, `referencia`). `ven_comprobante.id_medio_pago` queda como conveniencia/derivado. Permite dividir un cobro en efectivo + transferencia, cada parte con su cuenta.
- **Añadir `id_cuenta_bancaria`** a: `fin_caja_gasto`, `fin_garantia`, `ven_garantia`, `ven_garantia_movimiento` (apunte 1.a.i: "dinero vinculado al tipo de pago pero no a las cuentas; vincular a cuenta bancaria"). `fin_pago` y `fin_caja_deposito` ya lo tienen.
- **Garantía ligada a cuenta bancaria** vía el medio de pago (apunte 1.c.vi): al elegir medio de pago no-efectivo en la garantía, se exige/propone la cuenta bancaria asociada.
- **Movimientos de caja por resumen:** vista/tabla `fin_caja_resumen` que agrupa los movimientos de una sesión de caja por tipo (ventas efectivo, ventas otros medios, gastos, depósitos, garantías cobradas, garantías devueltas). El "Historial de movimientos de caja" se organiza en **pestañas según estos resúmenes** (apunte 1.a.ii).
- **Notificaciones:** al abrir y al cerrar caja (`fin_abrir_caja_sesion`, `fin_cerrar_caja_sesion`) se crea `gen_notificacion` dirigida a los usuarios con rol ADMIN (apunte 1.a.iii). Ya existe la infraestructura `gen_crear_notificacion` + `auth_listar_ids_usuarios_admin_con_permiso`.

#### API

- `caja.service`: en apertura/cierre, disparar notificación a ADMIN.
- `caja`: endpoint "libro diario / historial" devuelve datos ya segmentados por resumen (para las pestañas).
- `finanzas` / `garantias` / POS: aceptar y validar `id_cuenta_bancaria` en cada cobro; sincronizar el efecto de caja con esa cuenta.
- Catálogo: endpoint de cuentas bancarias de empresa por medio de pago.

#### Frontend

- **`caja/HistorialCajaView`**: rehacer como **modal accesible desde el menú Caja**, con pestañas por resumen y **exportación** (Excel/PDF) (apuntes 1.b.i, 1.a.ii). Ya existe `exportarLibroDiarioExcel`.
- Formularios de cobro (POS, RegistrarGastoCajaModal, GarantiaFormModal, RegistrarPagoModal): selector de **cuenta bancaria** condicionado al medio de pago; autocompletado con la cuenta asociada.
- `configuracion/cuentas-bancarias`: soportar cuentas de la empresa (nuevo ámbito) además de las de cliente.
- Campana de notificaciones: ya renderiza `gen_notificacion`; solo verificar que muestre las de apertura/cierre.

#### Criterios de aceptación

- Un cobro por transferencia en el POS queda registrado con medio de pago y cuenta bancaria de la empresa, y aparece en el resumen de caja correspondiente.
- Al abrir o cerrar caja, los usuarios ADMIN reciben notificación.
- El historial de caja se abre como modal, muestra pestañas por resumen y se exporta.
- Una garantía cobrada por Yape queda ligada a la cuenta/billetera de la empresa.

#### Dependencias
Independiente de F1/F2 a nivel de datos, pero conviene hacerla después de F1 para no tocar dos veces el orquestador de venta. Puede solaparse con F4.

---

### Fase 4 — Punto de Venta: escenarios de balón y gas

**Objetivo:** implementar en el POS los escenarios de negocio de los apuntes 1.c.iii, 1.c.v, 1.c.vii, 1.c.viii, 1.c.ix, 1.c.x.

#### Reglas de negocio a implementar

| Apunte | Regla |
|---|---|
| 1.c.iii | La **recarga Sarita → Cliente** se registra como **venta** (línea de comprobante de tipo gas), no como "recarga" independiente. La recarga en planta externa sigue siendo su propio flujo. |
| 1.c.v | Al agregar un ítem de **tipo gas**: listar **todos los balones**, permitir seleccionar el balón y **la cantidad (m³) que se está recargando**. Búsqueda del balón por **código de barras**. (Ya existe `PosBalonSelectField`, `BalonBarcodeScanButton`.) |
| 1.c.vii | Si el cliente **trae su propio balón**, la recarga se vende como **producto/servicio** y **no** se registra el balón del cliente en el sistema. |
| 1.c.viii | Nuevo escenario **"Préstamo con garantía de balón"**: el cliente deja un balón y se lleva uno de Sarita recargado. Se **registra el balón** que deja (alta en `bal_balon` como balón de garantía / propiedad del cliente) y, si su **prueba hidrostática está vencida**, se registra como **observación** del balón. Se crea un **préstamo** con ese balón como garantía. |
| 1.c.ix | Cliente que ya tiene un balón prestado de la empresa (dejó el suyo en garantía) y pide **nueva recarga**: <br>• Si hay un balón disponible de **las mismas características** → se entrega uno nuevo, se **cierra el préstamo anterior** y se **abre uno nuevo** con el detalle del nuevo balón entregado + el balón de garantía previo. <br>• Si **no** hay disponible → se recarga el que trae y se registra un **nuevo préstamo como extensión** del anterior (enlace `id_prestamo_origen`). |
| 1.c.x | **Cada préstamo se registra como `inv_movimiento`** (tipo PRESTAMO / RETORNO_PRESTAMO) para seguimiento de balones. |

#### BD

- `bal_prestamo`: añadir `id_prestamo_origen` (FK a sí misma) para encadenar extensiones/renovaciones (apunte 1.c.ix).
- `bal_prestamo_detalle`: distinguir rol del balón (`ENTREGADO` vs `GARANTIA`).
- `bal_balon`: `origen_registro` = `EMPRESA` | `GARANTIA_CLIENTE`; `observacion` ya existe para el caso de PH vencido.
- Los flujos de préstamo/garantía-balón generan `inv_movimiento` (apunte 1.c.x) — habilitado por F1.
- Vínculo garantía monetaria ↔ cuenta bancaria: ya cubierto en F3 (apunte 1.c.vi).

#### API / Frontend

- `PosCilindroPanel` / `PosRecargaPanel`: unificar la lógica para que "recarga a cliente" sea una línea de venta (apunte 1.c.iii); selección de balón + cantidad m³ + escaneo (apunte 1.c.v).
- Asistente de POS con selector de **modalidad de balón**: (a) balón de Sarita, (b) balón propio del cliente (no se registra), (c) deja balón en garantía y se lleva uno de Sarita, (d) cliente con préstamo vigente pide recarga → resolver caso 1.c.ix.
- Reutilizar `usePosBalonSelect`, `usePosKitMedicinal`, `tipoPrestamoReglas`.

#### Criterios de aceptación

- Recargar el balón de un cliente frecuente de Sarita produce un comprobante de venta con línea de gas y un único movimiento de salida de gas.
- El escenario "deja balón / se lleva uno recargado" crea: alta del balón de garantía (con observación si PH vencido), préstamo con garantía, movimientos de balón, y (si aplica) garantía monetaria con cuenta bancaria.
- El caso de renovación con/sin stock cierra y encadena préstamos correctamente.

#### Dependencias
F1 (movimientos), F3 (garantía↔cuenta). Idealmente después de F2 para poder emitir la orden de salida de la recarga.

---

### Fase 5 — Oxígeno medicinal: lote y protocolo con historial

**Objetivo:** registrar la ficha de la planta (LOTE + PROTOCOLO, ver Anexo A) al ingresar oxígeno medicinal por compra, actualizarla en cada recarga y conservar historial por recarga (apunte 2.a.ii).

#### BD — esquema objetivo (borrador)

**`bal_lote_protocolo`** (cabecera de la ficha ICP)

| Columna | Origen en la ficha ICP |
|---|---|
| `id` | |
| `numero_lote` | "N° DE LOTE" (ej. `GOXM1260827-01`) |
| `numero_protocolo` | "N° PROTOCOLO" (ej. `060`) |
| `id_proveedor` | INDUSTRIAS CRIOGÉNICAS DEL PERÚ S.A.C. |
| `id_producto_gas` | Oxígeno Medicinal |
| `descripcion_producto` | "OXÍGENO MEDICINAL 99,5% V/V GAS COMPRIMIDO MEDICINAL" |
| `forma_farmaceutica` | "GAS COMPRIMIDO" |
| `presentacion` | "Cilindro de Acero al Carbono x 10 m³" |
| `norma_tecnica` | "USP VIGENTE" |
| `metodo_fabricacion` | "Licuefacción del Aire" |
| `fecha_analisis`, `fecha_emision`, `fecha_fabricacion` | |
| `fecha_vencimiento` | "08/2027" (mes/año) |
| `tamano_lote_m3` | "600 m³" |
| `cantidad_envases` | "60 envase(s)" |
| `valoracion_o2_pct` | "99.90%" |
| `limite_co2_ppm`, `limite_co_ppm` | "300 ppm" / "10 ppm" (o N.A.) |
| `cilindro_muestreado_serie` | "J25642171" |
| `temperatura_muestreo_c`, `presion_muestreo_psi` | "21.0 °C" / "2900 PSI" |
| `analista`, `conclusion` | |
| `codigo_documento`, `version_documento` | "ICP-INS-011" / "05" |
| `id_archivo_pdf` | FK `gen_archivo` — PDF escaneado de la ficha |
| auditoría | |

**`bal_lote_protocolo_prueba`** (filas de "DATOS DE ANÁLISIS"): `id_lote_protocolo`, `prueba` (Descripción, Identificación A, Identificación B, Valoración, Límite de CO2, Límite de CO), `especificacion`, `resultado`.

**`bal_lote_protocolo_envase`** (RELACIÓN DE ENVASES APROBADOS): `id_lote_protocolo`, `serie_envase`, `id_balon` NULL (match con `bal_balon.numero_serie` si existe en el sistema).

**Historial por recarga:** `bal_movimiento_recarga` (o su equivalente en el modelo nuevo) referencia `id_lote_protocolo`. Así, cada recarga de O2 medicinal queda ligada a la ficha vigente, y el historial se obtiene filtrando las recargas del balón. `bal_balon` guarda `id_lote_protocolo_vigente` (último aplicado).

#### API / Frontend

- Módulo `lotes-protocolo`: CRUD + carga del PDF + parser asistido (los campos se ingresan a mano; el PDF se adjunta).
- En **Compras** de oxígeno medicinal (apunte 2.a.ii "al momento de su ingreso"): paso para crear/seleccionar el lote-protocolo y asociarlo a los balones ingresados.
- En **Recarga en planta externa** y en el detalle del balón: mostrar lote-protocolo vigente + historial (timeline de recargas con su ficha).
- En **detalle de balón** (oxígeno medicinal): sección "Lote y Protocolo" con historial.

#### Criterios de aceptación

- Al comprar O2 medicinal se registra la ficha ICP completa y se vincula a los balones.
- Cada recarga posterior de O2 medicinal referencia su lote-protocolo; el detalle del balón muestra el historial.

#### Dependencias
F7 (compras) para el punto de ingreso; F1 para el modelo de recarga.

---

### Fase 6 — Actividades: entregas y recojos con verificación por escaneo + ranking

**Objetivo:** implementar el flujo operativo de entregas y recojos de los apuntes 8.b.i.1–8.b.i.6.

#### BD — esquema objetivo (borrador)

- **`age_actividad`**: ya tiene `id_comprobante`, `id_guia_remision`. Añadir `id_doc_salida` (FK a la tabla de F2), `id_prestamo` (para recojos), `id_tipo_origen` (VENTA | ORDEN_SALIDA | PRESTAMO).
- **`age_actividad_item`** — añadir (apunte 8.b.i.2):
  - `id_venta_detalle` NULL / `id_doc_salida_detalle` NULL — referencia al detalle de origen (carga por FK, apunte 8.b.i.1).
  - `id_estado_verificacion_salida` FK `gen_lista_opciones` (PENDIENTE, OK, CON_OBSERVACION).
  - `id_estado_verificacion_llegada` FK `gen_lista_opciones`.
  - `observacion_salida`, `observacion_llegada`.
  - `id_balon` ya existe → sirve para el escaneo.
  - Para recojos (apunte 8.b.i.4): `id_estado_producto_recogido` FK (RECOGIDO, NO_RECOGIDO, DAÑADO…).
- **`age_actividad_verificacion`** (log de escaneos): `id_actividad_item`, `momento` (SALIDA | LLEGADA), `codigo_escaneado`, `coincide` boolean, `fecha`, `id_usuario`.
- **Ranking** (apunte 8.b.i.6): vista `age_ranking_usuarios(fecha_desde, fecha_hasta)` = conteo de actividades registradas/cerradas por usuario.

#### Reglas

- Una **entrega** se crea a partir de una orden/venta; la actividad valida los ítems de la orden y **carga el detalle por FK** (apunte 8.b.i.1). No se re-teclea el detalle.
- Verificación **al salir** y **al llegar**, ítem por ítem, por **escaneo de código de barras** (apunte 8.b.i.3). Al finalizar cada momento: estado "todo OK / hay observaciones" + descripción.
- **Recojo** (apunte 8.b.i.4): se selecciona desde un listado de **préstamos por vencer o vencidos**; la actividad guarda `id_prestamo` (o `id_doc_salida`) y el detalle enlaza `id_venta`/`id_venta_detalle`; al recoger se escanea y se registra el estado del producto recogido.
- **Auto-registro** (apunte 8.b.i.5): al vencer (o estar por vencer) un préstamo con fecha de vencimiento, se crea automáticamente una actividad de recojo (job programado; ya existe infraestructura de jobs de notificación — ver `api-sistema-sarita/docs/notificaciones-jobs.md` y `bal_listar_prestamos_por_vencer_notificar`).

#### API / Frontend

- `operativa/actividades`: formulario de actividad con carga de ítems desde orden/venta; pantalla de **verificación por escaneo** (salida y llegada) reutilizando `BalonBarcodeScanButton` / `BarcodeCaptureModal`.
- `operativa` gana submódulo **Recojos** (o se integra con `balones/recojos` existente) con el selector de préstamos por vencer/vencidos.
- Widget/vista **Ranking de colaboradores** (ya hay `ActividadesColaboradoresPanel`, `agruparActividadesPorColaborador` — extender a ranking por conteo).
- Job de auto-creación de recojos.

#### Criterios de aceptación

- Crear una entrega desde una orden trae el detalle sin re-teclear; la verificación de salida y de llegada se hace por escaneo y guarda observaciones.
- Un recojo se genera desde la lista de préstamos vencidos y su verificación por escaneo actualiza el estado del producto recogido.
- Los préstamos vencidos generan actividad de recojo automáticamente.
- Existe un ranking de usuarios por actividades registradas en un rango de fechas.

#### Dependencias
F2 (documento de salida), F1 (movimientos de balón en recojo).

---

### Fase 7 — Compras, gastos e inventario (consistencia de stock)

**Objetivo:** apuntes 3.a.i, 4.b.ii, 4.b.iii, 4.b.iv.

#### Reglas

| Apunte | Regla |
|---|---|
| 3.a.i | Al **editar o eliminar** una compra, el **stock se recalcula**: se revierten los `inv_movimiento` previos del documento y se re-generan según el detalle actual. |
| 4.b.ii | El **ingreso de balones por recarga en planta externa (planta → Sarita)** se registra como **compra**, con vinculación **opcional** a una orden (según lo exija la categoría de gasto) y **registro de comprobante opcional**. |
| 4.b.iii | En la tabla de compras/ingresos, **badge de alerta** cuando el registro **no tiene comprobante** asociado. |
| 4.b.iv | **Un `inv_movimiento` por cada acción**; la compra actualiza stock de producto **y/o** inventario de balones si la compra es de un balón. |

#### BD

- `com_comprobante_compra`: ya tiene `id_recarga_planta`, `afecta_inventario`, `declarar_sunat`. Añadir `id_doc_salida` (reemplaza `id_recarga_planta` tras F2) y `tiene_comprobante` derivado (o se calcula por `serie`/`numero` nulos) para el badge.
- Toda la lógica de stock de compra pasa por `inv_registrar_movimiento` / `inv_revertir_por_documento` (F1).
- `com_actualizar_compra_detalle` / `com_eliminar_compra_detalle`: re-cuadre de stock obligatorio.

#### API / Frontend

- `compras`: al editar/eliminar, invocar el re-cuadre. Tests de que el stock final coincide.
- `compras` (lista): columna con **badge "Sin comprobante"**.
- Flujo "recarga planta externa" (F2) → botón "Registrar como compra" que precarga proveedor, almacén, balones y categoría de gasto; comprobante y orden opcionales.

#### Criterios de aceptación

- Editar la cantidad de una línea de compra deja el stock del producto exactamente en el valor esperado.
- Eliminar una compra revierte todos sus movimientos.
- El ingreso por recarga en planta externa aparece en compras con badge si no tiene comprobante.

#### Dependencias
F1, F2.

---

### Fase 8 — Ajustes finos y limpieza

**Objetivo:** apuntes de bajo riesgo, aislados. **Se pueden adelantar y hacer en paralelo desde el inicio** (no bloquean nada), pero se listan al final para no desviar el foco del núcleo.

| Apunte | Cambio |
|---|---|
| 2.a.i | **Libro de cilindros:** quitar de la vista las columnas de estado de contenido (lleno / vacío / semilleno) y cantidad. El contenido se gestiona en Stock (F1). Ajustar `bal_listar_balones`, `CilindrosListView`, `BalonContenidoBadge`. |
| 7.a.i | **Clientes:** el tipo de documento "sin documento" se etiqueta **`SD`** (no `VSD`). Cambiar en `gen_lista_opciones` (seed) y en el frontend (`ClienteSinDocumentoModal`, constantes de tipo de documento, `PosClienteField`). |
| 4.b.iii | (Si no se hizo en F7) badge "sin comprobante". |
| 1.c.iv.7 | (Si no se hizo en F2) generación de PDF de orden en backend + botón en front. |

#### Módulos que el PDF solo enumera (sin cambios de fondo)
Se revisan por consistencia visual/UX, sin rediseño: Comprobantes, Ventas sin documento, Notas de crédito, Resumen diario, Guías de remisión (1.d–1.h); Recargas, Alquileres, Préstamos, Ruta Pueblos, Mantenimiento, Tipos de balón (2.c–2.j); Gastos de caja (3.b); Catálogo, Categorías, Subcategorías (4.a, 4.c, 4.d); Configuración completa (5); Gestión Empresa: Permisos y certificados, Trabajadores, Activos (6); Sueltos: Finanzas, Alertas (8.a, 8.c).

---

## 4. Mapa de trazabilidad (apunte del PDF → fase)

| # | Apunte | Fase |
|---|---|---|
| 1.a.i | Dinero vinculado al tipo de pago pero no a cuentas bancarias → vincular a cuenta bancaria | **F3** |
| 1.a.ii | Historial de movimientos de caja organizado por pestañas según los resúmenes en caja | **F3** |
| 1.a.iii | Notificación al abrir y cerrar caja al rol ADMIN | **F3** |
| 1.b.i | Historial de caja en un modal en el menú Caja + exportable | **F3** |
| 1.c.i | Vincular pagos a cuentas bancarias — sincronizar con Caja | **F3** |
| 1.c.ii | Crear opcionalmente una orden de salida tras la venta (con detalle de la venta) | **F2** |
| 1.c.iii | Recarga Sarita → Cliente considerada como venta | **F4** |
| 1.c.iv.1 | Orden de salida puede emitirse a SUNAT como GRE | **F2** |
| 1.c.iv.2 | Recarga planta externa → Sarita tendrá datos de una GRE | **F2** |
| 1.c.iv.3 | Una GRE se genera y luego se permite emitir a SUNAT | **F2** |
| 1.c.iv.4 | Si la orden proviene de venta: solo `id_venta` + JOIN; si no, detalle y movimiento propios | **F2** |
| 1.c.iv.5 | Columna "Tipo de orden" + flag emitido a SUNAT | **F2** |
| 1.c.iv.6 | Unificar movimientos en una sola tabla; no duplicar el movimiento | **F1** |
| 1.c.iv.7 | Botón imprimir orden(es), PDF en backend, mostrar en front | **F2** (fallback F8) |
| 1.c.v | Ítem tipo gas: listar balones, seleccionar, cantidad a recargar, búsqueda por código de barras | **F4** |
| 1.c.vi | Garantía vinculada a cuenta bancaria; cuenta asociada al método de pago | **F3** |
| 1.c.vii | Cliente trae su balón → se vende como producto, no se registra el balón | **F4** |
| 1.c.viii | Préstamo con garantía de balón; PH vencido → observación | **F4** |
| 1.c.ix | Renovación de recarga con/sin balón disponible; cerrar y encadenar préstamos | **F4** |
| 1.c.x | Cada préstamo se registra como movimiento | **F1** (modelo) + **F4** (flujo) |
| 1.d–1.h | Comprobantes, Ventas sin documento, Notas de crédito, Resumen diario, Guías de remisión | **F8** (revisión) |
| 2.a.i | Quitar columnas de estado/cantidad del libro de cilindros | **F1** (modelo) + **F8** (UI) |
| 2.a.ii | Oxígeno medicinal: datos de LOTE y PROTOCOLO con historial por recarga | **F5** |
| 2.b–2.j | Stock de gas, Recargas, Alquileres, Préstamos, Recojos, Movimientos, Ruta Pueblos, Mantenimiento, Tipos de balón | **F1** (stock, movimientos) / **F6** (recojos) / **F8** (resto) |
| 3.a.i | Actualizar el stock al editar o eliminar una compra | **F7** |
| 3.b | Gastos de caja | **F8** (revisión) |
| 4.a | Catálogo de almacenes | **F8** (revisión) |
| 4.b.i | Gas como producto con stock global; balón sin estado ni cantidad de gas | **F1** |
| 4.b.ii | Ingreso de balones por recarga planta externa se registra como compra (orden y comprobante opcionales) | **F7** |
| 4.b.iii | Badge de alerta "sin comprobante" en la misma tabla | **F7** (fallback F8) |
| 4.b.iv | Un movimiento por acción; actualizar stock de producto o inventario de balones | **F1** + **F7** |
| 4.c, 4.d | Categorías y subcategorías | **F8** (revisión) |
| 5 | Configuración: Sucursales, Almacenes, Condiciones de pago, Empresa, Choferes, Vehículos, Cuentas bancarias, Sunat | **F3** (cuentas bancarias de empresa) + **F8** (resto) |
| 6 | Gestión Empresa: Permisos y certificados, Trabajadores, Activos | **F8** (revisión) |
| 7.a.i | Tipo de documento "SD" en vez de "VSD" | **F8** |
| 8.a | Sueltos: Finanzas | **F8** (revisión) |
| 8.b.i.1 | Registrar entrega desde una orden; actividad con tipo y datos; validar ítems; cargar detalle por FK | **F6** |
| 8.b.i.2 | Detalle de actividad con id del detalle de venta/orden + estado de verificación de salida y de llegada | **F6** |
| 8.b.i.3 | Verificación del detalle por escaneo de código de barras (salida y llegada) con estado y observaciones | **F6** |
| 8.b.i.4 | Recojo desde listado de préstamos por vencer/vencidos; verificación por escaneo; estado del producto recogido | **F6** |
| 8.b.i.5 | Auto-registro de actividad de recojo al vencer un préstamo | **F6** |
| 8.b.i.6 | Ranking de usuarios que más registran actividades | **F6** |
| 8.b.ii | Recojos | **F6** |
| 8.c | Alertas | **F8** (revisión) |
| 8.d | "…" (pendiente de definir) | **abierto** — ver Sección 5 |

---

## 5. Decisiones abiertas / preguntas pendientes

Confirmar antes o durante la fase indicada:

1. **(Global) "Desde cero" — alcance real.** ¿Se regenera solo el **esquema de BD** + seeds (catálogos, ubigeo, permisos) y se re-cargan maestros manualmente, o hay maestros (clientes, productos, balones, empresas) que **sí** deben conservarse y por tanto necesitan un export/import puntual aunque no sea una "migración" formal?
2. **(F1) `bal_balon.presion_actual`.** ¿Se elimina del todo o se conserva como última lectura de control de calidad (sin valor de saldo)? Propuesta: conservarla como lectura, no como stock.
3. **(F1) Unidad del stock de gas.** ¿El stock global de gas se lleva siempre en **m³**? Hoy conviven m³, lb y "UNID". Propuesta: m³ como unidad canónica de stock; conversión con `factor_lb_m3` / `factor_kg_m3` de `pro_producto`.
4. **(F2) Numeración.** ¿La "orden de salida" tiene correlativo propio por sucursal/almacén? ¿Series de GRE por punto de emisión?
5. **(F2) "Solicitar Foto"** (apunte 1.c.iv.7): el PDF menciona guiarse de un ejemplo llamado "Solicitar Foto". ¿Qué es ese ejemplo? ¿Un formato de PDF existente a replicar?
6. **(F3) Cuentas bancarias de la empresa.** ¿Una cuenta puede estar asociada a **varios** medios de pago (p. ej. una cuenta que recibe Yape y transferencia)? ¿Multi-sucursal?
7. **(F3) Resúmenes de caja.** Confirmar la lista exacta de "pestañas" del historial (apunte 1.a.ii): ¿Ventas efectivo / Ventas otros medios / Gastos / Depósitos / Garantías / Ajustes? ¿Alguna más?
8. **(F4) Escenario 1.c.ix sin stock.** La "extensión del préstamo anterior": ¿se mantiene el **mismo** número de préstamo con un detalle nuevo, o es un préstamo nuevo con `id_prestamo_origen`? Propuesta: préstamo nuevo encadenado.
9. **(F4) Balón de garantía del cliente (1.c.viii).** ¿Se da de alta en `bal_balon` con propiedad del cliente, o en una tabla aparte de "balones en custodia"? Propuesta: `bal_balon` con `origen_registro = GARANTIA_CLIENTE`.
10. **(F5) Ingreso manual vs. parser.** La ficha ICP llega en PDF. ¿Basta con adjuntar el PDF y teclear los campos clave, o se quiere OCR/parsing automático? Propuesta: adjuntar + teclear en esta fase.
11. **(F5) Datos que "se actualizan en cada recarga".** ¿Todos los campos de la ficha, o solo lote, vencimiento y valoración? El resto (norma, método, presentación) suele ser constante por proveedor.
12. **(F6) Auto-recojo (8.b.i.5).** ¿Cuántos días antes del vencimiento se crea la actividad? ¿A quién se asigna por defecto?
13. **(F6) ¿`operativa/actividades` absorbe `balones/recojos`,** o siguen como módulos separados enlazados? El PDF los pone juntos bajo "Sueltos > Actividades".
14. **(F8) Apunte 8.d ("…").** Queda un ítem abierto en el PDF. ¿Qué debe ir ahí?
15. **(Orden de fases)** Propuesta: F1 → F2 → (F3 ∥ F4) → F7 → F5 → F6 → F8. ¿Se ajusta a tus prioridades de negocio?

---

## Anexo A — Contenido de la ficha ICP ("PDF billy")

Documento: **INDUSTRIAS CRIOGÉNICAS DEL PERÚ S.A.C. — Protocolo de Análisis Cilindros** · Código `ICP-INS-011` · Versión `05`.

### Cabecera

| Campo | Valor del ejemplo |
|---|---|
| N° de Lote | `GOXM1260827 - 01` |
| N° Protocolo | `060` |
| Producto | OXÍGENO MEDICINAL 99,5% V/V GAS COMPRIMIDO MEDICINAL |
| Forma Farmacéutica | GAS COMPRIMIDO |
| Presentación | Cilindro de Acero al Carbono x 10 m³ |
| Norma Técnica | USP VIGENTE |
| Tamaño del Lote | 600 m³ |
| Método de Fabricación | Licuefacción del Aire |
| Cantidad | 60 envase(s) |
| Fecha de Análisis | 27/08/2026 |
| Fecha de Emisión | 27/08/2026 |
| Fecha de Fabricación | 27/08/2026 |
| Fecha de Vencimiento | 08/2027 (mes/año) |

### Datos de análisis (Pruebas / Especificaciones / Resultado)

| Prueba | Especificación | Resultado (ejemplo) |
|---|---|---|
| Descripción | Gas incoloro, inodoro e insípido | Conforme |
| Identificación A | La señal paramagnética confirma la presencia de oxígeno | Conforme |
| Identificación B | El gas cumple los criterios de aceptación en la Valoración | Conforme |
| Valoración | No menos de 99,5% por volumen de O₂ | 99.90% |
| Límite de CO₂ * | No más de 300 ppm | N.A. |
| Límite de CO * | No más de 10 ppm | N.A. |

\* El oxígeno medicinal producido por licuefacción del aire está exento de las pruebas de impurezas (Límite de CO₂ y de CO).

### Cilindro muestreado

| Campo | Valor del ejemplo |
|---|---|
| Serie | J25642171 |
| Temperatura | 21.0 °C |
| Presión | 2900 PSI (1 bar = 14.5 psi) |

Nota de la ficha: *"Los datos se toman al momento del análisis; la presión puede variar según la temperatura ambiente."*

### Relación de envases aprobados

Lista de ~60 series de cilindros incluidos en el lote (p. ej. `J25642171`, `J25642043`, `21X635193`, `21K022182`, `K4864082`, …). En el sistema se guardan como filas de `bal_lote_protocolo_envase`, con match opcional contra `bal_balon.numero_serie`.

### Firmas / responsables

- Analista: Q.F. Ana María Ventura Ponce
- Jefe de Control de Calidad — C.Q.F.P. 20710
- Director Técnico — C.Q.F.P. 14616
- Conclusión: *"La muestra analizada cumple con las especificaciones arriba mencionadas."*

> El archivo de referencia `Downloads/protocolo-recarga-planta-2026-08-12.xlsx` es un export del listado actual de "Recargas en planta" del sistema (columnas: Orden, Estado, Fecha ida, Proveedor/planta, Almacén, GRE salida, GRE retorno, Factura, Fecha retorno, N° lote, Venc. lote, Código cilindro, Gas/producto, Capacidad, P.H.). Sirve como referencia del estado actual, no del objetivo.

---

## Anexo B — Convenciones para la implementación

- **Prefijos de tabla:** mantener el esquema de prefijos actual. Sugerencias de nuevos prefijos: `inv_` (inventario unificado), `doc_` (documentos de salida), `bal_lote_protocolo*` (fichas ICP).
- **Funciones PL/pgSQL:** reemplazar macro-funciones por funciones pequeñas y componibles con un único punto de escritura por dominio (`inv_registrar_movimiento`, `inv_revertir_por_documento`, …). Cada una con su prueba en `api-sistema-sarita/test/`.
- **Permisos:** por cada módulo nuevo, definir flags `modulo.accion` en el seed `*_permisos_banderas.sql` y en `src/shared/constants/permissions.ts`.
- **Frontend:** seguir la estructura por módulo existente (`components/`, `composables/`, `constants/`, `interfaces/`, `services/`, `utils/`, `views/`), Query keys jerárquicas, servicios como objetos.
- **Catálogos:** los tipos de movimiento, estados de ciclo, tipos de orden, estados de verificación, etc. van en `gen_lista` / `gen_lista_opciones` con IDs fijados en `src/shared/constants/lista-ids.ts`.
- **PDF:** generación en backend (módulo `facturacion-electronica` ya tiene utilidades); el frontend consume vía `apiGetBlob`.
- **Documentación:** actualizar `admin-sistema-sarita/DOCUMENTACION.md` y `api-sistema-sarita/docs/` al cierre de cada fase.
