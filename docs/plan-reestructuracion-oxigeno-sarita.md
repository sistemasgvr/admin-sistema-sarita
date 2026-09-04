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
| `id_documento_origen` | int NULL | id de la **cabecera** del documento que lo originó |
| `id_tipo_documento_origen` | FK `gen_lista_opciones` NULL | VENTA, COMPRA, ORDEN_SALIDA, RECARGA_PLANTA, PRESTAMO, ALQUILER, RECOJO, ACTIVIDAD, AJUSTE_MANUAL… |
| `id_documento_detalle` | int NULL | id de la **línea** del documento. Junto con la cabecera forma la clave de idempotencia, de modo que dos líneas del mismo producto en un mismo documento generan dos movimientos distintos |
| `id_movimiento_padre` | FK `inv_movimiento` NULL | anti-duplicación: si otro proceso ya generó el movimiento, se referencia y no se crea uno nuevo |
| `stock_anterior` / `stock_nuevo` | numeric NULL | solo cuando aplica a stock de producto |
| `id_estado_balon_snapshot` | FK NULL | estado operativo **resultante** del balón (EN_ALMACEN, PRESTADO_CLIENTE, EN_PODER_CLIENTE, EN_RECARGA_EXTERNA, EN_MANTENIMIENTO…) — **no** contenido |
| `id_estado_balon_anterior` / `id_cliente_ubicacion_anterior` / `id_almacen_anterior` | FK NULL | custodia **previa** al movimiento, para que la reversa restaure el estado real y no fuerce `EN_ALMACEN` a ciegas |
| `glosa` | varchar | |
| auditoría | `estado`, `id_usuario_creacion`, `fecha_creacion`, … | |

Índices: `(id_tipo_documento_origen, id_documento_origen)`, `(id_tipo_documento_origen, id_documento_origen, id_documento_detalle)`, `(id_balon, fecha)`, `(id_producto, id_almacen_origen, fecha)`, `id_movimiento_padre`.

**Regla de claves:** todos los orquestadores registran con `id_documento_origen = <id de cabecera>` y, cuando el movimiento nace de una línea, `id_documento_detalle = <id de la línea>`. Los ajustes agregados por edición (que consolidan varias líneas en un delta por producto) van con `id_documento_detalle = NULL` y `p_forzar = TRUE`. `inv_revertir_por_documento` sin `p_id_documento_detalle` revierte el documento completo; con él, solo esa línea.

**Cambios en `bal_balon`:** eliminar del modelo de negocio `id_estado_contenido`, `capacidad_restante`, `capacidad_restante_lb`. `presion_actual` pasa a ser lectura opcional de control de calidad (o se mueve a `bal_balon_lectura`). Se conserva `id_estado_balon` (estado operativo del envase) e `id_producto_gas` (qué gas contiene ese balón por diseño).

**Stock de gas:** se usa `pro_stock` (por `id_almacen`, `id_producto`) tal cual. El producto-gas debe tener `es_gas = true` y `afecta_stock = true`.
- Recarga a cliente (Sarita → cliente): `inv_movimiento` SALIDA de `id_producto_gas` del almacén, cantidad = m³ recargados.
- Ingreso por recarga en planta externa (planta → Sarita): `inv_movimiento` ENTRADA de `id_producto_gas` según el gas asociado al balón.
- El "stock de gas" que hoy vive a nivel balón se elimina; la vista `bal_listar_stock_gas` se reimplementa sobre `pro_stock` + `inv_movimiento`.

#### API

- Nuevo módulo `inventario-movimientos` (unifica `movimientos-inventario` + `movimientos-balon`). Endpoints: listar (con filtros por naturaleza, documento origen, balón, producto, almacén, rango de fechas), obtener, crear ajuste manual, anular.
- **API interna de dominio** (funciones PL/pgSQL pequeñas y componibles, reemplazan al orquestador monolítico):
  - `inv_registrar_movimiento(...)` — punto único de escritura; idempotente por `(naturaleza, tipo_doc, id_doc, id_doc_detalle, tipo_mov, producto/balón)`, con `p_forzar` para los casos agregados. Devuelve `creado: true|false`; **el llamador debe verificar ese flag** además de `error`.
  - `inv_revertir_por_documento(tipo_doc, id_doc, usuario, [id_doc_detalle])` — revierte los movimientos de un documento (o de una sola línea) en orden **LIFO**, restaurando la custodia previa del balón.
  - `inv_repuntar_documento(...)` — reasigna los movimientos de un documento a otro (VSD→CPE hoy; venta→orden de salida en F2) sin volver a mover stock.
  - `inv_signo_tipo_movimiento(id_tipo_movimiento)` — **fuente única** del sentido (−1 salida / +1 entrada / 0 traslado / NULL ajuste-o-desconocido). Ninguna función debe volver a inferir el sentido con `ILIKE '%SALIDA%'`; un tipo sin signo configurado es un error explícito, no una entrada silenciosa.
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

#### Estado — ✅ COMPLETADA (2026-09-02)

Verificado contra la base DEV: `inv_movimiento` con las 4 columnas de cierre, `bal_balon` sin columnas de contenido, `pro_movimientos` y `bal_movimiento` eliminadas junto con sus funciones legadas, gases con `afecta_stock = true`, y 28 orquestadores llamando a `inv_registrar_movimiento`.

Decisiones tomadas durante la implementación que **no** estaban en el diseño original:

| Decisión | Motivo |
|---|---|
| `id_documento_detalle` en `inv_movimiento` | Sin ella, la idempotencia por cabecera colapsaba dos líneas del mismo producto en un solo movimiento y el stock quedaba sobrestimado. |
| Snapshots `id_estado_balon_anterior` / `id_cliente_ubicacion_anterior` / `id_almacen_anterior` | La reversa forzaba `EN_ALMACEN` a ciegas y sacaba de casa del cliente balones que seguían prestados por otro documento vigente. |
| `inv_signo_tipo_movimiento` | El sentido se infería del nombre del catálogo; un tipo nuevo o mal nombrado se trataba como entrada en silencio. |
| Reversa en orden `id DESC` (LIFO) | Con dos movimientos del mismo balón en un documento, revertir en orden ascendente dejaba la custodia en un estado intermedio. |
| Guard sobre el flag `creado` en `ven_crear_comprobante` | Convierte una supresión inesperada por idempotencia en un error visible en lugar de un descuadre silencioso de stock. |
| `scripts/rebuild-schema-from-repo.js` | Las migraciones históricas no son reejecutables en cadena (`fundamento` define funciones que `faseB` invalida). El esquema vivo es `tablas/ + funciones/ + seeds/`; este script lo reconstruye (`--full --wipe`) o refresca funciones en DEV (`--functions`). |

Pendientes menores heredados (no bloquean F2):

- `balones/stock-gas` (constants/interfaces/service) y el endpoint `GET /balones/stock-gas` sobreviven como *fallback* del POS. Ya leen `pro_stock`, así que no hay doble fuente de datos, pero son ruta redundante: eliminarlos cuando se toque el POS en F4.
- Los archivos SQL editados a mano conservan el header `Generated:` de la sincronización anterior. Re-ejecutar `sync-functions-from-dev.js` / `sync-tables-from-dev.js` para que la procedencia vuelva a ser honesta.
- ~~Capacidad por cilindro — lógica vestigial.~~ **Cerrado el 2026-09-03** con las decisiones 3 y 16 (ver abajo).

---

### Validación funcional de F1 — ✅ CERRADA (2026-09-03)

La auditoría estructural daba todo en verde, pero `inv_movimiento` estaba **vacío**: cero movimientos. F1 nunca se había ejercitado. Los 17 saldos de `pro_stock` (35 m³ de O₂, 12 kg de acetileno, accesorios) existían sin respaldo en el kardex, incumpliendo el criterio *"el saldo cuadra con la suma de `inv_movimiento`"*.

**Lo que se cerró:**

| Punto | Acción |
|---|---|
| Puerta trasera de stock | `pro_crear_stock` insertaba la cantidad inicial directo en `pro_stock`, saltándose el punto único de escritura (y estaba expuesta en `POST /productos/stock`). Ahora la fila nace en 0 y la cantidad se aplica como `AJUSTE` vía `inv_registrar_movimiento`. Coherente con `pro_actualizar_stock`, que ya bloqueaba cambiar la cantidad, y con el propio texto de la UI: *"La cantidad solo cambia con movimientos"*. |
| Saldos sin kardex | `20260903_carga_inicial_kardex.sql` regulariza las 17 filas: pone cada una en el saldo ya respaldado y aplica la diferencia como `AJUSTE`. **No inserta movimientos a mano.** Saldo final idéntico, ahora trazable. Idempotente. |

**Bugs que solo aparecieron al ejercitar los flujos con registros reales:**

1. **[CRÍTICO] Toda la naturaleza BALON estaba rota en ejecución.** 13 llamadas en 12 funciones pasaban `p_fecha => NOW()` (que devuelve `timestamptz`) a un parámetro `timestamp without time zone`. Con notación de parámetros nombrados PostgreSQL no resuelve la sobrecarga y falla con `42883: function ... does not exist`. Afectaba alquileres, préstamos, recojos, recargas de mostrador, recarga en planta y guías de remisión — es decir, **ningún movimiento de balón podía registrarse**, lo que explicaba el kardex vacío. Corregido usando `LOCALTIMESTAMP` (las funciones ya fijan `America/Lima`).

2. **[ALTO] Doble descuento de gas en la recarga de mostrador** — literalmente el apunte 1.c.iv.6 (*"que no se duplique el movimiento"*). Una recarga de 10 m³ descontaba **11**: la línea de venta restaba su cantidad comercial (1) y el movimiento del balón restaba la capacidad real (10). Corregido con una marca explícita por línea `no_mueve_kardex` en `p_detalles`, propagada por número de ítem (el bucle de stock lee las filas ya insertadas, no el JSON de entrada). Sin coincidencias de texto.

**Flujos ejercitados por HTTP contra la API real, con reversa:**

```
Compra de accesorio      -> stock 12 → 17, 1 movimiento INGRESO con id_documento_detalle  ✅
Eliminar compra          -> stock 17 → 12, reversa exacta                                  ✅
Recarga de mostrador     -> gas 35 → 25 (exactamente la capacidad), balón EN_ALMACEN
                            → EN_PODER_CLIENTE, movimiento RECARGA_CLIENTE/BALON           ✅
Reversa de la recarga    -> gas vuelve a 35, balón vuelve a EN_ALMACEN                     ✅
Reconciliación           -> 0 descuadres en todo momento                                   ✅
```

Los rechazos por *"no hay caja abierta"* y *"los préstamos a cliente deben nacer de una venta"* son validaciones de negocio funcionando, no fallos.

**Queda abierto para F4** (no bloquea F2):

- El mismo doble descuento existe en la ruta del POS: `bal_vincular_recarga_cliente_comprobante` registra el movimiento del balón con la capacidad sobre un comprobante cuya línea de gas ya movió stock. El arreglo es marcar esa línea con `no_mueve_kardex` desde el POS, que es donde se decide la cantidad (apunte 1.c.v).
- Solo 2 de 28 llamadores validan el flag `creado` de `inv_registrar_movimiento`. Hoy el riesgo es bajo porque las claves con `id_documento_detalle` o `id_balon` evitan colisiones, pero una supresión inesperada pasaría en silencio.
- `com_revertir_cilindros_recarga_compra` repunta `inv_movimiento` con un `UPDATE` propio en vez de `inv_repuntar_documento`, y no actualiza `id_documento_detalle`, dejando una referencia cruzada obsoleta.

---

### Cierre de decisiones 3 y 16 — ✅ IMPLEMENTADO (2026-09-03)

#### Unidad canónica del stock de gas (decisión 3)

**Manda la unidad configurada en el producto** (`pro_producto.id_unidad_medida`). `pro_stock` siempre está expresado en ella.

El problema real: la cantidad que llegaba a `pro_stock` salía de `bal_tipo_balon.capacidad`, en la unidad **del tipo de balón**, sin convertir. En el catálogo actual hay 8 tipos desalineados — los 4 de Acetileno y los 4 de Dióxido de Carbono, catalogados en MT3 mientras su gas se vende en KG. Recargar un "CO₂ 10m³" restaba `10` de un saldo en kilos.

Solución: **convertir en el borde, sin reescribir el catálogo.** Es legítimo que un cilindro esté rateado en m³ aunque el gas se venda por kilo, así que no se tocaron las capacidades de los tipos.

| Pieza | Rol |
|---|---|
| `inv_convertir_a_unidad_producto(id_producto, cantidad, id_unidad_origen)` | Conversión con m³ como pivote. Los factores de `pro_producto` son **m³ por unidad-origen**: se multiplica hacia m³ y se divide desde m³ (dirección verificada contra `bal_factor_lb_m3`). Si falta el factor o la unidad no es convertible **lanza excepción**: nunca se descuenta stock con la unidad equivocada. |
| `bal_capacidad_balon_en_unidad_gas(id_balon)` | Capacidad nominal del tipo del balón, ya expresada en la unidad de su gas. |

Aplicado en los cuatro puntos donde la capacidad de un cilindro entra al stock: `bal_crear_recarga_cliente`, `bal_vincular_recarga_cliente_comprobante`, `bal_crear_movimiento_recarga` y `bal_finalizar_recarga_planta` (este último convierte desde la unidad del propio `bal_recarga_planta_detalle`). `bal_asignar_origenes_recarga` dejó de asumir "m³" en su mensaje de stock insuficiente y usa la unidad real del producto.

Verificado en DEV: CO₂ 10 m³ → **19.7628 kg** (densidad 1.976 kg/m³ ✓), Oxígeno 10 kg → 7 m³.

> ⚠️ **Revisar con operaciones:** `Acetileno.factor_kg_m3 = 1.000000` es sospechosamente redondo — la densidad del acetileno es ~1.09 kg/m³. La conversión es tan buena como el factor configurado; si ese 1.0 es un valor por defecto y no una decisión comercial, corregirlo.

#### Escenarios de edición del catálogo

La unidad de medida y los factores **se pueden editar**, y eso rompía el stock de tres formas. Todas cerradas:

| Escenario | Qué pasaba | Qué pasa ahora |
|---|---|---|
| Editar cualquier campo de un gas | `pro_crear_producto` y `pro_actualizar_producto` forzaban `afecta_stock = FALSE` cuando `es_gas = TRUE` — lógica pre-Fase 1, de cuando el gas se controlaba por cilindro. Bastaba renombrar un gas para que `inv_registrar_movimiento` dejara de mover `pro_stock` **en silencio**. | Solo los servicios quedan sin stock; un gas siempre es `afecta_stock = TRUE`. Migración de reparación incluida. |
| Cambiar la unidad del producto | `pro_stock` no guarda unidad propia: su saldo se lee en la unidad **actual** del producto. Cambiar Acetileno de KG a MT3 hacía que 12 kg pasaran a leerse como 12 m³, sin aviso. | Se **rechaza** si hay stock o movimientos, con un mensaje que dice cuánto stock hay y en qué unidad. Con `p_convertir_stock = TRUE` (bandera que la UI expone como confirmación explícita) el saldo se convierte mediante un **movimiento de `AJUSTE`**, de modo que `inv_registrar_movimiento` sigue siendo el único punto de escritura de `pro_stock` y la conversión queda visible en el kardex. |
| Quitar un factor de conversión | Un gas con tipos de balón en otra unidad se quedaba sin factor y las recargas empezaban a fallar después, lejos de la causa. | Al guardar el producto se revalida la conversión de cada tipo de balón desalineado reutilizando `inv_convertir_a_unidad_producto`; si no es posible, se rechaza el guardado. |

Probado contra DEV con un producto desechable: crear gas → `afecta_stock=true`; cambiar unidad sin confirmar → bloqueado y saldo intacto; con confirmación → 10 MT3 pasan a 14.2857 KG con un `AJUSTE` de 4.2857 en el kardex; renombrar el gas → `afecta_stock` sigue activo.

**UI de confirmación.** El formulario de producto detecta el rechazo y abre un `AppConfirmDialog` que dice cuántos almacenes y cuánto saldo se van a convertir, de qué unidad a cuál, y que quedará como ajuste en el kardex. Al confirmar, reenvía con `convertirStock: true`. Para que el diálogo pueda construirse, la API gana un canal genérico de **errores accionables**: una excepción lanzada como `new BadRequestException({ message, detalle: {...} })` propaga ese `detalle` por el filtro global hasta `ApiError.detalle` en el cliente. Sirve para cualquier caso futuro en que el backend deba ofrecer una salida en vez de solo un mensaje.

Verificado end-to-end por HTTP contra la API real: `PATCH /productos/:id` con cambio de unidad devuelve **400** con `detalle.requiereConfirmacion`, y el reintento con `convertirStock: true` devuelve **200** dejando el saldo en 14.2857 KG y un movimiento de ajuste.

> **Dos bugs colaterales corregidos:**
>
> 1. El patrón `TO_CHAR(x, 'FM999999990.####')`, usado en 3 funciones, es inválido en PostgreSQL (`#` no es carácter de formato numérico) y **descartaba todos los decimales**: `14.2857` se mostraba como `14`. Los mensajes de stock insuficiente y de conversión mentían. Reemplazado por `gen_formato_cantidad(numeric)`.
> 2. **`nest build` llevaba tiempo dejando `dist/` obsoleto en silencio.** `playwright.config.ts`, al vivir en la raíz y no estar excluido del build, desplazaba la raíz común inferida por TypeScript, de modo que la compilación emitía en `dist/src/...` mientras `start:prod` ejecuta `node dist/main` — el build de julio. Encima, el modo `incremental` hacía que tsc terminara con código 0 escribiendo solo el `.tsbuildinfo`, sin emitir un solo `.js`. Corregido en `tsconfig.build.json` con `rootDir: "./src"`, la exclusión de `playwright.config.ts` e `incremental: false` solo para el build de producción. **Conviene revisar qué se desplegó desde ese `dist/`.**

Migración: `database_sql/migraciones/20260903_gas_afecta_stock_y_cambio_unidad.sql`.

#### Balón origen (decisión 16)

**Solo trazabilidad.** Se sigue registrando de qué cilindro se trasvasó, pero la cantidad se descuenta del stock global del almacén; no existe saldo por cilindro.

- Eliminadas `bal_capacidad_disponible_balon`, `bal_consumir_capacidad_balon_origen` y `bal_consumir_capacidad_origenes_recarga` (no persistían nada tras la Fase 1 y ningún flujo vivo las llamaba).
- Quitados los filtros `WHERE bal_capacidad_disponible_balon(b.id) > 0` de `bal_listar_balones_origen_recarga` y `bal_sugerir_balon_origen_recarga`, que al devolver capacidad nominal eran siempre verdaderos.
- El frontend ya no muestra `disp. N` en el selector de origen: era la capacidad nominal del tipo, así que un cilindro vacío se mostraba lleno.
- La validación de disponibilidad la hace **solo** `bal_asignar_origenes_recarga` contra `inv_stock_producto` (`pro_stock`), que es lo correcto.

> Esta decisión **conserva** el vínculo balón-origen ↔ recarga, que es lo que F5 necesita para rastrear de qué lote/protocolo salió cada recarga de oxígeno medicinal.

Migración: `database_sql/migraciones/20260903_f4_unidad_canonica_y_balon_origen.sql` (solo DDL; los cuerpos de función viven en `funciones/` y se aplican con `rebuild-schema-from-repo.js --functions`).

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
- `ORDEN_SALIDA_VENTA` con `id_venta`: al pasar a `GENERADA` se puede "convertir" a GRE (llenar bloque GRE) y luego `EMITIDA_SUNAT` (apunte 1.c.iv.1). El movimiento de inventario ya existe (lo creó la venta) → se enlaza vía `inv_movimiento.id_movimiento_padre`, **no se recrea** (apunte 1.c.iv.6). Si en cambio la orden *sustituye* a la venta como documento origen, se usa `inv_repuntar_documento` (ya implementado en F1 para VSD→CPE). Ojo: los movimientos de venta vienen con `id_documento_detalle` poblado, así que el repunte debe conservar esa columna para no perder la trazabilidad por línea.
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

#### Estado — ✅ COMPLETADA (2026-09-03)

La capa de BD (`doc_salida`/`doc_salida_detalle`/`doc_salida_referencia`/`doc_rango_numeracion`, catálogos `TipoOrdenSalida`/`EstadoCicloSalida`, y `doc_crear_salida`/`doc_crear_salida_detalle`/`doc_generar_salida`/`doc_convertir_a_gre`/`doc_crear_desde_venta`/`doc_anular_salida`/`doc_listar_salidas`/`doc_obtener_salida`/`doc_obtener_siguiente_numero`/`doc_registrar_respuesta_sunat`, más la migración de `gre_guia_remision`/`bal_recarga_planta` en ~20 funciones dependientes) ya estaba aplicada en vivo contra DEV al iniciar este cierre — sin rastro en los archivos versionados del repo. Se sincronizó a `database_sql/tablas/documentos-salida/` y `database_sql/funciones/documentos-salida/` (`sync-tables-from-dev.js`/`sync-functions-from-dev.js`), se cerraron dos huecos reales (`doc_eliminar_salida_detalle`, y `lote`/`fecha_vencimiento_lote`/`fecha_prueba_hidrostatica` en `bal_finalizar_recarga_planta`), y se construyó encima el módulo NestJS `documentos-salida` (reemplaza `guias-remision` + `recargas-planta`, cuyas funciones SQL ya no existían — ambos módulos estaban rotos en DEV) y el módulo frontend `documentos-salida` (lista + formulario únicos, reemplaza `ventas/guias-remision` y la parte de recarga-planta de `balones/recargas`).

Verificado: ciclo BORRADOR→GENERADA→ANULADA de punta a punta contra DEV (crear, agregar/quitar línea, generar movimiento, anular con reversa), `bal_finalizar_recarga_planta` con lote/P.H./compra, backend (`tsc --noEmit`) y frontend (`vue-tsc -b`) compilan limpio, rutas registradas y guardas de permiso responden 401 sin token (sin errores 500).

Pendiente como seguimiento (no bloquea el cierre de F2):
- El formulario "Convertir a guía de remisión" usa IDs numéricos para distrito/transportista/chofer/vehículo en vez de buscadores dedicados (la GRE clásica los tenía) — falta portar esos selectores.
- `doc_listar_salidas` no filtra por `id_proveedor`; el selector de orden de recarga en `CompraForm.vue` ya no filtra server-side por proveedor seleccionado.
- No se pudo probar el flujo completo por HTTP con un usuario autenticado real (sin credenciales de prueba disponibles) — se verificó en su lugar contra la BD directamente (mismas llamadas que hace el modelo NestJS) y que el pipeline HTTP responde sin errores 500.

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

#### Estado — ✅ COMPLETADA (2026-09-03)

Decisiones 6 y 7 del §5 confirmadas antes de empezar: **cuenta ↔ medio de pago es N:M**, las cuentas de la empresa se **comparten entre sucursales**, y el historial lleva **todas las pestañas de caja**.

**Lo implementado**

| Capa | Cambio |
|---|---|
| BD | `gen_cuenta_bancaria` gana `ambito` (`CLIENTE`/`EMPRESA`), `alias` e `id_empresa`, con CHECK de coherencia (una cuenta de cliente exige cliente; una de empresa no puede tenerlo). Nuevas `gen_cuenta_medio_pago` (puente N:M), `fin_medio_pago_config` y `ven_comprobante_pago`. `id_cuenta_bancaria` añadida a `fin_caja_gasto`, `fin_garantia`, `ven_garantia` y `ven_garantia_movimiento`, más `id_cuenta_bancaria_reembolso` donde hay devolución. |
| BD — funciones | `fin_medio_pago_flag` + `fin_validar_cuenta_medio_pago` (punto único de la regla medio↔cuenta), `gen_sincronizar_medios_cuenta`, `ven_pagos_de_comprobante`, `ven_sincronizar_pagos_comprobante`, `fin_notificar_caja_admins`, `fin_garantia_registro`. Reescritas `fin_caja_calcular_totales` y `fin_obtener_libro_diario`. |
| API | `ambito`/`alias`/`mediosPago` en cuentas bancarias (+ filtros `ambito` e `idMedioPago`); `idCuentaBancaria` en gastos de caja, garantías y pagos; `pagos[]` en comprobantes y en la recarga a cliente. `GET /finanzas/medios-pago` pasa a servir la configuración de cada medio y sus cuentas. |
| Frontend | `MedioPagoCuentaField` (medio + cuenta + nº operación, con las reglas leídas del backend) reutilizado en gasto de caja, garantía, reembolso, pago de CxC/CxP y POS. Cuentas de empresa con alias y medios asociados. `HistorialCajaModal` con pestañas y exportación, abierto desde el menú Caja. |

**Decisiones tomadas durante la implementación que no estaban en el diseño original:**

| Decisión | Motivo |
|---|---|
| `fin_medio_pago_config` en vez de dejar la clasificación en las funciones | `fin_caja_calcular_totales` repetía `UPPER(mp.nombre) IN ('EFECTIVO','YAPE','PLIN')` en cinco bloques. Un medio nuevo en el catálogo quedaba fuera del arqueo **en silencio**. Mismo criterio que `inv_signo_tipo_movimiento` en F1: un medio sin configurar es un error explícito. |
| Los resúmenes son datos derivados, no la tabla `fin_caja_resumen` del diseño | Una tabla obligaría a mantenerla sincronizada con cada venta, gasto y depósito. Se implementaron como el array `resumenes` de `fin_obtener_libro_diario`, donde cada entrada declara de qué colección del payload salen sus filas y con qué filtro. Añadir un resumen no obliga a tocar el Vue. |
| `ven_pagos_de_comprobante` con *fallback* a la cabecera | Sin él, cada consumidor (totales, libro diario, resúmenes) tendría que escribir dos consultas: una para ventas con desglose y otra para las anteriores a F3. |
| `monto` opcional cuando hay un solo pago | Los cinco paneles del POS arman su propio payload y ninguno conoce el total ya calculado por el orquestador. Con el monto omitido, cada panel manda medio y cuenta y el backend completa el importe. |
| `alias` en la cuenta | El titular es la razón social completa; en un selector de cobro necesitas «BCP Principal», no «Haydeé Ruiz de los Santos». |
| El nº de operación no bloquea el cobro en el POS | En el mostrador la venta se genera **antes** de que el cliente pague, así que a menudo no existe todavía un voucher que teclear; frenar la venta por eso la haría imposible. `requiere_numero_operacion` sigue decidiendo si el campo **se muestra**, pero solo es obligatorio en los formularios de back-office (gasto de caja, garantía, reembolso, pago de CxC/CxP), donde el pago ya ocurrió. La cuenta bancaria sí es innegociable en todos: sin ella el dinero no se concilia con el banco. El voucher se registra después desde el detalle del comprobante (`PATCH /comprobantes/:id/cobro`). |
| `ven_registrar_cobro_comprobante` en vez de reusar `ven_actualizar_comprobante` | Completar el voucher no debe re-ejecutar el orquestador de la venta (detalle, stock, cuentas por cobrar). La función nueva solo toca datos de referencia y la cuenta bancaria, y **rechaza** cambiar medio de pago o importe: eso movería los totales de una caja que puede estar ya cerrada y arqueada. Para corregir medio o importe hay que editar la venta. |
| Guard de borrado en `gen_eliminar_cuenta_bancaria` | Dar de baja una cuenta con cobros registrados dejaba pagos, depósitos y gastos apuntando a una cuenta inactiva. |
| Ninguna bandera de permiso nueva | `caja.resumen` y `cuentas_bancarias.empresa` llegaron a crearse y se retiraron: el historial es el mismo libro diario (ya cubierto por `caja.libro_diario`) y las cuentas de empresa usan los mismos endpoints que las de cliente. Una bandera que no gobierna nada solo estorba al mantener roles. |

**Bugs preexistentes que aparecieron al implementar (todos corregidos):**

1. **[ALTO] `auth_listar_ids_usuarios_admin_con_permiso` fallaba en toda llamada.** Estaba declarada `STABLE` y ejecutaba `SET TIME ZONE`, cosa que PostgreSQL rechaza en ejecución (*"SET is not allowed in a non-volatile function"*). La usa `notificaciones.model.ts`, así que **ninguna notificación dirigida a administradores por permiso podía enviarse**. Se quitó el `SET` (no había ningún valor dependiente de zona horaria).
2. **[MEDIO] `GET /caja/gastos/:id` y `PATCH /caja/gastos/:id` estaban rotos.** `caja.model.ts` llamaba a `fin_obtener_caja_gasto` y `fin_actualizar_caja_gasto`, que no existían ni en el repo ni en DEV. Creadas, con la edición restringida a caja abierta.
3. **[MEDIO] El arqueo restaba gastos que no salen del cajón.** `cajaEsperada` y `fin_cerrar_caja_sesion` restaban `gastosCaja` completo, así que un gasto pagado por transferencia generaba una diferencia de arqueo inexistente. Ahora se resta `gastosCajaMediosCaja`.
4. **[BAJO] Los listados del libro diario no filtraban por sucursal** aunque sus totales sí. Al poner el contador junto al total en cada pestaña, la incoherencia quedó a la vista (3 cobranzas bajo un total de 0). Corregido en cobranzas, gastos y depósitos.

**Verificado contra DEV** (script end-to-end, todo dentro de una transacción con `ROLLBACK`, tres corridas consecutivas sin fallos):

```
Cuenta de empresa con Yape + Transferencia   -> creada con sus 2 medios              ✅
Efectivo sin cuenta                          -> aceptado                             ✅
Transferencia sin cuenta                     -> rechazada con mensaje accionable     ✅
PLIN sobre cuenta que no lo acepta           -> rechazado                            ✅
Venta cobrada 50 % efectivo / 50 % transf.   -> 2 líneas, suman el total exacto       ✅
La misma venta en el historial               -> aparece en EFECTIVO y en OTROS,
                                                la línea no-efectivo lleva su cuenta ✅
9 pestañas                                   -> cada una entrega tantas filas
                                                como declara en `cantidad`           ✅
Gasto de caja por Yape                       -> rechazado sin cuenta, creado con ella ✅
Cierre de caja                               -> 3 notificaciones a los ADMIN
                                                (excluyendo a quien la cerró)        ✅
Eliminar cuenta con movimientos              -> bloqueada                            ✅
```

Backend (`tsc --noEmit`) y frontend (`vue-tsc -b`) compilan limpio; la API arranca sin errores y los endpoints nuevos responden 401 sin token (ningún 500). `verify-functions-coverage` y `verify-tables-coverage`: 0 diferencias entre repo y DEV.

Migración: `database_sql/migraciones/20260904_f3_caja_medios_pago_cuentas.sql` (solo DDL + catálogos). Semilla: `seeds/fin_medio_pago_config.sql`.

**Pendiente como seguimiento (no bloquea F4):**

- **El POS cobra con un solo medio.** El campo ya envía medio + cuenta + nº de operación como línea de `ven_comprobante_pago`, y el backend soporta el reparto entre varios medios, pero la UI de dividir un cobro (efectivo + Yape en la misma venta) no está: hay que decidir dónde vive ese control en la pantalla de venta.
- **`pg_dump` no está instalado en el equipo**, así que `sync-tables-from-dev.js` no pudo correr y los cinco archivos de `tablas/` tocados se escribieron a mano. Coinciden columna por columna con DEV (verificado por consulta), pero conviene reejecutar el sync donde haya `pg_dump` para que la procedencia vuelva a ser automática.
- **La familia `fin_garantia` está muerta.** Ningún módulo NestJS la llama (todo pasa por `ven_garantia`) y tiene 1 fila en DEV. Se actualizó por coherencia, pero es candidata a eliminarse en F8.
- **`ven_garantia_movimiento` no tiene reversa de cuenta al anular una garantía**: se hereda el comportamiento previo, que no se tocó en esta fase.

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
2. ~~**(F1) `bal_balon.presion_actual`.**~~ **RESUELTO:** se conserva como última lectura de control de calidad, sin valor de saldo. Se eliminaron `id_estado_contenido`, `capacidad_restante` y `capacidad_restante_lb`.
3. ~~**(F1) Unidad del stock de gas.**~~ **RESUELTO E IMPLEMENTADO (2026-09-03): manda la unidad del producto** (`pro_producto.id_unidad_medida`). Ver "Unidad canónica del stock de gas" más abajo.
4. **(F2) Numeración.** ¿La "orden de salida" tiene correlativo propio por sucursal/almacén? ¿Series de GRE por punto de emisión?
5. **(F2) "Solicitar Foto"** (apunte 1.c.iv.7): el PDF menciona guiarse de un ejemplo llamado "Solicitar Foto". ¿Qué es ese ejemplo? ¿Un formato de PDF existente a replicar?
6. ~~**(F3) Cuentas bancarias de la empresa.**~~ **RESUELTO E IMPLEMENTADO (2026-09-03): relación N:M** (tabla `gen_cuenta_medio_pago`) y cuentas **compartidas entre sucursales** — la sucursal ya queda registrada en el movimiento que usa la cuenta.
7. ~~**(F3) Resúmenes de caja.**~~ **RESUELTO E IMPLEMENTADO (2026-09-03): todas las pestañas de caja** — Ventas en efectivo, Ventas otros medios, Ventas a crédito, Cobranzas, Garantías cobradas, Garantías devueltas, Gastos, Depósitos a banco y Observaciones. Las define el backend en `fin_obtener_libro_diario`, así que añadir una no obliga a tocar el frontend.
8. **(F4) Escenario 1.c.ix sin stock.** La "extensión del préstamo anterior": ¿se mantiene el **mismo** número de préstamo con un detalle nuevo, o es un préstamo nuevo con `id_prestamo_origen`? Propuesta: préstamo nuevo encadenado.
9. **(F4) Balón de garantía del cliente (1.c.viii).** ¿Se da de alta en `bal_balon` con propiedad del cliente, o en una tabla aparte de "balones en custodia"? Propuesta: `bal_balon` con `origen_registro = GARANTIA_CLIENTE`.
10. **(F5) Ingreso manual vs. parser.** La ficha ICP llega en PDF. ¿Basta con adjuntar el PDF y teclear los campos clave, o se quiere OCR/parsing automático? Propuesta: adjuntar + teclear en esta fase.
11. **(F5) Datos que "se actualizan en cada recarga".** ¿Todos los campos de la ficha, o solo lote, vencimiento y valoración? El resto (norma, método, presentación) suele ser constante por proveedor.
12. **(F6) Auto-recojo (8.b.i.5).** ¿Cuántos días antes del vencimiento se crea la actividad? ¿A quién se asigna por defecto?
13. **(F6) ¿`operativa/actividades` absorbe `balones/recojos`,** o siguen como módulos separados enlazados? El PDF los pone juntos bajo "Sueltos > Actividades".
14. **(F8) Apunte 8.d ("…").** Queda un ítem abierto en el PDF. ¿Qué debe ir ahí?
15. **(Orden de fases)** Propuesta: F1 → F2 → (F3 ∥ F4) → F7 → F5 → F6 → F8. ¿Se ajusta a tus prioridades de negocio? *(F1, F2 y F3 cerradas; el siguiente por esta propuesta es F4.)*
16. ~~**(F4) ¿Qué significa "balón origen" ahora que el stock de gas es global?**~~ **RESUELTO E IMPLEMENTADO (2026-09-03): solo trazabilidad.** Ver "Balón origen" más abajo.

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
