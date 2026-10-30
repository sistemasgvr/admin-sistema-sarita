// Vite en E2E_BASE_URL o http://127.0.0.1:5188. API simulada, sin stock real.
const { chromium, expect } = require('@playwright/test')
;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const user = { id: 42, nombre: 'Prueba', estado: true, roles: [], permisos: [
    'rutas_pueblos.listar','rutas_pueblos.crear','rutas_pueblos.ver','rutas_pueblos.editar',
    'rutas_pueblos.eliminar','productos.listar','productos.ver','almacenes.listar','catalogos.listar','balones.listar',
  ] }
  const balon = { id: 101, codigo_balon: 'MANUAL-A', nombre_tipo_balon: 'Oxígeno 10 m³',
    id_almacen: 1, nombre_estado_balon: 'DISPONIBLE', estado: 1, capacidad: 10, capacidad_lb: null }
  let ruta = null, salida = null, retorno = null, cierre = null
  await page.addInitScript(user => sessionStorage.setItem('auth', JSON.stringify({token:'mock-token',user})), user)
  await page.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url()), pathname = url.pathname
    if (pathname.endsWith('/BarcodeCameraScanner.vue')) return route.fulfill({contentType:'application/javascript',body:'export default {render(){return null}}'})
    if (!['xhr','fetch'].includes(req.resourceType()) || /\/(src|node_modules|@)/.test(pathname)) return route.continue()
    let data = []
    const meta = { pagina:1,limite:200,total:0 }
    if (pathname.endsWith('/auth/me')) data = user
    if (pathname.endsWith('/configuracion/almacenes')) data = [{id:1,nombre:'PRINCIPAL'}]
    if (pathname.endsWith('/balones')) data = [balon]
    if (pathname.endsWith('/balones/101')) data = balon
    if (/\/catalogos\/listas\/\d+\/opciones$/.test(pathname)) data = [{id:5,nombre:'DISPONIBLE'}]
    if (pathname.endsWith('/balones/rutas-pueblos') && req.method() === 'POST') {
      salida = req.postDataJSON()
      ruta = {id:42,fecha:'2026-10-30',id_almacen:1,nombre_almacen:'PRINCIPAL',control_gas_manual:true,
        nombre_estado:'ABIERTA',total_cilindros:1,total_retornados:0,m3_calculado:0,tolerancia_m3:0.5,
        detalles:[{id:1,id_balon:101,codigo_balon:'MANUAL-A',lb_salida:salida.detalles[0].lbSalida,
          m3_salida:salida.detalles[0].m3Salida,lb_retorno:null,m3_retorno:null}],detalles_productos:[]}
      data = ruta
    } else if (pathname.endsWith('/balones/rutas-pueblos')) data = ruta ? [ruta] : []
    if (pathname.endsWith('/rutas-pueblos/42')) data = ruta
    if (pathname.endsWith('/rutas-pueblos/42/iniciar')) { ruta.nombre_estado='EN_RUTA'; data=ruta }
    if (pathname.endsWith('/rutas-pueblos/42/registrar-retorno')) {
      retorno=req.postDataJSON(); ruta.detalles[0].lb_retorno=retorno.detalles[0].lbRetorno
      ruta.detalles[0].m3_retorno=retorno.detalles[0].m3Retorno
      ruta.m3_calculado=10-retorno.detalles[0].m3Retorno
      ruta.m3_calculado_exacto=ruta.m3_calculado; ruta.total_retornados=1; data=ruta
    }
    if (pathname.endsWith('/rutas-pueblos/42/cerrar')) {
      cierre=req.postDataJSON(); ruta.nombre_estado='CERRADA'; data=ruta
    }
    if (Array.isArray(data)) meta.total=data.length
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data,meta})})
  })
  const menu = async nombre => {
    await page.getByRole('button',{name:'Más acciones',exact:true}).click()
    await page.getByRole('menuitem',{name:nombre,exact:true}).click()
  }
  try {
    await page.goto((process.env.E2E_BASE_URL || 'http://127.0.0.1:5188')+'/admin/balones/rutas-pueblos')
    await page.getByRole('button',{name:'Nueva ruta',exact:true}).click()
    let modal=page.getByRole('dialog')
    await modal.getByLabel(/^Almacén/).click()
    await page.getByRole('option').filter({hasText:'PRINCIPAL'}).click()
    await modal.getByLabel(/^Cilindro/).click()
    await page.getByRole('option').filter({hasText:'MANUAL-A'}).click()
    await modal.getByLabel(/^Libras de salida/).fill('1300')
    await expect(modal.getByLabel(/^m³ de salida/)).toHaveValue('')
    await modal.getByLabel(/^m³ de salida/).fill('10')
    await modal.getByRole('button',{name:'Crear ruta',exact:true}).click()
    await expect.poll(()=>salida?.detalles[0]).toMatchObject({idBalon:101,lbSalida:1300,m3Salida:10})
    await menu('Iniciar ruta')
    await page.getByRole('dialog').getByRole('button',{name:'Iniciar',exact:true}).click()
    await expect.poll(()=>ruta.nombre_estado).toBe('EN_RUTA')
    await menu('Registrar retorno')
    modal=page.getByRole('dialog')
    await modal.getByLabel(/^Libras de retorno/).fill('350')
    await modal.getByRole('button',{name:'Guardar retorno',exact:true}).click()
    expect(retorno).toBeNull()
    await modal.getByLabel(/^m³ de retorno/).fill('11')
    await modal.getByRole('button',{name:'Guardar retorno',exact:true}).click()
    expect(retorno).toBeNull()
    await modal.getByLabel(/^m³ de retorno/).fill('2.7')
    await modal.getByRole('button',{name:'Guardar retorno',exact:true}).click()
    await expect.poll(()=>retorno?.detalles[0]).toMatchObject({idBalon:101,lbRetorno:350,m3Retorno:2.7})
    await menu('Cerrar ruta')
    modal=page.getByRole('dialog')
    await expect(modal).toContainText('7.3000 m³')
    await modal.getByLabel(/^Gas reportado/).fill('7.3')
    await expect(modal).toContainText('Diferencia: 0.000 m³')
    await modal.getByRole('button',{name:'Cerrar ruta',exact:true}).click()
    await expect.poll(()=>cierre?.m3ReportadoVentas).toBe(7.3)
    console.log('OK: libras y m³ independientes, retorno obligatorio y acotado, cierre conserva 7.3 m³')
  } catch(error) {
    console.error((await page.locator('body').innerText()).slice(-4000)); throw error
  } finally { await browser.close() }
})().catch(error=>{console.error(error);process.exitCode=1})
