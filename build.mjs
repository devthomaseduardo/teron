import { execSync } from 'node:child_process'
execSync('pnpm build', { stdio: 'inherit' })
