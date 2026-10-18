import type { App } from 'vue'
import type { LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import { ATMOSPHERE_SETTINGS_STORE, CUE_GATEWAY, MOTION_PREFERENCE, SOUND_ENGINE } from '../application/ports'
import { DocumentMotionPreference } from './DocumentMotionPreference'
import { LocalAtmosphereSettingsStore } from './LocalAtmosphereSettingsStore'
import { SocketCueGateway } from './SocketCueGateway'
import { WebAudioSoundEngine } from './WebAudioSoundEngine'

export const installAtmosphere = (app: App, socket: LunaSocket): void => {
  app.provide(SOUND_ENGINE, new WebAudioSoundEngine())
  app.provide(ATMOSPHERE_SETTINGS_STORE, new LocalAtmosphereSettingsStore())
  app.provide(CUE_GATEWAY, new SocketCueGateway(socket))
  app.provide(MOTION_PREFERENCE, new DocumentMotionPreference())
}
