import type { RouteRecordRaw } from 'vue-router'

export const matchRoutes: RouteRecordRaw[] = [
  { path: '/room/:code/game', name: 'game', component: () => import('./views/GameView.vue') }
]
