import { startServer } from './shared/infrastructure/startServer'

const server = await startServer({
  port: Number(process.env.PORT ?? 3001),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173'
})

console.log(`Luna Llena server listening on port ${server.port}`)
