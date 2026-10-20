import { resolve } from 'node:path'
import { OpenRouterBotSpeech, reasoningEffortOf } from './features/bots/infrastructure/OpenRouterBotSpeech'
import { OpenRouterContentClassifier } from './features/moderation/infrastructure/OpenRouterContentClassifier'
import { startServer } from './shared/infrastructure/startServer'

const openRouterKey = process.env.OPENROUTER_API_KEY
const webRoot = process.env.WEB_ROOT ? resolve(process.env.WEB_ROOT) : undefined

const server = await startServer({
  port: Number(process.env.PORT ?? 3001),
  webOrigin: process.env.WEB_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:5173',
  webRoot,
  adminToken: process.env.ADMIN_TOKEN,
  trustProxy: process.env.TRUST_PROXY === '1',
  ...(openRouterKey
    ? {
        botSpeech: new OpenRouterBotSpeech({
          apiKey: openRouterKey,
          model: process.env.OPENROUTER_MODEL,
          reasoningEffort: reasoningEffortOf(process.env.OPENROUTER_REASONING_EFFORT)
        }),
        classifier: new OpenRouterContentClassifier({ apiKey: openRouterKey, model: process.env.OPENROUTER_MODERATION_MODEL })
      }
    : {})
})

console.log(`Luna Llena server listening on port ${server.port}`)
console.log(openRouterKey ? 'Bots speak through OpenRouter' : 'Bots use scripted lines (no OPENROUTER_API_KEY)')
console.log(webRoot ? `Serving the web app from ${webRoot}` : 'Not serving the web app (no WEB_ROOT)')
console.log(process.env.ADMIN_TOKEN ? 'Moderation screen enabled at /admin' : 'Moderation screen disabled (no ADMIN_TOKEN)')
