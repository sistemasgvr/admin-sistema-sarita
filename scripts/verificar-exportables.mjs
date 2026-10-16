/** Prueba de integración local: vistas reales, API simulada y archivos XLSX reales.
 * Ejecutar desde el frontend: node scripts/verificar-exportables.mjs
 */
import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import ExcelJS from 'exceljs'
import { writeFile, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

process.chdir(fileURLToPath(new URL('../', import.meta.url)))
const prefix = `.qa-exportables-${process.pid}`
const html = `${prefix}.html`
const entry = `${prefix}.ts`
let server, browser
try {
  await writeFile(
    html,
    `<html><body><div id="app"></div><script type="module" src="/${entry}"></script></body></html>`,
  )
  await writeFile(
    entry,
    `
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { apiClient } from './src/shared/api/apiClient'
import Tributo from './src/modules/tributos-sunat/components/TributoListView.vue'
import Gastos from './src/modules/compras/views/GastosCajaListView.vue'
import Usuarios from './src/modules/usuarios/views/UsuariosListView.vue'
import SidebarProvider from './src/modules/admin/layout/SidebarProvider.vue'
import './src/assets/main.css'
apiClient.defaults.baseURL = '/qa-api'
const tipo = new URLSearchParams(location.search).get('tipo')
const component = tipo === 'gastos' ? Gastos : tipo === 'usuarios' ? Usuarios : Tributo
const app = createApp({ render: () => h(SidebarProvider, null, { default: () => h(component, { tipo: tipo === 'percepcion' ? 'percepcion' : 'retencion' }) }) })
const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })
app.use(createPinia()).use(router).use(VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) })
router.isReady().then(() => app.mount('#app'))
`,
  )
  server = await createServer({ server: { host: '127.0.0.1', port: 5198, strictPort: true } })
  await server.listen()
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
    headless: true,
  })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const exportRequests = []
  await page.route('**/qa-api/**', async (route) => {
    const url = new URL(route.request().url())
    const endpoint = url.pathname.replace('/qa-api', '')
    const params = url.searchParams
    const pagina = Number(params.get('pagina') || 1)
    const limite = Number(params.get('tamano') || params.get('limite') || 20)
    const total = ['/retenciones', '/percepciones', '/caja/gastos', '/auth/usuarios'].includes(
      endpoint,
    )
      ? 501
      : 0
    if (limite >= 500) exportRequests.push({ endpoint, params: Object.fromEntries(params) })
    const rows = Array.from(
      { length: Math.max(0, Math.min(limite, total - (pagina - 1) * limite)) },
      (_, index) => {
        const id = (pagina - 1) * limite + index + 1
        const numero = String(id).padStart(6, '0')
        if (endpoint === '/caja/gastos')
          return {
            id,
            fecha: '2026-10-16',
            concepto: `Oxígeno ${id}`,
            categoriaGasto: 'COMBUSTIBLE',
            medioPago: 'Efectivo',
            cuentaBancaria: 'Cuenta principal',
            numeroOperacion: numero,
            monto: '125.40',
            observacion: 'Prueba',
            estado: 1,
          }
        if (endpoint === '/auth/usuarios')
          return {
            id,
            nombre: `Usuario ${id}`,
            correo: `u${id}@example.test`,
            roles: [{ id: 1, nombre: 'Operador' }],
            estado: true,
            contrasena: 'NO_EXPORTAR',
            token: 'NO_EXPORTAR',
            fecha_creacion: '2026-10-16',
          }
        return {
          id,
          serie: endpoint === '/percepciones' ? 'P001' : 'R001',
          numero,
          fecha_emision: '2026-10-16',
          nombre_proveedor: 'Proveedor de oxígeno',
          documento_proveedor: '00123456789',
          nombre_cliente: 'Cliente de oxígeno',
          documento_cliente: '00123456',
          regimen: '01',
          tasa: '3.00',
          base_imponible: '100.00',
          monto_retenido: '3.00',
          monto_pagado: '97.00',
          monto_percibido: '3.00',
          monto_cobrado: '103.00',
          nombre_estado_sunat: 'ACEPTADO',
        }
      },
    )
    await route.fulfill({ json: { success: true, data: rows, meta: { pagina, limite, total } } })
  })

  for (const [tipo, endpoint, titulo, header, value] of [
    ['retencion', '/retenciones', 'Retenciones', 'Retención', 3],
    ['percepcion', '/percepciones', 'Percepciones', 'Percepción', 3],
    ['gastos', '/caja/gastos', 'Gastos de caja', 'Monto', 125.4],
    ['usuarios', '/auth/usuarios', 'Usuarios', 'Roles', 'Operador'],
  ]) {
    await page.goto(`http://127.0.0.1:5198/${html}?tipo=${tipo}`)
    await page.getByRole('button', { name: 'Exportar Excel', exact: true }).waitFor()
    const loaded = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === `/qa-api${endpoint}` &&
        new URL(r.url()).searchParams.get('buscar') === 'oxígeno',
    )
    await page.getByRole('searchbox').fill('oxígeno')
    await loaded
    if (tipo !== 'usuarios') {
      await page.locator('button[aria-expanded]').first().click()
      await page.getByPlaceholder('dd/mm/aaaa').first().fill('01/10/2026')
      const filtered = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === `/qa-api${endpoint}` &&
          new URL(r.url()).searchParams.get('fechaDesde') === '2026-10-01',
      )
      await page.getByPlaceholder('dd/mm/aaaa').first().press('Enter')
      await filtered
      await page.getByText(titulo, { exact: true }).first().click()
    }
    const start = exportRequests.length
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Exportar Excel', exact: true }).click()
    const download = await downloadPromise
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(await download.path())
    assert.equal(wb.worksheets.length, 1)
    const sheet = wb.worksheets[0]
    assert.equal(sheet.rowCount, 502, `${titulo}: incluye las 501 filas y encabezados`)
    const headers = sheet.getRow(1).values.slice(1)
    const col = headers.indexOf(header) + 1
    assert.ok(col > 0, `${titulo}: encabezado ${header}`)
    assert.equal(sheet.getCell(2, col).value, value)
    if (tipo === 'retencion' || tipo === 'percepcion') {
      assert.equal(sheet.getCell(2, headers.indexOf('Número') + 1).value, '000001')
      assert.equal(sheet.getCell(502, headers.indexOf('Número') + 1).value, '000501')
    }
    if (tipo === 'usuarios') {
      assert.ok(!JSON.stringify(sheet.getSheetValues()).includes('NO_EXPORTAR'))
      assert.ok(!headers.some((h) => /contrase|token/i.test(h)))
    }
    const requests = exportRequests.slice(start)
    assert.equal(requests.length, 2)
    assert.ok(requests.every((r) => r.endpoint === endpoint && r.params.buscar === 'oxígeno'))
    if (tipo !== 'usuarios') assert.ok(requests.every((r) => r.params.fechaDesde === '2026-10-01'))
    const sizeKey = tipo === 'retencion' || tipo === 'percepcion' ? 'tamano' : 'limite'
    assert.ok(requests.every((r) => r.params[sizeKey] === '500'))
    console.log(
      `PASS ${titulo}: botón visible, filtros conservados, 501 registros, XLSX válido y tipos correctos`,
    )
  }
  assert.deepEqual(errors, [])
} finally {
  await browser?.close()
  await server?.close()
  await Promise.all([html, entry].map((file) => unlink(file).catch(() => {})))
}
