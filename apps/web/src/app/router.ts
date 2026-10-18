import { createRouter, createWebHistory } from 'vue-router'
import { roomRoutes } from '@/features/room/infrastructure/roomRoutes'

export const createLunaRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [...roomRoutes, { path: '/:unknown(.*)', redirect: { name: 'home' } }]
  })
