import type { Comprobante } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import type { Empresa } from '@/modules/configuracion/empresas/interfaces/empresa.interface'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function money(value: number) {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function buildTicketHtml(comprobante: Comprobante, empresa: Empresa | null) {
  const razon =
    empresa?.nombre_comercial?.trim() ||
    empresa?.razon_social?.trim() ||
    'OXÍGENO SARITA'
  const ruc = empresa?.ruc ?? '—'
  const direccion = empresa?.direccion?.trim() || '—'
  const telefono = empresa?.telefono?.trim()
  const tipo = comprobante.nombre_tipo_comprobante ?? 'COMPROBANTE'
  const codigoTipo = comprobante.codigo_tipo_comprobante ?? ''
  const hash = comprobante.hash_documento?.trim() || ''

  const lineas = (comprobante.detalles ?? [])
    .map((detalle) => {
      const nombre = escapeHtml(
        String(detalle.descripcion || detalle.nombre_producto || detalle.id_producto),
      )
      const cant = Number(detalle.cantidad ?? 0)
      const pu = money(Number(detalle.precio_unitario ?? 0))
      const imp = money(Number(detalle.importe ?? 0))
      return `
        <div class="item">
          <div class="item-name">${nombre}</div>
          <div class="item-row">
            <span>${cant} x ${pu}</span>
            <span>${imp}</span>
          </div>
        </div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(`${comprobante.serie}-${comprobante.numero}`)}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: "Courier New", Courier, monospace;
      font-size: 12px;
      color: #111;
    }
    .ticket {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 8px 10px 16px;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .muted { color: #444; }
    .sep { border-top: 1px dashed #111; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    .item { margin-bottom: 6px; }
    .item-name { font-weight: 700; word-break: break-word; }
    .item-row { display: flex; justify-content: space-between; gap: 8px; }
    .totals .row { margin: 2px 0; }
    .hash {
      margin-top: 8px;
      font-size: 10px;
      word-break: break-all;
      text-align: center;
    }
    @media print {
      html, body { width: 80mm; }
      .ticket { width: 80mm; max-width: 80mm; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="center bold">${escapeHtml(razon)}</div>
    <div class="center muted">RUC ${escapeHtml(ruc)}</div>
    <div class="center muted">${escapeHtml(direccion)}</div>
    ${telefono ? `<div class="center muted">Tel: ${escapeHtml(telefono)}</div>` : ''}
    <div class="sep"></div>
    <div class="center bold">${escapeHtml(tipo)}${codigoTipo ? ` (${escapeHtml(codigoTipo)})` : ''}</div>
    <div class="center bold">${escapeHtml(`${comprobante.serie}-${comprobante.numero}`)}</div>
    <div class="center muted">Fecha: ${escapeHtml(String(comprobante.fecha))}</div>
    <div class="sep"></div>
    <div><span class="bold">Cliente:</span> ${escapeHtml(comprobante.nombre_cliente ?? '—')}</div>
    <div><span class="bold">Doc:</span> ${escapeHtml(comprobante.documento_cliente ?? '—')}</div>
    <div class="sep"></div>
    ${lineas}
    <div class="sep"></div>
    <div class="totals">
      <div class="row"><span>Valor venta</span><span>S/ ${money(Number(comprobante.valor_venta ?? 0))}</span></div>
      <div class="row"><span>IGV</span><span>S/ ${money(Number(comprobante.igv ?? 0))}</span></div>
      <div class="row bold"><span>TOTAL</span><span>S/ ${money(Number(comprobante.total_importe ?? 0))}</span></div>
    </div>
    ${hash ? `<div class="sep"></div><div class="hash">Hash: ${escapeHtml(hash)}</div>` : ''}
    <div class="sep"></div>
    <div class="center muted">Representación impresa del CPE</div>
    <div class="center muted">Consulte en SUNAT</div>
  </div>
</body>
</html>`
}

export function openTicketPrintWindow(): Window | null {
  // No usar noopener: en Chrome window.open(..., 'noopener') devuelve null
  // aunque sí abra una ventana about:blank.
  const win = window.open('', '_blank', 'width=420,height=720')

  if (!win) return null

  win.document.open()
  win.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" /><title>Ticket</title></head>
<body style="font-family:sans-serif;padding:16px;font-size:14px;">
  Preparando ticket para impresión...
</body></html>`)
  win.document.close()
  return win
}

export function writeAndPrintTicket(win: Window, html: string) {
  win.document.open()
  win.document.write(html)
  win.document.close()

  const triggerPrint = () => {
    try {
      win.focus()
      win.print()
    } catch {
      // ignore
    }
  }

  // document.write no dispara load de forma fiable; imprimir tras un tick
  setTimeout(triggerPrint, 250)
}

export function printTicketHtml(html: string) {
  const win = openTicketPrintWindow()

  if (!win) {
    throw new Error(
      'El navegador bloqueó la ventana de impresión. En el candado de la URL, permite ventanas emergentes.',
    )
  }

  writeAndPrintTicket(win, html)
}

export function downloadTicketHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.html') ? filename : `${filename}.html`
  anchor.click()
  URL.revokeObjectURL(url)
}
