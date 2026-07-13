export type ComprobantePdfFormato = 'a4' | 'ticket'

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')

  if (!win) {
    URL.revokeObjectURL(url)
    throw new Error('El navegador bloqueó la ventana de impresión')
  }

  const revoke = () => URL.revokeObjectURL(url)

  win.addEventListener('load', () => {
    win.focus()
    win.print()
  })

  // Fallback por si load no dispara con PDFs embebidos
  setTimeout(() => {
    try {
      win.focus()
      win.print()
    } catch {
      // ignore
    }
  }, 800)

  win.addEventListener('beforeunload', revoke)
}
