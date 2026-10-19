import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { useAtmosphereStore } from '@/features/atmosphere/application/useAtmosphereStore'
import { installAtmosphere } from '@/features/atmosphere/infrastructure/installAtmosphere'
import { installChat } from '@/features/chat/infrastructure/installChat'
import { installMatch } from '@/features/match/infrastructure/installMatch'
import { installRoom } from '@/features/room/infrastructure/installRoom'
import { installTable } from '@/features/table/infrastructure/installTable'
import { isTableRoute } from '@/features/table/infrastructure/tableRoutes'
import { createLunaI18n } from '@/shared/infrastructure/i18n/lunaI18n'
import { createLunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import '@/shared/infrastructure/ui/styles/design-system.css'
import '@/shared/infrastructure/ui/styles/app.css'
import App from './App.vue'
import { connectOnlineRoutes } from './connectOnlineRoutes'
import { lunaMessages } from './messages'
import { createLunaRouter } from './router'

const app = createApp(App)
const socket = createLunaSocket(import.meta.env.VITE_LUNA_SERVER_URL)

installRoom(app, socket)
installMatch(app, socket)
installChat(app, socket)
installAtmosphere(app, socket)
installTable(app)
app.use(createPinia())
const router = createLunaRouter()
connectOnlineRoutes(router, socket, isTableRoute)
app.use(router)
app.use(createLunaI18n(lunaMessages))
app.runWithContext(() => useAtmosphereStore())
app.mount('#app')
