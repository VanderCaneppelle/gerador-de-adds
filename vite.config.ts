import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Necessário para garantir que as variáveis de ambiente estejam disponíveis
    'process.env': {}
  },
  server: {
    proxy: {
      '/ml-proxy': {
        target: 'https://www.mercadolivre.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ml-proxy/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    }
  }
})
