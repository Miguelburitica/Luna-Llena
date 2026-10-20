import type { RouteRecordRaw } from 'vue-router'

export const roomRoutes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/join/:code?', name: 'join', component: () => import('./views/JoinView.vue') },
  { path: '/games', name: 'public-games', component: () => import('./views/PublicGamesView.vue') },
  { path: '/host', name: 'host', component: () => import('./views/RoomSetupView.vue') },
  { path: '/room/:code', name: 'lobby', component: () => import('./views/LobbyView.vue') },
  { path: '/room/:code/settings', name: 'room-settings', component: () => import('./views/RoomSetupView.vue') }
]
