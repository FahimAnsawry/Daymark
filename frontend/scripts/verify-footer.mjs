import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const footer = await read('../src/components/SiteFooter.tsx')
const styles = await read('../src/index.css')

assert.match(footer, /className="site-footer\b/)
assert.match(footer, /footer-grid/)
assert.match(footer, /footer-newsletter/)
assert.match(footer, /footer-column/)
assert.match(footer, /footer-bottom/)
assert.match(footer, /hello@daymark\.app/)
assert.match(styles, /\.footer-column\s*\{/)

// Every marketing page renders the shared footer.
for (const page of ['index', 'about', 'pricing']) {
  assert.match(await read(`../src/routes/${page}.tsx`), /<SiteFooter \/>/, `${page}.tsx`)
}

console.log('Footer structure and styling hooks are present.')
