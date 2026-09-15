// Prueba de navegador con API simulada: no escribe empresas reales.
const { chromium, expect } = require('@playwright/test')
;(async () => {
 const browser = await chromium.launch({ headless: true })
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
 const empresas = [{ id: 1, ruc: '20111111111', razon_social: 'Empresa Uno' }, { id: 2, ruc: '20222222222', razon_social: 'Empresa Dos' }]
 const permisos = ['empresas.listar','empresas.ver','empresas.crear','empresas.editar','configuracion_sunat.listar','configuracion_sunat.ver','configuracion_sunat.crear','configuracion_sunat.editar']
 await page.addInitScript(({ permisos }) => {
  if (!sessionStorage.getItem('auth')) sessionStorage.setItem('auth', JSON.stringify({token:'mock-token',user:{id:42,nombre:'Prueba',correo:'test@example.com',estado:true,roles:[],permisos}}))
 }, { permisos })
 let created = null
 await page.route('**/*', async route => {
  const req = route.request()
  if (!['xhr','fetch'].includes(req.resourceType()) || req.url().includes('/@') || req.url().includes('/src/') || req.url().includes('/node_modules/')) return route.continue()
  const url = new URL(req.url()); let data = []; let meta = { pagina:1,limite:100,total:empresas.length,totalPaginas:1 }
  if (url.pathname.includes('/auth/me')) data = { id:42,nombre:'Prueba',correo:'test@example.com',estado:true,roles:[],permisos }
  if (url.pathname.includes('/configuracion/empresas')) {
   const id = url.pathname.match(/empresas\/(\d+)$/)?.[1]
   if (req.method() === 'POST') {
    created = req.postDataJSON(); const e = {id:3,ruc:created.ruc,razon_social:created.razonSocial}; empresas.push(e); data=e
   } else data = id ? empresas.find(e => e.id === Number(id)) : empresas
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data,meta})})
 })
 try {
  await page.goto('http://127.0.0.1:5179/admin/configuracion/empresas')
  await page.getByLabel(/^Empresa activa/).click()
  await page.getByRole('option',{name:'Empresa Dos · 20222222222'}).click()
  await expect(page.getByLabel(/^RUC/)).toHaveValue('20222222222')
  await page.reload()
  await expect(page.getByLabel(/^RUC/)).toHaveValue('20222222222')
  await page.getByRole('button',{name:'Añadir empresa',exact:true}).click()
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()
  await expect(modal.getByLabel(/^RUC/)).toHaveValue('')
  await modal.getByLabel(/^RUC/).fill('20333333333')
  await modal.getByLabel('Razón social',{exact:true}).fill('Empresa Tres')
  await modal.getByRole('button',{name:'Registrar empresa'}).click()
  await expect(modal).not.toBeVisible()
  await expect(page.getByLabel(/^RUC/)).toHaveValue('20333333333')
  expect(created.ruc).toBe('20333333333')
  await page.reload()
  await expect(page.getByLabel(/^RUC/)).toHaveValue('20333333333')
  await page.goto('http://127.0.0.1:5179/admin/configuracion/sunat')
  await expect(page.getByLabel(/^Empresa activa/)).toContainText('Empresa Tres')
  await page.reload()
  await expect(page.getByLabel(/^Empresa activa/)).toContainText('Empresa Tres')
  console.log('OK: selección al recargar, creación en modal y misma empresa en SUNAT')
 } catch (error) { console.log(page.url(), (await page.locator('body').innerText()).slice(0,2500)); throw error } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode=1 })
