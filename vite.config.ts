import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(process.cwd(), 'src/index.ts'),
			name: 'momentum',
			fileName: (module, entryName) => {
				if(module == 'es') return 'utilities.mjs';
				if(module == 'umd') return 'utilities.js';
			}
		},
	},
	plugins: [dts()],
});
