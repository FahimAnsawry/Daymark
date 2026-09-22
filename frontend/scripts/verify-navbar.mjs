import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile(new URL('../src/routes/index.tsx', import.meta.url), 'utf8')
const navbar = await readFile(new URL('../src/components/Navbar.tsx', import.meta.url), 'utf8')
const content = page + navbar
const styles = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')

assert.match(content, /className="site-nav"/)
assert.match(content, /className="desktop-nav-cta"[^>]*>Start for free/)
assert.match(content, /aria-controls="mobile-store-navigation"/)
assert.match(content, /id="mobile-store-navigation"/)
assert.match(content, /onKeyDown=\{handleMenuKeyDown\}/)
assert.match(styles, /\.desktop-nav-cta\s*\{\s*display: inline-flex/)
assert.match(styles, /\.site-nav a:focus-visible, \.site-nav button:focus-visible/)

console.log('Navbar structure, responsive CTA, and keyboard hooks are present.')
