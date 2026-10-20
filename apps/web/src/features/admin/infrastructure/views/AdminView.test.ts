import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { mountAdminView } from '../mountAdminView.fixtures'
import AdminView from './AdminView.vue'

describe('AdminView', () => {
  it('asks for the token, signs in and clears the field', async () => {
    const { wrapper, gateway } = await mountAdminView(AdminView)
    expect(wrapper.text()).toContain('Operator sign-in')
    const field = wrapper.find('input[type="password"]')
    await field.setValue('luna-operator-secret')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(gateway.calls.find((call) => call.command === 'signIn')?.input).toBe('luna-operator-secret')
    expect(wrapper.find('input[type="password"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Active bans')
    expect(wrapper.text()).toContain('device-tato')
  })

  it('hides the sign-in form when the server has no admin token', async () => {
    const { wrapper } = await mountAdminView(AdminView, { disabled: true })
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('.err').text()).toBe('The moderation screen is turned off on this server.')
  })

  it('says when the token is wrong', async () => {
    const { wrapper } = await mountAdminView(AdminView)
    await wrapper.find('input[type="password"]').setValue('nope')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.err').text()).toBe('That token is not valid, or your session ended.')
    expect((wrapper.find('input[type="password"]').element as HTMLInputElement).value).toBe('')
  })

  it('shows bans, strikes, reports and rooms once signed in', async () => {
    const { wrapper } = await mountAdminView(AdminView, { signedIn: true })
    expect(wrapper.text()).toContain('Message flagged')
    expect(wrapper.text()).toContain('algo feo')
    expect(wrapper.text()).toContain('Sala de spam')
    expect(wrapper.text()).toContain('Hidden')
  })

  it('lifts a ban, bans by hand and closes a room', async () => {
    const { wrapper, gateway } = await mountAdminView(AdminView, { signedIn: true })
    await wrapper.find('[aria-label="Lift the ban on device-tato"]').trigger('click')
    await flushPromises()
    expect(gateway.calls.find((call) => call.command === 'unban')?.input).toEqual({ kind: 'device', value: 'device-tato' })
    await wrapper.findAll('[role="radio"]').find((radio) => radio.text() === 'Address')?.trigger('click')
    await wrapper.findAll('[role="radio"]').find((radio) => radio.text() === '48 h')?.trigger('click')
    await wrapper.find('.admin-ban-value').setValue('10.0.0.7')
    await wrapper.find('.admin-ban').trigger('submit')
    await flushPromises()
    expect(gateway.calls.find((call) => call.command === 'ban')?.input).toEqual({ kind: 'address', value: '10.0.0.7', hours: 48 })
    await wrapper.find('[aria-label="Close room Sala de spam"]').trigger('click')
    await flushPromises()
    expect(gateway.calls.find((call) => call.command === 'closeRoom')?.input).toBe('SPAM42')
  })

  it('signs out and drops the overview', async () => {
    const { wrapper, gateway } = await mountAdminView(AdminView, { signedIn: true })
    await wrapper.findAll('button').find((button) => button.text() === 'Sign out')?.trigger('click')
    await flushPromises()
    expect(gateway.commands()).toContain('signOut')
    expect(wrapper.text()).toContain('Operator sign-in')
  })
})
