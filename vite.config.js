import { defineConfig } from 'vite';
export default defineConfig({
  optimizeDeps: { noDiscovery: true, include: [] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: [
            'three',
            'three/addons/controls/OrbitControls.js',
            'three/addons/geometries/RoundedBoxGeometry.js',
          ],
        },
      },
    },
  },
});
