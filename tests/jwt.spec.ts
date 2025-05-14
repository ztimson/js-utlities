import { createJwt, decodeJwt } from '../src';

describe('JWT Utilities', () => {
	describe('createJwt', () => {
		it('should create a valid JWT string with default signature', () => {
			const payload = { foo: 'bar', num: 123 };
			const jwt = createJwt(payload);
			const parts = jwt.split('.');
			expect(parts).toHaveLength(3);

			// Header should decode to HS256 + JWT
			const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
			expect(header).toEqual({ alg: "HS256", typ: "JWT" });

			// Body should match the payload
			const body = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
			expect(body).toEqual(payload);

			// Signature should be 'unsigned'
			expect(parts[2]).toBe('unsigned');
		});

		it('should allow custom signature', () => {
			const jwt = createJwt({ test: 1 }, 'mysignature');
			expect(jwt.split('.')[2]).toBe('mysignature');
		});
	});

	describe('decodeJwt', () => {
		it('should decode a JWT payload', () => {
			const payload = { user: 'alice', age: 30 };
			const jwt = createJwt(payload);
			const decoded = decodeJwt<typeof payload>(jwt);
			expect(decoded).toEqual(payload);
		});

		it('should decode payload with different types', () => {
			const payload = { arr: [1,2,3], flag: true, val: null };
			const jwt = createJwt(payload);
			const decoded = decodeJwt<typeof payload>(jwt);
			expect(decoded).toEqual(payload);
		});

		it('should throw or return null for malformed tokens', () => {
			// Not enough parts
			expect(() => decodeJwt('foo.bar')).toThrow();
			// Bad base64
			expect(() => decodeJwt('a.b@d.c')).toThrow();
		});

		it('should decode JWT even if signature is missing', () => {
			// Two-part JWT (not standard, but let's see what happens)
			const payload = { ok: true };
			const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64url');
			const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
			const jwt = `${header}.${body}`;
			const decoded = decodeJwt<typeof payload>(jwt + '.');
			expect(decoded).toEqual(payload);
		});
	});
});
