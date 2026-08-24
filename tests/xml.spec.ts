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

		it('should parse tag with attributes as merged properties', () => {
			const xml = '<user id="1" name="someone" />';
			const result = fromXml(xml);
			expect(result).toEqual({ user: { id: '1', name: 'someone' } });
		});

		it('should parse tag with text content', () => {
			const xml = '<email>someone@example.com</email>';
			const result = fromXml(xml);
			expect(result).toEqual({ email: 'someone@example.com' });
		});

		it('should parse tag with numeric content', () => {
			const xml = '<ttl>240</ttl>';
			const result = fromXml(xml);
			expect(result).toEqual({ ttl: 240 });
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

		it('should parse multiple children with same tag as array', () => {
			const xml = '<root><item>a</item><item>b</item><item>c</item></root>';
			const result = fromXml(xml);
			expect(result).toEqual({
				root: {
					item: ['a', 'b', 'c']
				}
			});
		});

		it('should parse mixed children', () => {
			const xml = '<root><a>1</a><b>2</b><c>3</c></root>';
			const result = fromXml(xml);
			expect(result.root).toEqual({ a: 1, b: 2, c: 3 });
		});

		it('should skip XML declaration and include as key', () => {
			const xml = '<?xml version="1.0"?><root />';
			const result = fromXml(xml);
			expect(result).toHaveProperty('?xml');
			expect(result).toHaveProperty('root');
		});

		it('should skip comments', () => {
			const xml = '<root><!-- comment --><child>text</child></root>';
			const result = fromXml(xml);
			expect(result).toEqual({
				root: {
					child: 'text'
				}
			});
		});

		it('should handle escaped characters', () => {
			const xml = '<text>&lt;hello&gt; &amp; &quot;world&quot;</text>';
			const result = fromXml(xml);
			expect(result.text).toBe('<hello> & "world"');
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
			expect(result).toEqual({
				root: {
					user: {
						id: '1',
						name: 'someone',
						email: 'someone@example.com',
						active: ''
					}
				}
			});
		});

		it('should parse RSS-like structure with multiple items', () => {
			const xml = `
                <rss>
                    <channel>
                        <title>Test Feed</title>
                        <item>
                            <title>Item 1</title>
                            <link>http://example.com/1</link>
                        </item>
                        <item>
                            <title>Item 2</title>
                            <link>http://example.com/2</link>
                        </item>
                    </channel>
                </rss>
            `;
			const result = fromXml(xml);
			expect(result.rss.channel.title).toBe('Test Feed');
			expect(Array.isArray(result.rss.channel.item)).toBe(true);
			expect(result.rss.channel.item.length).toBe(2);
			expect(result.rss.channel.item[0].title).toBe('Item 1');
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
		it('should parse toXml output back with attributes merged as properties', () => {
			const obj = {
				tag: 'root',
				attributes: { id: '1' },
				children: [
					{ tag: 'child', attributes: {}, children: ['text'] }
				]
			};
			const xml = toXml(obj);
			const parsed = fromXml(xml);
			expect(parsed).toEqual({
				root: {
					id: '1',
					child: 'text'
				}
			});
		});
	});
});
