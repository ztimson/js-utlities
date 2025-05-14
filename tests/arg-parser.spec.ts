import { Arg, ArgParser } from '../src';

describe('ArgParser', () => {
	const basicArgs: Arg[] = [
		{ name: 'input', desc: 'Input file' },
		{ name: 'output', desc: 'Output file', default: 'out.txt' },
		{ name: 'verbose', desc: 'Enable verbose mode', flags: ['-v', '--verbose'], default: false }
	];

	const commandArg = new ArgParser(
		'subcmd',
		'A sub command',
		[{ name: 'foo', desc: 'Foo argument', optional: false }]
	);

	describe('constructor', () => {
		it('should add commands and update examples', () => {
			const parser = new ArgParser('main', 'desc', [commandArg, ...basicArgs], ['custom-example']);
			expect(parser.commands[0].name).toBe('subcmd');
			expect(parser.examples.some(e => typeof e === 'string' && e.includes('[OPTIONS] COMMAND'))).toBe(true);
			expect(parser.examples).toEqual(expect.arrayContaining([
				'custom-example',
				expect.stringContaining('[OPTIONS]')
			]));
		});
	});

	describe('parse', () => {
		it('should parse args and flags', () => {
			const parser = new ArgParser('mycmd', 'desc', basicArgs);
			const result = parser.parse(['file1.txt', '-v']);
			expect(result.input).toBe('file1.txt');
			expect(result.output).toBe('out.txt');
			expect(result.verbose).toBe(true);
			expect(result._extra).toEqual([]);
		});

		it('should handle missing required args and collect errors', () => {
			const parser = new ArgParser('mycmd', 'desc', basicArgs);
			const result = parser.parse([]);
			expect(result._error).toContain('Argument missing: INPUT');
		});

		it('should handle default values correctly', () => {
			const parser = new ArgParser('mycmd', 'desc', basicArgs);
			const result = parser.parse(['file1.txt']);
			expect(result.output).toBe('out.txt');
			expect(result.verbose).toBe(false);
		});

		it('should parse flags with value assignment', () => {
			const args: Arg[] = [
				{ name: 'mode', desc: 'Mode', flags: ['-m', '--mode'], default: 'defaultMode' }
			];
			const parser = new ArgParser('mycmd', 'desc', args);
			const result = parser.parse(['--mode=prod']);
			expect(result.mode).toBe('prod');
		});

		it('should support extras collection', () => {
			const args: Arg[] = [
				{ name: 'main', desc: 'main', extras: true }
			];
			const parser = new ArgParser('cmd', 'desc', args);
			const result = parser.parse(['a', 'b', 'c']);
			expect(result.main).toEqual(['a', 'b', 'c']);
		});

		it('should handle unknown flags and put them to extras', () => {
			const parser = new ArgParser('mycmd', 'desc', basicArgs);
			const result = parser.parse(['file.txt', 'test', '--unknown']);
			expect(result._extra).toContain('--unknown');
		});

		it('should handle subcommands and delegate parsing', () => {
			const mainParser = new ArgParser('main', 'desc', [commandArg]);
			const result = mainParser.parse(['subcmd', 'fooVal']);
			expect(result._command).toBe('subcmd');
			expect(result.foo).toBe('fooVal');
		});

		it('should parse combined short flags', () => {
			const args: Arg[] = [
				{ name: 'a', desc: 'Flag A', flags: ['-a'], default: false },
				{ name: 'b', desc: 'Flag B', flags: ['-b'], default: false }
			];
			const parser = new ArgParser('mycmd', 'desc', args);
			const result = parser.parse(['-ab']);
			expect(result.a).toBe(true);
			expect(result.b).toBe(true);
		});
	});

	describe('help', () => {
		it('should generate help with options and args', () => {
			const parser = new ArgParser('mycmd', 'desc', basicArgs);
			const helpMsg = parser.help();
			expect(helpMsg).toContain('Input file');
			expect(helpMsg).toContain('Enable verbose mode');
			expect(helpMsg).toContain('-h, --help');
		});

		it('should generate help for a subcommand', () => {
			const mainParser = new ArgParser('main', 'desc', [commandArg]);
			const helpMsg = mainParser.help({ command: 'subcmd' });
			expect(helpMsg).toContain('Foo argument');
		});

		it('should throw error for non-existent command', () => {
			const mainParser = new ArgParser('main', 'desc', [commandArg]);
			expect(() => mainParser.help({ command: 'notreal' })).toThrow();
		});

		it('should allow custom message override', () => {
			const parser = new ArgParser('mycmd', 'desc', basicArgs);
			const helpMsg = parser.help({ message: 'Custom!' });
			expect(helpMsg).toContain('Custom!');
			expect(helpMsg).not.toContain('desc');
		});
	});
});
