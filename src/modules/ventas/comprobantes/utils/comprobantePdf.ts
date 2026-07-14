export type ComprobantePdfFormato = 'a4' | 'ticket'

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/** Abre ventana vacía maximizada en el mismo clic (evita bloqueo Chrome tras await). */
export function openPdfPrintWindow(): Window | null {
  // No usar noopener: en Chrome window.open(..., 'noopener') devuelve null
  const width = window.screen.availWidth
  const height = window.screen.availHeight
  const win = window.open(
    '',
    '_blank',
    `left=0,top=0,width=${width},height=${height},scrollbars=yes,resizable=yes`,
  )

  if (!win) return null

  try {
    win.moveTo(0, 0)
    win.resizeTo(width, height)
  } catch {
    // Algunos navegadores bloquean moveTo/resizeTo
  }

  win.document.open()
  win.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" /><title>PDF</title></head>
<body style="font-family:sans-serif;padding:16px;font-size:14px;">
  Preparando documento para impresión...
</body></html>`)
  win.document.close()
  return win
}

export function printBlobInWindow(win: Window, blob: Blob) {
  const url = URL.createObjectURL(blob)
  win.location.href = url

  const triggerPrint = () => {
    try {
      win.focus()
      win.print()
    } catch {
      // ignore
    }
  }

  // PDFs embebidos: load no siempre es fiable
  setTimeout(triggerPrint, 800)

  win.addEventListener('beforeunload', () => URL.revokeObjectURL(url))
}

export function printBlob(blob: Blob) {
  const win = openPdfPrintWindow()

  if (!win) {
    throw new Error('El navegador bloqueó la ventana de impresión')
  }

  printBlobInWindow(win, blob)
}
