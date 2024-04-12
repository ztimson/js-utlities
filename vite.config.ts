import {resolve} from 'path';
import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(process.cwd(), 'src/index.ts'),
			name: 'utils',
			fileName: (module, entryName) => {
				if(module == 'es') return 'utils.mjs';
				if(module == 'umd') return 'utils.cjs';
			}
		},
		emptyOutDir: true,
		minify: true,
		sourcemap: true
	},
	plugins: [dts()],
});
