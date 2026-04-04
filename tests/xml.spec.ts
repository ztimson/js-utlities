import { toXml, fromXml } from '../src';

describe('XML Parser', () => {
	describe('fromXml', () => {
		it('should parse simple tag', () => {
			const xml = '<root></root>';
			const result = fromXml(xml);
			expect(result).toEqual({ root: '' });
		});

		it('should parse self-closing tag', () => {
			const xml = '<item />';
			const result = fromXml(xml);
			expect(result).toEqual({ item: '' });
		});

		it('should parse tag with attributes', () => {
			const xml = '<user id="1" name="someone" />';
			const result = fromXml(xml);
			expect(result).toEqual({
				user: { '@_id': '1', '@_name': 'someone' }
			});
		});

		it('should parse tag with text content', () => {
			const xml = '<email>someone@example.com</email>';
			const result = fromXml(xml);
			expect(result).toEqual({
				email: 'someone@example.com'
			});
		});

		it('should parse nested tags', () => {
			const xml = '<root><child>text</child></root>';
			const result = fromXml(xml);
			expect(result).toEqual({
				root: {
					child: 'text'
				}
			});
		});

		it('should parse multiple children', () => {
			const xml = '<root><a /><b /><c /></root>';
			const result = fromXml(xml);
			expect(result.root.a).toBe('');
			expect(result.root.b).toBe('');
			expect(result.root.c).toBe('');
		});

		it('should parse repeated tags as arrays', () => {
			const xml = '<root><item>1</item><item>2</item><item>3</item></root>';
			const result = fromXml(xml);
			expect(result).toEqual({
				root: {
					item: ['1', '2', '3']
				}
			});
		});

		it('should skip XML declaration', () => {
			const xml = '<?xml version="1.0"?><root />';
			const result = fromXml(xml);
			expect(result.root).toBe('');
		});

		it('should skip comments', () => {
			const xml = '<root><!-- comment --><child /></root>';
			const result = fromXml(xml);
			expect(result).toEqual({
				root: { child: '' }
			});
		});

		it('should handle escaped characters', () => {
			const xml = '<text>&lt;hello&gt; &amp; &quot;world&quot;</text>';
			const result = fromXml(xml);
			expect(result.text).toBe('<hello> & "world"');
		});

		it('should parse tag with attributes and text', () => {
			const xml = '<user id="1">John</user>';
			const result = fromXml(xml);
			expect(result).toEqual({
				user: {
					'@_id': '1',
					'#text': 'John'
				}
			});
		});

		it('should parse complex nested structure', () => {
			const xml = `
      <root>
        <user id="1" name="someone">
          <email>someone@example.com</email>
          <active />
        </user>
      </root>
    `;
			const result = fromXml(xml);
			expect(result.root.user['@_id']).toBe('1');
			expect(result.root.user['@_name']).toBe('someone');
			expect(result.root.user.email).toBe('someone@example.com');
			expect(result.root.user.active).toBe('');
		});
	});

	describe('toXml', () => {
		it('should encode simple tag', () => {
			const obj = { tag: 'root', attributes: {}, children: [] };
			expect(toXml(obj)).toBe('<root />');
		});

		it('should encode tag with attributes', () => {
			const obj = { tag: 'user', attributes: { id: '1', name: 'someone' }, children: [] };
			const result = toXml(obj);
			expect(result).toContain('id="1"');
			expect(result).toContain('name="someone"');
		});

		it('should encode tag with text content', () => {
			const obj = { tag: 'email', attributes: {}, children: ['someone@example.com'] };
			expect(toXml(obj)).toBe('<email>someone@example.com</email>');
		});

		it('should encode nested tags with indentation', () => {
			const obj = {
				tag: 'root',
				attributes: {},
				children: [
					{ tag: 'child', attributes: {}, children: ['text'] }
				]
			};
			const result = toXml(obj);
			expect(result).toContain('<root>');
			expect(result).toContain('  <child>');
			expect(result).toContain('</root>');
		});

		it('should escape special characters', () => {
			const obj = { tag: 'text', attributes: {}, children: ['<hello> & "world"'] };
			const result = toXml(obj);
			expect(result).toContain('&lt;hello&gt; &amp; &quot;world&quot;');
		});

		it('should escape attributes', () => {
			const obj = { tag: 'node', attributes: { attr: 'a & b' }, children: [] };
			const result = toXml(obj);
			expect(result).toContain('attr="a &amp; b"');
		});

		it('should handle multiple children', () => {
			const obj = {
				tag: 'root',
				attributes: {},
				children: [
					{ tag: 'a', attributes: {}, children: [] },
					{ tag: 'b', attributes: {}, children: [] }
				]
			};
			const result = toXml(obj);
			expect(result).toContain('<a />');
			expect(result).toContain('<b />');
		});

		it('should encode string directly', () => {
			expect(toXml('hello')).toBe('hello');
			expect(toXml('a & b')).toBe('a &amp; b');
		});
	});

	describe('round-trip', () => {
		it('should encode and decode to same structure', () => {
			const obj = {
				tag: 'root',
				attributes: { id: '1' },
				children: [
					{ tag: 'child', attributes: {}, children: ['text'] }
				]
			};
			const xml = toXml(obj);
			const parsed = fromXml(xml);
			expect(parsed).toEqual(obj);
		});
	});
});
