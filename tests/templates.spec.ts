import {findTemplateVars, renderTemplate, TemplateError} from '../src';

describe('findTemplateVars', () => {
	test('extracts simple variables', () => {
		const result = findTemplateVars('Hello {{ name }}!');
		expect(result).toEqual({ name: '' });
	});

	test('extracts nested object paths', () => {
		const result = findTemplateVars('{{ user.name }} is {{ user.age }}');
		expect(result).toEqual({ user: { name: '', age: '' } });
	});

	test('extracts variables from if statements', () => {
		const result = findTemplateVars('{{ ? active }}{{ message }}{{ /? }}');
		expect(result).toEqual({ active: '', message: '' });
	});

	test('extracts variables from else-if conditions', () => {
		const result = findTemplateVars('{{ ? status == "paid" }}PAID{{ !? status == "pending" }}{{ value }}{{ /? }}');
		expect(result).toEqual({ status: '', value: '' });
	});

	test('extracts array reference from loops', () => {
		const result = findTemplateVars('{{ * item in items }}{{ item }}{{ /* }}');
		expect(result).toEqual({ items: [] });
	});

	test('excludes loop element variable', () => {
		const result = findTemplateVars('{{ * item in items }}{{ item.name }}{{ /* }}');
		expect(result).toEqual({ items: [] });
		expect(result).not.toHaveProperty('item');
	});

	test('excludes loop index variable', () => {
		const result = findTemplateVars('{{ * (item, i) in items }}{{ i }}:{{ item }}{{ /* }}');
		expect(result).toEqual({ items: [] });
		expect(result).not.toHaveProperty('item');
		expect(result).not.toHaveProperty('i');
	});

	test('extracts external vars used inside loops', () => {
		const result = findTemplateVars('{{ * item in items }}{{ item }}-{{ prefix }}{{ /* }}');
		expect(result).toEqual({ items: [], prefix: '' });
	});

	test('handles nested loops', () => {
		const result = findTemplateVars('{{ * row in rows }}{{ * col in row.cols }}{{ col }}{{ /* }}{{ /* }}');
		expect(result).toEqual({ rows: [] });
		expect(result).not.toHaveProperty('row');
		expect(result).not.toHaveProperty('col');
	});

	test('extracts from complex nested template', () => {
		const tpl = `
{{ ? items.length > 0 }}
{{ * (item, i) in items }}
{{ i }}. {{ item.name }}: {{ currency }}{{ item.price }}
{{ /* }}
Total: {{ total }}
{{ !? }}
{{ emptyMessage }}
{{ /? }}`;
		const result = findTemplateVars(tpl);
		expect(result).toEqual({
			items: [],
			currency: '',
			total: '',
			emptyMessage: ''
		});
		expect(result).not.toHaveProperty('item');
		expect(result).not.toHaveProperty('i');
	});

	test('ignores template control syntax', () => {
		const result = findTemplateVars('{{ < header.html }}{{ > layout.html:content }}content{{ /> }}');
		expect(result).toEqual({});
	});

	test('handles multiple variables in expressions', () => {
		const result = findTemplateVars('{{ firstName + " " + lastName }}');
		expect(result).toEqual({ firstName: '', lastName: '' });
	});

	test('creates arrays for loop variables', () => {
		const result = findTemplateVars('{{ * item in items }}{{ item }}{{ /* }}');
		expect(result).toEqual({ items: [] });
	});

	test('creates nested arrays', () => {
		const result = findTemplateVars('{{ * row in data.rows }}{{ row }}{{ /* }}');
		expect(result).toEqual({ data: { rows: [] } });
	});

	test('creates multiple arrays', () => {
		const result = findTemplateVars('{{ * user in users }}{{ user }}{{ /* }}{{ * post in posts }}{{ post }}{{ /* }}');
		expect(result).toEqual({ users: [], posts: [] });
	});

	test('excludes function calls', () => {
		const result = findTemplateVars('{{ value.toFixed(2) }}');
		expect(result).toEqual({ value: '' });
		expect(result.value).not.toBe('toFixed');
	});

	test('excludes method chains', () => {
		const result = findTemplateVars('{{ text.replaceAll("\\n", "<br>") }}');
		expect(result).toEqual({ text: '' });
	});

	test('handles mix of arrays and regular variables', () => {
		const result = findTemplateVars('{{ * item in cart }}{{ item.name }}{{ /* }}{{ total }}');
		expect(result).toEqual({ cart: [], total: '' });
	});

	test('real world template', async () => {
		const wrapper = `<div> {{body}} </div>`;
		const tpl = `
{{ > email:body }}
	<div style="text-align: center">
		{{ ? title }}<h1 style="margin: 0">{{ title }}</h1>{{ /? }}
		{{ ? subject }}<h2 style="margin: 0">{{ subject }}</h2>{{ /? }}
		{{ ? message }}<p style="margin-top: 1rem">{{ message }}</p>{{ /? }}
		{{ ? link }}
			<br>
			<div style="background: #dedede; padding: 8px 20px; border-radius: 10px; overflow-x: auto;">
				{{ ? link.startsWith('http') }}
					<a style="word-break: break-all;" target="_blank" href="{{ link }}">{{ link }}</a>
				{{ !? }}
					<p style="margin: 0; word-break: break-all;">{{ link }}</p>
				{{ /? }}
			</div>
		{{ /? }}
		{{ ? footer }}
			<br>
			<p>{{ footer }}</p>
		{{ /? }}
	</div>
{{ /> }}`;
		console.log(await renderTemplate(tpl, {
			title: 'test',
			subject: 'test',
			message: 'test',
			link: 'test',
			footer: 'test',
		}, async () => wrapper))
	});

	test('real world invoice template', () => {
		const tpl = `
{{ settings.title }}
{{ * (row, index) in transaction.cart }}
    {{ row.quantity }} x {{ row.name }} = \${{ row.cost.toFixed(2) }}
{{ /* }}
Total: \${{ transaction.total.toFixed(2) }}
{{ ? transaction.discount }}
    Discount: {{ transaction.discount.value }}
{{ /? }}
`;
		const result = findTemplateVars(tpl);
		expect(result).toEqual({
			settings: { title: '' },
			transaction: {
				cart: [],
				total: '',
				discount: { value: '' }
			}
		});
		expect(result).not.toHaveProperty('row');
		expect(result).not.toHaveProperty('index');
		expect(result.transaction.cart).toEqual([]);
	});
});

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
