import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const distDir = join(import.meta.dirname, 'dist')
const html = readFileSync(join(distDir, 'index.html'), 'utf-8')

const jsMatch = html.match(/src="\/assets\/(index-[^"]+\.js)"/)
const cssMatch = html.match(/href="\/assets\/(index-[^"]+\.css)"/)
if (!jsMatch || !cssMatch) throw new Error('JS/CSS asset not found in dist/index.html')

const js = readFileSync(join(distDir, 'assets', jsMatch[1]), 'utf-8')
const css = readFileSync(join(distDir, 'assets', cssMatch[1]), 'utf-8')

const output = `<title>バイク管理（試用版）</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`

writeFileSync(join(import.meta.dirname, 'artifact-bundle.html'), output, 'utf-8')
console.log('wrote artifact-bundle.html, size(KB) =', Math.round(output.length / 1024))
