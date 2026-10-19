import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'

export const tableRoutes: RouteRecordRaw[] = [
  { path: '/table/setup', name: 'table-setup', component: () => import('./views/TableSetupView.vue') },
  { path: '/table/deal', name: 'table-deal', component: () => import('./views/DealView.vue') },
  { path: '/table', name: 'table', component: () => import('./views/LogbookView.vue') },
  { path: '/table/stage', name: 'table-stage', component: () => import('./views/TableScreenView.vue') },
  { path: '/table/over', name: 'table-over', component: () => import('./views/TableOverView.vue') },
  { path: '/table/resume', name: 'table-resume', component: () => import('./views/TableResumeView.vue') }
]

const TABLE_ROUTE_NAMES = new Set(tableRoutes.map((route) => route.name))

export const isTableRoute = (route: Pick<RouteLocationNormalized, 'name'>): boolean => TABLE_ROUTE_NAMES.has(route.name)
