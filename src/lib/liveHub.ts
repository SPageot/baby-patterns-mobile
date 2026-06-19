import * as signalR from '@microsoft/signalr'
import { getApiBaseUrl } from '@/api/config'
import { getAccessToken } from '@/lib/authSession'

type LiveEventHandler = (payload: unknown) => void

const listeners = new Map<string, Set<LiveEventHandler>>()

let connection: signalR.HubConnection | null = null
let startPromise: Promise<void> | null = null

function dispatch(event: string, payload: unknown): void {
  listeners.get(event)?.forEach((handler) => handler(payload))
}

function wireConnectionHandlers(hub: signalR.HubConnection): void {
  hub.on('notificationsUpdated', (payload) => dispatch('notificationsUpdated', payload))
  hub.on('feedPostCreated', (payload) => dispatch('feedPostCreated', payload))
}

export function subscribeLiveEvent(event: string, handler: LiveEventHandler): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event)!.add(handler)
  return () => listeners.get(event)?.delete(handler)
}

export async function ensureLiveConnection(): Promise<void> {
  const base = getApiBaseUrl()
  const token = getAccessToken()
  if (!base || !token) return

  if (connection?.state === signalR.HubConnectionState.Connected) return

  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${base}/hubs/live`, {
        accessTokenFactory: () => getAccessToken() ?? '',
      })
      .withAutomaticReconnect()
      .build()
    wireConnectionHandlers(connection)
  }

  if (connection.state === signalR.HubConnectionState.Disconnected) {
    if (!startPromise) {
      startPromise = connection.start().finally(() => {
        startPromise = null
      })
    }
    await startPromise
  }
}

export async function stopLiveConnection(): Promise<void> {
  if (!connection) return
  await connection.stop()
  connection = null
  startPromise = null
}
