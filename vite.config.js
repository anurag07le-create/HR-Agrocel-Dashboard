import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api/linkedin/oauth': {
                target: 'https://www.linkedin.com/oauth/v2',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/linkedin\/oauth/, ''),
            },
            '/api/linkedin/api': {
                target: 'https://api.linkedin.com/v2',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/linkedin\/api/, ''),
            },
            '/s3-images': {
                target: 'https://pucholive.s3.ap-south-1.amazonaws.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/s3-images/, ''),
            },
            '/linkedin-upload': {
                target: 'https://www.linkedin.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/linkedin-upload/, ''),
            },
            '/google-drive': {
                target: 'https://drive.google.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/google-drive/, ''),
            },
            '/pucho-files': {
                target: 'https://studio.pucho.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/pucho-files/, ''),
            },
            '/studio-api': {
                target: 'https://studio.pucho.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/studio-api/, ''),
            },
        },
    },
})
