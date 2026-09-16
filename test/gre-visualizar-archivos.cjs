const { chromium, expect } = require('@playwright/test')
const ts = require('typescript')
const fs = require('node:fs')
const path = require('node:path')

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent('<button id="abrir">Abrir</button>')
    const source = fs.readFileSync(path.join(__dirname, '../src/shared/utils/visualizarArchivo.ts'), 'utf8').replace('export async function', 'async function')
    await page.addScriptTag({ content: ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText })
    const xml = '<?xml version="1.0"?><DespatchAdvice><script>window.pwned=true</script>á</DespatchAdvice>'
    await page.evaluate(xml => {
      document.querySelector('#abrir').onclick = () => visualizarArchivo(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return new Blob([xml])
      }, 'GRE-T001-1.xml', 'xml')
    }, xml)
    const xmlTabPromise = page.waitForEvent('popup')
    await page.click('#abrir')
    const xmlTab = await xmlTabPromise
    await expect(xmlTab.locator('pre')).toHaveText(xml)
    await expect(xmlTab.locator('a[download]')).toHaveAttribute('download', 'GRE-T001-1.xml')
    expect(await xmlTab.evaluate(() => window.opener)).toBeNull()
    expect(await xmlTab.evaluate(() => window.pwned)).toBeUndefined()
    const downloadPromise = xmlTab.waitForEvent('download')
    await xmlTab.locator('a').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('GRE-T001-1.xml')
    expect(fs.readFileSync(await download.path(), 'utf8')).toBe(xml)
    await xmlTab.close()
    const PDFDocument = require('../../api-sistema-sarita/node_modules/pdfkit')
    const pdfBytes = await new Promise(resolve => {
      const pdf = new PDFDocument()
      const chunks = []
      pdf.on('data', chunk => chunks.push(chunk))
      pdf.on('end', () => resolve(Array.from(Buffer.concat(chunks))))
      pdf.text('GRE de prueba — visualización local')
      pdf.end()
    })
    await page.evaluate(bytes => {
      document.querySelector('#abrir').onclick = () => visualizarArchivo(async () => new Blob([new Uint8Array(bytes)]), 'GRE.pdf', 'pdf')
    }, pdfBytes)
    const pdfTabPromise = page.waitForEvent('popup')
    await page.click('#abrir')
    const pdfTab = await pdfTabPromise
    await expect(pdfTab.locator('iframe')).toHaveAttribute('src', /^blob:/)
    await expect(pdfTab.locator('a')).toHaveAttribute('download', 'GRE.pdf')
    await pdfTab.close()
    await page.evaluate(() => {
      document.querySelector('#abrir').onclick = () => visualizarArchivo(async () => { throw new Error('XML aún no disponible') }, 'GRE.xml', 'xml').catch(() => {})
    })
    const errorPromise = page.waitForEvent('popup')
    await page.click('#abrir')
    const errorTab = await errorPromise
    await expect(errorTab.locator('p')).toHaveText('XML aún no disponible')
    await errorTab.close()
    const blocked = await page.evaluate(async () => {
      window.open = () => null
      try { await visualizarArchivo(async () => new Blob([]), 'GRE.xml', 'xml') } catch (error) { return error.message }
    })
    expect(blocked).toContain('bloqueó')
    console.log('OK: XML visible sin ejecución, descarga original, PDF en pestaña, errores y bloqueo de ventanas')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
