import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword, isHashed } from './password.js'

describe('password', () => {
  it('hash e verify funcionam', () => {
    const h = hashPassword('teron-admin')
    assert.equal(isHashed(h), true)
    assert.equal(verifyPassword('teron-admin', h), true)
    assert.equal(verifyPassword('wrong', h), false)
  })

  it('aceita texto plano legado (demo)', () => {
    assert.equal(verifyPassword('teron-client', 'teron-client'), true)
    assert.equal(verifyPassword('x', 'teron-client'), false)
  })
})
