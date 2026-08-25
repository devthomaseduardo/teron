import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rateLimit } from './rate-limit.js'

describe('rateLimit', () => {
  it('permite ate o limite e bloqueia depois', () => {
    const key = `test-${Date.now()}-${Math.random()}`
    for (let i = 0; i < 5; i++) {
      const r = rateLimit(key, { limit: 5, windowMs: 60_000 })
      assert.equal(r.ok, true)
    }
    const blocked = rateLimit(key, { limit: 5, windowMs: 60_000 })
    assert.equal(blocked.ok, false)
    if (!blocked.ok) assert.ok(blocked.retryAfterSec >= 1)
  })
})
