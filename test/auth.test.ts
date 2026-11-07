import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  verifyGoogleToken,
  extractBearerToken,
  _resetJwksCache,
} from '../api/utils/auth';

const TEST_CLIENT_ID = 'test-covercraft-client-id.apps.googleusercontent.com';

function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf.toString('base64url');
}

describe('Google ID Token Server Verification', () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  const jwk = publicKey.export({ format: 'jwk' }) as {
    kty: string;
    n: string;
    e: string;
  };
  const testKid = 'test-key-id-1';

  beforeEach(() => {
    _resetJwksCache();
    process.env.GOOGLE_CLIENT_ID = TEST_CLIENT_ID;
  });

  function createSignedToken(
    payloadOverrides: Record<string, unknown> = {},
    headerOverrides: Record<string, unknown> = {},
    customPrivateKey: crypto.KeyObject = privateKey
  ): string {
    const header = {
      alg: 'RS256',
      kid: testKid,
      typ: 'JWT',
      ...headerOverrides,
    };

    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
      iss: 'https://accounts.google.com',
      aud: TEST_CLIENT_ID,
      sub: 'google-user-1234567890',
      email: 'candidate@example.com',
      name: 'Alex Developer',
      exp: nowSec + 3600,
      iat: nowSec,
      ...payloadOverrides,
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${headerB64}.${payloadB64}`;

    const signature = crypto.sign('RSA-SHA256', Buffer.from(dataToSign, 'utf8'), customPrivateKey);
    const signatureB64 = base64UrlEncode(signature);

    return `${headerB64}.${payloadB64}.${signatureB64}`;
  }

  it('extracts Bearer token correctly from authorization header', () => {
    assert.equal(extractBearerToken('Bearer my-test-token'), 'my-test-token');
    assert.equal(extractBearerToken('bearer my-test-token'), 'my-test-token');
    assert.equal(extractBearerToken('Bearer   spaced-token  '), 'spaced-token');
    assert.equal(extractBearerToken('Basic xyz'), null);
    assert.equal(extractBearerToken(undefined), null);
    assert.equal(extractBearerToken(''), null);
  });

  it('rejects missing or empty token', async () => {
    const result = await verifyGoogleToken('', TEST_CLIENT_ID);
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
  });

  it('rejects malformed token format (not 3 dot-separated parts)', async () => {
    const result = await verifyGoogleToken('part1.part2', TEST_CLIENT_ID);
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.match(result.error, /Malformed/);
  });

  it('rejects token with wrong audience', async () => {
    const token = createSignedToken({ aud: 'wrong-client-id.apps.googleusercontent.com' });
    const result = await verifyGoogleToken(token, TEST_CLIENT_ID);
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.match(result.error, /audience/i);
  });

  it('rejects token with wrong issuer', async () => {
    const token = createSignedToken({ iss: 'https://evil-issuer.com' });
    const result = await verifyGoogleToken(token, TEST_CLIENT_ID);
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.match(result.error, /issuer/i);
  });

  it('rejects expired token', async () => {
    const pastSec = Math.floor(Date.now() / 1000) - 1000;
    const token = createSignedToken({ exp: pastSec });
    const result = await verifyGoogleToken(token, TEST_CLIENT_ID);
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.match(result.error, /expired/i);
  });

  it('rejects token missing sub identity', async () => {
    const token = createSignedToken({ sub: '' });
    const result = await verifyGoogleToken(token, TEST_CLIENT_ID);
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.match(result.error, /subject/i);
  });

  it('rejects unsupported signing algorithm', async () => {
    const token = createSignedToken({}, { alg: 'none' });
    const result = await verifyGoogleToken(token, TEST_CLIENT_ID);
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.match(result.error, /algorithm/i);
  });

  it('verifies cryptographically valid token when JWKS returns matching public key', async () => {
    const originalFetch = global.fetch;
    global.fetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('oauth2/v3/certs')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'cache-control': 'public, max-age=3600' }),
          json: async () => ({
            keys: [
              {
                kty: 'RSA',
                alg: 'RS256',
                use: 'sig',
                kid: testKid,
                n: jwk.n,
                e: jwk.e,
              },
            ],
          }),
        } as Response;
      }
      return originalFetch(url);
    };

    try {
      const token = createSignedToken();
      const result = await verifyGoogleToken(token, TEST_CLIENT_ID);

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.user.sub, 'google-user-1234567890');
        assert.equal(result.user.email, 'candidate@example.com');
        assert.equal(result.user.name, 'Alex Developer');
      }
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('rejects token when signature verification fails', async () => {
    const { privateKey: otherPrivateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    const originalFetch = global.fetch;
    global.fetch = async () =>
      ({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          keys: [
            {
              kty: 'RSA',
              alg: 'RS256',
              use: 'sig',
              kid: testKid,
              n: jwk.n,
              e: jwk.e,
            },
          ],
        }),
      } as Response);

    try {
      // Signed with a different private key than the public key in JWKS
      const token = createSignedToken({}, {}, otherPrivateKey);
      const result = await verifyGoogleToken(token, TEST_CLIENT_ID);

      assert.equal(result.ok, false);
      assert.equal(result.status, 401);
      assert.match(result.error, /signature/i);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
