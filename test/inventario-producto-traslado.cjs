// npm run dev -- --host 127.0.0.1 --port 5187
// node test/inventario-producto-traslado.cjs
// Navegador con API simulada: no mueve stock real.
const { chromium, expect } = require('@playwright/test')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const permisos = ['inventario_movimientos.listar', 'inventario_movimientos.crear',
    'productos.listar', 'productos.ver', 'almacenes.listar', 'catalogos.listar']
  const user = { id: 42, nombre: 'Prueba', estado: true, roles: [], permisos }
  const argon = { id: 4, codigo: 'GAS-ARGON', nombre: 'ARGON', estado: 1,
    es_gas: true, afecta_stock: true, nombre_unidad_medida: 'MT3', stock_actual: 60 }
  let busquedaRemota = false
  let traslado = null
  await page.addInitScript(user => {
    sessionStorage.setItem('auth', JSON.stringify({ token: 'mock-token', user }))
  }, user)
  await page.route('**/*', async route => {
    const req = route.request()
    // La cámara no participa en esta prueba; evita cargar su dependencia opcional.
    if (new URL(req.url()).pathname.endsWith('/BarcodeCameraScanner.vue')) {
      return route.fulfill({ contentType: 'application/javascript', body: 'export default { render() { return null } }' })
    }
    if (!['xhr', 'fetch'].includes(req.resourceType())) return route.continue()
    const url = new URL(req.url())
    if (url.pathname.includes('/src/') || url.pathname.includes('/node_modules/') || url.pathname.includes('/@')) return route.continue()
    let data = []
    const meta = { pagina: 1, limite: 80, total: 115, totalPaginas: 2 }
    if (url.pathname.endsWith('/auth/me')) data = user
    if (url.pathname.endsWith('/listas/78/opciones')) data = [{ id: 1, nombre: 'PRODUCTO' }, { id: 2, nombre: 'BALON' }]
    if (url.pathname.endsWith('/listas/72/opciones')) data = [{ id: 3, nombre: 'TRASLADO', descripcion: 'Traslado' }]
    if (url.pathname.endsWith('/configuracion/almacenes')) data = [{ id: 1, nombre: 'LAMBAYEQUE' }, { id: 2, nombre: 'DESTINO' }]
    if (url.pathname.endsWith('/productos/4')) data = argon
    if (url.pathname.endsWith('/productos')) {
      const term = url.searchParams.get('buscar') || ''
      if (term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === 'argon') {
        busquedaRemota = true
        data = [argon]
      } else {
        // El catálogo inicial no incluye argón, igual que la primera página real.
        data = [{ id: 110, codigo: 'PRO-110', nombre: 'ABRAZADERA', estado: 1 }]
      }
    }
    if (url.pathname.endsWith('/inventario/movimientos') && req.method() === 'POST') {
      traslado = req.postDataJSON()
      data = { id: 999 }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, meta }) })
  })
  try {
    await page.goto((process.env.E2E_BASE_URL || 'http://127.0.0.1:5187') + '/admin/inventario/movimientos?tipo=TRASLADO&idProducto=4&idAlmacen=1')
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    const producto = modal.getByLabel(/^Producto/)
    await expect(producto).toContainText('GAS-ARGON')
    await producto.click()
    await page.getByPlaceholder('Código o nombre...').fill('argón')
    await expect.poll(() => busquedaRemota).toBe(true)
    await page.getByRole('option').filter({ hasText: 'GAS-ARGON' }).click()
    await modal.getByLabel(/^Cantidad/).fill('10')
    await modal.getByLabel(/^Almacén destino/).click()
    await page.getByRole('option', { name: 'DESTINO', exact: true }).click()
    await modal.getByRole('button', { name: 'Registrar movimiento', exact: true }).click()
    await expect.poll(() => traslado).toMatchObject({ naturaleza: 'PRODUCTO',
      codigoTipoMovimiento: 'TRASLADO', idProducto: 4, idAlmacenOrigen: 1,
      idAlmacenDestino: 2, cantidad: 10 })
    console.log('OK: argón precargado, búsqueda remota con tilde y traslado con producto y almacenes correctos')
  } catch (error) {
    console.error((await page.locator('body').innerText()).slice(0, 2000))
    throw error
  } finally {
    await browser.close()
  }
})().catch(error => { console.error(error); process.exitCode = 1 })
