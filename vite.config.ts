import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// HTTPS=1 serves over the self-signed cert from `npm run cert` (LAN testing on phones).
const https = process.env.HTTPS
  ? { key: readFileSync('.cert/key.pem'), cert: readFileSync('.cert/cert.pem') }
  : undefined

export default defineConfig({ plugins: [react(), tailwindcss()], server: { https }, preview: { https } })
