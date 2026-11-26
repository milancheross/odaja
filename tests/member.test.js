import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { passwordHash, verifyPassword, authenticate } from '../api/member.js';
import photoHandler from '../api/photo.js';

function response() {
  return {
    headers: {}, statusCode: 200, body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    end() { return this; }
  };
}
test('salted passwords accept the original and reject a different password', async () => {
  const first = await passwordHash('LongTestPassword123!');
  const second = await passwordHash('LongTestPassword123!');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('LongTestPassword123!', first), true);
  assert.equal(await verifyPassword('DifferentPassword123!', first), false);
});
test('session cookie is parsed exactly and looked up by hash', async () => {
  const token = 'ab'.repeat(32);
  let received;
  const sql = async (_strings, tokenHash) => { received = tokenHash; return [{ id: 'test-member' }]; };
  const member = await authenticate(sql, { headers: { cookie: 'another=value; __Host-odaja=' + token } });
  assert.equal(member.id, 'test-member');
  assert.equal(received.length, 64);
  assert.notEqual(received, token);
  assert.equal(await authenticate(sql, { headers: { cookie: '__Host-odaja=invalid' } }), null);
});
test('cross-origin writes are rejected before database access', async () => {
  const res = response();
  await handler({ method: 'POST', headers: { host: 'odaja.vercel.app', origin: 'https://example.com', 'content-type': 'application/json' }, body: { action: 'register' } }, res);
  assert.equal(res.statusCode, 403);
});
test('photo endpoint rejects slots outside the three supported slots', async () => {
  for (const slot of ['0', '4', '1.5', 'invalid']) {
    const res = response();
    await photoHandler({ method: 'GET', query: { slot } }, res);
    assert.equal(res.statusCode, 400);
  }
});
