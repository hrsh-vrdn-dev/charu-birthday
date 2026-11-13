import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three-vendor',
              test: /node_modules[\\/](three|@react-three|react-reconciler|scheduler|zustand|camera-controls|maath|troika-three-text|troika-three-utils|webgl-sdf-generator|bidi-js)[\\/]/,
              priority: 10,
              minSize: 50_000
            }
          ]
        }
      }
    }
  }
});
