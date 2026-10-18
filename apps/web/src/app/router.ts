import { createRouter, createWebHistory } from 'vue-router'
import { matchRoutes } from '@/features/match/infrastructure/matchRoutes'
import { roomRoutes } from '@/features/room/infrastructure/roomRoutes'

export const createLunaRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [...roomRoutes, ...matchRoutes, { path: '/:unknown(.*)', redirect: { name: 'home' } }]
  })
