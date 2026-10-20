import { createRouter, createWebHistory } from 'vue-router'
import { adminRoutes } from '@/features/admin/infrastructure/adminRoutes'
import { matchRoutes } from '@/features/match/infrastructure/matchRoutes'
import { roomRoutes } from '@/features/room/infrastructure/roomRoutes'
import { tableRoutes } from '@/features/table/infrastructure/tableRoutes'

export const createLunaRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [...roomRoutes, ...matchRoutes, ...tableRoutes, ...adminRoutes, { path: '/:unknown(.*)', redirect: { name: 'home' } }]
  })
