export async function visualizarArchivo(
  cargar: () => Promise<Blob>,
  nombre: string,
  tipo: 'pdf' | 'xml',
): Promise<void> {
  const tab = window.open('', '_blank')
  if (!tab) throw new Error('El navegador bloqueó la pestaña. Permite las ventanas emergentes para visualizar el archivo.')
  tab.opener = null
  const doc = tab.document
  doc.title = nombre
  doc.documentElement.lang = 'es'
  const mensaje = doc.createElement('p')
  mensaje.textContent = 'Cargando documento…'
  doc.body.append(mensaje)
  let url: string | undefined
  try {
    const blob = await cargar()
    if (tab.closed) return
    if (!blob.size) throw new Error('El archivo recibido está vacío')
    const contenido = tipo === 'xml' ? await blob.text() : ''
    if (tipo === 'pdf' && await blob.slice(0, 5).text() !== '%PDF-') {
      throw new Error('La respuesta recibida no es un PDF válido')
    }
    if (tipo === 'xml' && !contenido.trimStart().startsWith('<')) {
      throw new Error('La respuesta recibida no es un XML válido')
    }
    if (tab.closed) return
    const archivo = new Blob([blob], { type: tipo === 'pdf' ? 'application/pdf' : 'application/xml;charset=utf-8' })
    url = URL.createObjectURL(archivo)
    doc.body.style.cssText = 'margin:0;background:#f3f4f6;color:#111827;font:14px system-ui'
    const barra = doc.createElement('header')
    barra.style.cssText = 'padding:16px;background:white;display:flex;gap:24px;align-items:center'
    const titulo = doc.createElement('strong')
    titulo.textContent = nombre
    const descargar = doc.createElement('a')
    descargar.href = url
    descargar.download = nombre
    descargar.textContent = `Descargar ${tipo.toUpperCase()}`
    barra.append(titulo, descargar)
    doc.body.replaceChildren(barra)
    if (tipo === 'xml') {
      const pre = doc.createElement('pre')
      pre.style.cssText = 'padding:20px;margin:0;white-space:pre-wrap;overflow-wrap:anywhere'
      pre.textContent = contenido
      doc.body.append(pre)
    } else {
      const frame = doc.createElement('iframe')
      frame.title = nombre
      frame.src = url
      frame.style.cssText = 'display:block;border:0;width:100%;height:calc(100vh - 60px)'
      doc.body.append(frame)
    }
    const recurso = url
    const limpiar = () => {
      URL.revokeObjectURL(recurso)
      window.clearInterval(timer)
      window.removeEventListener('pagehide', limpiar)
    }
    const timer = window.setInterval(() => { if (tab.closed) limpiar() }, 15000)
    window.addEventListener('pagehide', limpiar, { once: true })
  } catch (error) {
    if (url) URL.revokeObjectURL(url)
    // La pestaña se abrió antes de la carga solo para esquivar el bloqueo de
    // ventanas emergentes. Si la carga falló se cierra para devolver el foco a
    // la ventana del sistema: así el toast con el motivo (p. ej. los datos de
    // traslado que faltan) se ve de inmediato en lugar de quedarse tapado.
    if (!tab.closed) tab.close()
    throw error
  }
}
