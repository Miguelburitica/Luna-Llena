import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { lunaMessages } from '@/app/messages'
import { createLunaI18n } from '@/shared/infrastructure/i18n/lunaI18n'
import { FakeAdminGateway } from '../application/AdminGateway.fixtures'
import { ADMIN_GATEWAY } from '../application/ports'
import { adminRoutes } from './adminRoutes'

export const mountAdminView = async (
  component: Component,
  { signedIn = false, disabled = false }: { readonly signedIn?: boolean; readonly disabled?: boolean } = {}
) => {
  const gateway = new FakeAdminGateway()
  gateway.disabled = disabled
  if (signedIn) gateway.session = { signedIn: true, expiresAt: Date.UTC(2026, 9, 20, 20) }
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: [...adminRoutes, { path: '/', name: 'home', component: { render: () => null } }] })
  await router.push('/admin')
  await router.isReady()
  const wrapper = mount(component, {
    global: { plugins: [pinia, router, createLunaI18n(lunaMessages, 'en')], provide: { [ADMIN_GATEWAY as symbol]: gateway } }
  })
  await flushPromises()
  return { wrapper, gateway }
}
