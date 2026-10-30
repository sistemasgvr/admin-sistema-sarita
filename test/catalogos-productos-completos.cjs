// Vite local en E2E_BASE_URL (por defecto http://127.0.0.1:5188).
// API simulada: 615 productos y stocks, argón en la última página. No escribe datos reales.
const { chromium, expect } = require('@playwright/test')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5188'
  const user = { id: 42, nombre: 'Prueba', estado: true, roles: [], permisos: [
    'rutas_pueblos.listar', 'rutas_pueblos.crear', 'documentos_salida.crear', 'documentos_salida.listar',
    'productos.listar', 'productos.ver', 'almacenes.listar', 'sucursales.listar', 'catalogos.listar',
  ] }
  const productos = Array.from({ length: 614 }, (_, i) => ({ id: i + 100,
    codigo: `PRO-${i}`, nombre: `PRODUCTO ${i}`, estado: 1, afecta_stock: true, stock_actual: 20 }))
  productos.push({ id: 4, codigo: 'GAS-ARGON', nombre: 'ARGON', estado: 1,
    afecta_stock: true, es_gas: true, nombre_unidad_medida: 'MT3', stock_actual: 60 })
  const stocks = productos.map(p => ({ id: p.id, id_producto: p.id, id_almacen: 1,
    nombre_producto: p.nombre, codigo_producto: p.codigo, stock: p.stock_actual,
    nombre_unidad_medida: p.nombre_unidad_medida || 'UND' }))
  const almacen = { id: 1, nombre: 'LAMBAYEQUE', id_sucursal: 1 }
  let ultimaPaginaProductos = 0
  let ultimaPaginaStock = 0
  await page.addInitScript(user => sessionStorage.setItem('auth', JSON.stringify({ token: 'mock-token', user })), user)
  await page.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url())
    if (url.pathname.endsWith('/BarcodeCameraScanner.vue')) {
      return route.fulfill({ contentType: 'application/javascript', body: 'export default { render() { return null } }' })
    }
    if (!['xhr', 'fetch'].includes(req.resourceType()) || /\/(src|node_modules|@)/.test(url.pathname)) return route.continue()
    let data = []
    const pagina = Number(url.searchParams.get('pagina') || 1)
    const limite = Math.min(100, Number(url.searchParams.get('limite') || 100))
    const meta = { pagina, limite, total: 0 }
    if (url.pathname.endsWith('/auth/me')) data = user
    if (url.pathname.endsWith('/configuracion/almacenes')) data = [almacen]
    if (url.pathname.endsWith('/configuracion/almacenes/1')) data = almacen
    if (url.pathname.endsWith('/configuracion/sucursales')) data = [{ id: 1, nombre: 'Principal' }]
    if (url.pathname.endsWith('/productos/4')) data = productos.at(-1)
    if (url.pathname.endsWith('/productos') || url.pathname.endsWith('/productos/stock')) {
      const esStock = url.pathname.endsWith('/stock')
      let lista = esStock ? stocks : productos
      const term = (url.searchParams.get('buscar') || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      if (term) lista = lista.filter(p => `${p.nombre || p.nombre_producto} ${p.codigo || p.codigo_producto}`.toLowerCase().includes(term))
      data = lista.slice((pagina - 1) * limite, pagina * limite)
      meta.total = lista.length
      if (esStock) ultimaPaginaStock = Math.max(ultimaPaginaStock, pagina)
      else ultimaPaginaProductos = Math.max(ultimaPaginaProductos, pagina)
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, meta }) })
  })
  try {
    await page.goto(base + '/admin/balones/rutas-pueblos')
    await page.getByRole('button', { name: 'Nueva ruta', exact: true }).click()
    const modal = page.getByRole('dialog')
    await modal.getByLabel(/^Almacén/).click()
    await page.getByRole('option').filter({ hasText: 'LAMBAYEQUE' }).click()
    await modal.getByRole('button', { name: /Añadir producto/ }).click()
    await expect.poll(() => ultimaPaginaProductos).toBe(7)
    await modal.getByLabel(/^Producto/).click()
    await page.getByPlaceholder('Código o nombre...').fill('argón')
    await page.getByRole('option').filter({ hasText: 'GAS-ARGON' }).click()
    await expect(modal.getByLabel(/^Producto/)).toContainText('GAS-ARGON')
    await modal.getByRole('button', { name: 'Cancelar', exact: true }).click()

    await page.goto(base + '/admin/inventario/documentos-salida/nueva')
    await page.getByLabel(/^Sucursal/).click()
    await page.getByRole('option', { name: 'Principal', exact: true }).click()
    await page.getByLabel(/^Almacén/).click()
    await page.getByRole('option', { name: 'LAMBAYEQUE', exact: true }).click()
    await expect.poll(() => ultimaPaginaStock).toBe(7)
    await page.getByRole('button', { name: 'Buscar producto...', exact: true }).click()
    await page.getByPlaceholder('Código o nombre...').fill('argón')
    await page.getByRole('option').filter({ hasText: 'GAS-ARGON' }).click()
    const fila = page.getByRole('button', { name: 'Agregar otro producto', exact: true }).locator('..')
    await fila.getByRole('spinbutton').fill('10')
    await expect(fila.getByRole('spinbutton')).toHaveAttribute('max', '60')
    await page.getByRole('button', { name: 'Agregar otro producto', exact: true }).click()
    await expect(page.getByRole('row').filter({ hasText: 'GAS-ARGON' })).toContainText('ARGON')
    console.log('OK: rutas a pueblos y documentos de salida encuentran argón y sus 60 m³ en la séptima página')
  } catch (error) {
    console.error((await page.locator('body').innerText()).slice(-3500))
    throw error
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
