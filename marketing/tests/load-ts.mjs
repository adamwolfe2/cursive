// Zero-dependency loader for tests: transpiles a .ts/.tsx module with the
// project's TypeScript and evaluates it as CommonJS with optional module stubs.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import ts from 'typescript'

const require = createRequire(import.meta.url)

export function loadTs(relPath, stubs = {}) {
  const file = path.resolve(import.meta.dirname, '..', relPath)
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: file,
  })
  const mod = { exports: {} }
  const localRequire = (id) => (id in stubs ? stubs[id] : require(id))
  new Function('require', 'module', 'exports', outputText)(localRequire, mod, mod.exports)
  return mod.exports
}
