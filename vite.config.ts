import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'audio-upload',
      configureServer(server) {
        server.middlewares.use('/api/upload-audio', (req, res) => {
          if (req.method === 'POST') {
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const id = url.searchParams.get('id');
            if (!id) {
              res.statusCode = 400;
              res.end('Missing id');
              return;
            }

            const dir = path.resolve(__dirname, 'public/books/sanskrit-learner/practice/audio');
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            const filePath = path.join(dir, `${id}.webm`);
            const writeStream = fs.createWriteStream(filePath);
            
            req.pipe(writeStream);
            
            req.on('end', () => {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            });
            
            req.on('error', (err) => {
              console.error(err);
              res.statusCode = 500;
              res.end('Server error');
            });
          } else {
            res.statusCode = 405;
            res.end('Method not allowed');
          }
        });
      }
    }
  ],
  base: (() => {
    if (process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
      // If the repository is a user/org page (e.g., sameeravani/sameeravani.github.io), it's hosted at root '/'
      if (repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
        return '/';
      }
      // If it's a project page (e.g. rajeshgundurao/sameeravani.github.io), it's hosted at '/sameeravani.github.io/'
      return `/${repo}/`;
    }
    return '/';
  })(),
})

