import { renderTemplate, TemplateError } from '../src';

describe('renderTemplate', () => {
	test('basic variable interpolation', async () => {
		const result = await renderTemplate('Hello {{ name }}!', { name: 'World' });
		expect(result).toBe('Hello World!');
	});

	test('nested object access', async () => {
		const result = await renderTemplate('{{ user.name }} is {{ user.age }}', {
			user: { name: 'Alice', age: 25 }
		});
		expect(result).toBe('Alice is 25');
	});

	test('method calls', async () => {
		const result = await renderTemplate('{{ price.toFixed(2) }}', { price: 9.5 });
		expect(result).toBe('9.50');
	});

	test('if statement true', async () => {
		const result = await renderTemplate('{{ ? active }}YES{{ /? }}', { active: true });
		expect(result).toBe('YES');
	});

	test('if statement false', async () => {
		const result = await renderTemplate('{{ ? active }}YES{{ /? }}', { active: false });
		expect(result).toBe('');
	});

	test('if-else', async () => {
		const result = await renderTemplate('{{ ? active }}YES{{ !? }}NO{{ /? }}', { active: false });
		expect(result).toBe('NO');
	});

	test('if-elseif-else', async () => {
		const tpl = '{{ ? status == "paid" }}PAID{{ !? status == "pending" }}PENDING{{ !? }}OTHER{{ /? }}';
		expect(await renderTemplate(tpl, { status: 'paid' })).toBe('PAID');
		expect(await renderTemplate(tpl, { status: 'pending' })).toBe('PENDING');
		expect(await renderTemplate(tpl, { status: 'failed' })).toBe('OTHER');
	});

	test('nested if statements', async () => {
		const tpl = '{{ ? a }}A{{ ? b }}B{{ /? }}{{ /? }}';
		expect(await renderTemplate(tpl, { a: true, b: true })).toBe('AB');
		expect(await renderTemplate(tpl, { a: true, b: false })).toBe('A');
		expect(await renderTemplate(tpl, { a: false, b: true })).toBe('');
	});

	test('for loop', async () => {
		const tpl = '{{ * item in items }}{{ item }}{{ /* }}';
		const result = await renderTemplate(tpl, { items: ['a', 'b', 'c'] });
		expect(result).toBe('a\nb\nc');
	});

	test('for loop with index', async () => {
		const tpl = '{{ * (item, i) in items }}{{ i }}:{{ item }}{{ /* }}';
		const result = await renderTemplate(tpl, { items: ['a', 'b'] });
		expect(result).toBe('0:a\n1:b');
	});

	test('for loop with objects', async () => {
		const tpl = '{{ * user in users }}{{ user.name }}{{ /* }}';
		const result = await renderTemplate(tpl, {
			users: [{ name: 'Alice' }, { name: 'Bob' }]
		});
		expect(result).toBe('Alice\nBob');
	});

	test('for loop error on non-array', async () => {
		await expect(
			renderTemplate('{{ * x in notArray }}{{ x }}{{ /* }}', { notArray: 'string' })
		).rejects.toThrow(TemplateError);
	});

	test('import template', async () => {
		const fetch = async (file: string) => {
			if (file === 'header.html') return 'HEADER: {{ title }}';
			throw new Error('Not found');
		};
		const result = await renderTemplate('{{ < header.html }}', { title: 'Test' }, fetch);
		expect(result).toBe('HEADER: Test');
	});

	test('import template error', async () => {
		await expect(
			renderTemplate('{{ < missing.html }}', {})
		).rejects.toThrow(TemplateError);
	});

	test('extend template', async () => {
		const fetch = async (file: string) => {
			if (file === 'layout.html') return '<div>{{ content }}</div>';
			throw new Error('Not found');
		};
		const result = await renderTemplate('{{ > layout.html:content }}Hello{{ /> }}', {}, fetch);
		expect(result).toBe('<div>Hello</div>');
	});

	test('date object', async () => {
		const result = await renderTemplate('{{ date.year }}', {});
		expect(result).toBe(new Date().getFullYear().toString());
	});

	test('evaluation error', async () => {
		await expect(
			renderTemplate('{{ undefined.property }}', {})
		).rejects.toThrow(TemplateError);
	});

	test('complex nested example', async () => {
		const tpl = `
{{ ? items.length > 0 }}
{{ * (item, i) in items }}
{{ i + 1 }}. {{ item.name }}: \${{ item.price.toFixed(2) }}
{{ /* }}
Total: \${{ total.toFixed(2) }}
{{ !? }}
No items
{{ /? }}`;
		const result = await renderTemplate(tpl, {
			items: [
				{ name: 'A', price: 10 },
				{ name: 'B', price: 20 }
			],
			total: 30
		});
		expect(result.trim()).toContain('1. A: $10.00');
		expect(result.trim()).toContain('2. B: $20.00');
		expect(result.trim()).toContain('Total: $30.00');
	});
});
