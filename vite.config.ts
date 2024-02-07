import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(process.cwd(), 'src/index.ts'),
			name: 'js-utilities',
			fileName: (module, entryName) => {
				if(module == 'es') return 'js-utilities.mjs';
				if(module == 'umd') return 'js-utilities.js';
			}
		},
	},
	plugins: [dts()],
});
