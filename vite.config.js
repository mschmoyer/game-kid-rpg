import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        port: 8080,
        open: true,
        proxy: {
            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true,
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    }
});
