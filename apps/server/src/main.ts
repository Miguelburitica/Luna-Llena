import { OpenRouterBotSpeech } from './features/bots/infrastructure/OpenRouterBotSpeech'
import { startServer } from './shared/infrastructure/startServer'

const openRouterKey = process.env.OPENROUTER_API_KEY

const server = await startServer({
  port: Number(process.env.PORT ?? 3001),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  ...(openRouterKey ? { botSpeech: new OpenRouterBotSpeech({ apiKey: openRouterKey, model: process.env.OPENROUTER_MODEL }) } : {})
})

console.log(`Luna Llena server listening on port ${server.port}`)
console.log(openRouterKey ? 'Bots speak through OpenRouter' : 'Bots use scripted lines (no OPENROUTER_API_KEY)')
