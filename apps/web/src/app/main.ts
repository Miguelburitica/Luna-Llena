import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { installRoom } from '@/features/room/infrastructure/installRoom'
import { createLunaI18n } from '@/shared/infrastructure/i18n/lunaI18n'
import { createLunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import '@/shared/infrastructure/ui/styles/design-system.css'
import '@/shared/infrastructure/ui/styles/app.css'
import App from './App.vue'
import { lunaMessages } from './messages'
import { createLunaRouter } from './router'

const app = createApp(App)
const socket = createLunaSocket(import.meta.env.VITE_LUNA_SERVER_URL)

installRoom(app, socket)
app.use(createPinia())
app.use(createLunaRouter())
app.use(createLunaI18n(lunaMessages))
app.mount('#app')
