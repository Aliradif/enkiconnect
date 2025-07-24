import { defineConfig } from 'vite';

export default defineConfig({
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        categories: 'categories.html',
        profile: 'profile.html',
        chat: 'chat.html',
        'setup-company': 'setup-company.html',
        'setup-friends': 'setup-friends.html', 
        'setup-family': 'setup-family.html',
        'setup-world': 'setup-world.html'
      }
    }
  },
  
  // Development server
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // Preview server (for testing builds)
  preview: {
    port: 3001,
    open: true
  }
}); 