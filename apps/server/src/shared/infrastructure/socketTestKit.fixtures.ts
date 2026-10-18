import type { ClientToServerEvents, ServerToClientEvents } from '@luna/contracts'
import { io as connect, type Socket } from 'socket.io-client'
import { startServer, type RunningServer, type ServerOptions } from './startServer'

export type Client = Socket<ServerToClientEvents, ClientToServerEvents>

export const createSocketKit = () => {
  const clients: Client[] = []
  let running: RunningServer | undefined

  const start = async (options: Partial<ServerOptions> = {}): Promise<RunningServer> => {
    running = await startServer({ port: 0, webOrigin: '*', ...options })
    return running
  }

  const newClient = async (): Promise<Client> => {
    if (running === undefined) throw new Error('Start the server first')
    const client: Client = connect(`http://localhost:${running.port}`, { transports: ['websocket'], forceNew: true })
    clients.push(client)
    await new Promise<void>((resolve) => client.on('connect', () => resolve()))
    return client
  }

  const stop = async (): Promise<void> => {
    for (const client of clients.splice(0)) client.disconnect()
    await running?.close()
    running = undefined
  }

  return { start, newClient, stop }
}
