import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ plugins: [react(), {
  name: 'reload-world-timeline',
  handleHotUpdate({ file, server }) {
    // These singleton modules are captured by the mounted scroll and render loops.
    if (/World(State|Timeline)\.ts$/.test(file)) {
      server.ws.send({ type: 'full-reload' })
      return []
    }
  },
}] })
