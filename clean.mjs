import { rmSync } from 'node:fs'
for (const path of ['.next', 'out']) rmSync(path, { recursive: true, force: true })
console.log('TERON: artefatos removidos.')
