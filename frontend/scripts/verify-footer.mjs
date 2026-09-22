import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile(new URL('../src/routes/index.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')

assert.match(page, /className="site-footer"/)
assert.match(page, /footer-newsletter/)
assert.match(page, /footer-column/)
assert.match(page, /hello@daymark\.app/)
assert.match(styles, /\.footer-grid\s*\{/)
assert.match(styles, /\.footer-bottom\s*\{/)

console.log('Footer structure and styling hooks are present.')
