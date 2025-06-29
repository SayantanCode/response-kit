import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ResponseKit',
      formats: ['es', 'cjs'],
      fileName: (format) =>
        format === 'es' ? 'index.es.js' : 'index.cjs.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['express'],
    },
  },
  plugins: [
    dts({
      outDir: 'dist/types',
      include: ['src'], // optional but helpful
    }),
  ],
});
