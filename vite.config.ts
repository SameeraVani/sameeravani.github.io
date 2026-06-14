import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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

