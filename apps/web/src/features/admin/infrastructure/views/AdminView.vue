<script setup lang="ts">
import { CLIENT_KEY_KINDS, type ClientKeyKind } from '@luna/contracts'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DeskHeader from '@/shared/infrastructure/ui/components/DeskHeader.vue'
import LunaIcon from '@/shared/infrastructure/ui/components/LunaIcon.vue'
import LunaSegmented from '@/shared/infrastructure/ui/components/LunaSegmented.vue'
import { useAdminStore } from '../../application/useAdminStore'
import { BAN_HOUR_CHOICES, soonestEndingFirst } from '../../domain/banChoices'

const { t, locale } = useI18n()
const admin = useAdminStore()
const token = ref('')
const banKind = ref<ClientKeyKind>('device')
const banValue = ref('')
const banHours = ref<number>(24)

const timeOf = (at: number) => new Date(at).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' })
const kindOptions = computed(() => CLIENT_KEY_KINDS.map((kind) => ({ value: kind, label: t(`admin.kinds.${kind}`) })))
const hourOptions = computed(() => BAN_HOUR_CHOICES.map((hours) => ({ value: hours as number, label: t('admin.hourChoices', { count: hours }) })))
const bans = computed(() => soonestEndingFirst(admin.overview?.bans ?? []))

onMounted(() => {
  void admin.load()
})

const signIn = async () => {
  const entered = token.value
  token.value = ''
  if (entered.trim() !== '') await admin.signIn(entered)
}

const ban = async () => {
  const result = await admin.ban({ kind: banKind.value, value: banValue.value.trim() }, banHours.value)
  if (result.ok) banValue.value = ''
}
</script>

<template>
  <div class="desk ph-night admin">
    <DeskHeader :trail="t('admin.trail')">
      <template v-if="admin.signedIn">
        <span v-if="admin.expiresAt" class="t-small t-muted">{{ t('admin.sessionUntil', { time: timeOf(admin.expiresAt) }) }}</span>
        <button type="button" class="btn btn-secondary btn-sm" :disabled="admin.pending" @click="admin.refresh()">
          <LunaIcon name="refresh" size="sm" />{{ t('admin.refresh') }}
        </button>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="admin.pending" @click="admin.signOut()">
          <LunaIcon name="logout" size="sm" />{{ t('admin.signOut') }}
        </button>
      </template>
    </DeskHeader>

    <main class="admin-body">
      <span v-if="admin.failure" class="err" role="alert">
        <LunaIcon name="info" size="sm" />{{ t(`admin.errors.${admin.failure.code}`) }}
      </span>

      <form v-if="admin.checked && !admin.signedIn && admin.failure?.code !== 'admin-disabled'" class="panel admin-sign-in" @submit.prevent="signIn">
        <div class="panel-h"><h1 class="h3">{{ t('admin.signInTitle') }}</h1></div>
        <p class="t-small t-muted">{{ t('admin.signInHint') }}</p>
        <label class="field">
          <span class="label">{{ t('admin.token') }}</span>
          <input v-model="token" class="input" type="password" autocomplete="off" maxlength="512">
        </label>
        <button type="submit" class="btn btn-primary" :disabled="admin.pending || token.trim() === ''">
          <LunaIcon name="lock" />{{ t('admin.signIn') }}
        </button>
      </form>

      <template v-if="admin.signedIn && admin.overview">
        <h1 class="h1 admin-title">{{ t('admin.title') }}</h1>
        <div class="admin-columns">
          <section class="panel">
            <div class="panel-h"><h2 class="h3">{{ t('admin.bans') }}</h2></div>
            <p v-if="bans.length === 0" class="t-small t-muted">{{ t('admin.noBans') }}</p>
            <ul class="admin-rows">
              <li v-for="entry in bans" :key="`${entry.key.kind}:${entry.key.value}`" class="prow admin-row">
                <LunaIcon :name="entry.key.kind === 'device' ? 'phone' : 'globe'" />
                <div>
                  <b class="admin-key">{{ entry.key.value }}</b>
                  <div class="t-small t-muted">
                    {{ t(`admin.kinds.${entry.key.kind}`) }} · {{ t(`admin.sources.${entry.source}`) }} · {{ t('admin.until', { time: timeOf(entry.until) }) }}
                  </div>
                </div>
                <span />
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  :aria-label="t('admin.liftLabel', { value: entry.key.value })"
                  :disabled="admin.pending"
                  @click="admin.unban(entry.key)"
                >
                  {{ t('admin.lift') }}
                </button>
              </li>
            </ul>
            <form class="admin-ban" @submit.prevent="ban">
              <h3 class="h3">{{ t('admin.banTitle') }}</h3>
              <div class="row-set">
                <span class="label">{{ t('admin.kind') }}</span>
                <LunaSegmented v-model="banKind" :options="kindOptions" :label="t('admin.kind')" />
              </div>
              <label class="field">
                <span class="label">{{ t('admin.value') }}</span>
                <input v-model="banValue" class="input admin-ban-value" autocomplete="off" maxlength="128">
              </label>
              <div class="row-set">
                <span class="label">{{ t('admin.hours') }}</span>
                <LunaSegmented v-model="banHours" :options="hourOptions" :label="t('admin.hours')" />
              </div>
              <button type="submit" class="btn btn-danger" :disabled="admin.pending || banValue.trim() === ''">
                <LunaIcon name="user-x" />{{ t('admin.ban') }}
              </button>
            </form>
          </section>

          <section class="panel">
            <div class="panel-h"><h2 class="h3">{{ t('admin.rooms') }}</h2></div>
            <p v-if="admin.overview.rooms.length === 0" class="t-small t-muted">{{ t('admin.noRooms') }}</p>
            <ul class="admin-rows">
              <li v-for="room in admin.overview.rooms" :key="room.code" class="prow admin-row">
                <span class="sbadge">{{ room.code }}</span>
                <div>
                  <b>{{ room.name }}</b>
                  <div class="t-small t-muted">
                    {{ room.narratorName }} · {{ t(`admin.visibilities.${room.visibility}`) }} · {{ t('admin.reportCount', { count: room.reports }) }}
                  </div>
                </div>
                <span v-if="room.hidden" class="sbadge is-warn">{{ t('admin.hidden') }}</span>
                <span v-else />
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  :aria-label="t('admin.closeLabel', { name: room.name })"
                  :disabled="admin.pending"
                  @click="admin.closeRoom(room.code)"
                >
                  {{ t('admin.close') }}
                </button>
              </li>
            </ul>
          </section>

          <section class="panel">
            <div class="panel-h"><h2 class="h3">{{ t('admin.strikes') }}</h2></div>
            <p v-if="admin.overview.strikes.length === 0" class="t-small t-muted">{{ t('admin.noStrikes') }}</p>
            <ul class="admin-rows">
              <li v-for="(strike, index) in admin.overview.strikes" :key="index" class="admin-line">
                <b>{{ t(`admin.reasons.${strike.reason}`) }}</b>
                <span class="t-small t-muted">{{ strike.device }} · {{ strike.address }} · {{ strike.roomCode ?? '—' }} · {{ timeOf(strike.at) }}</span>
                <q v-if="strike.excerpt" class="t-small admin-excerpt">{{ strike.excerpt }}</q>
              </li>
            </ul>
          </section>

          <section class="panel">
            <div class="panel-h"><h2 class="h3">{{ t('admin.reports') }}</h2></div>
            <p v-if="admin.overview.reports.length === 0" class="t-small t-muted">{{ t('admin.noReports') }}</p>
            <ul class="admin-rows">
              <li v-for="(report, index) in admin.overview.reports" :key="index" class="admin-line">
                <b>{{ report.roomName }}</b>
                <span class="t-small t-muted">{{ report.roomCode }} · {{ report.address }} · {{ timeOf(report.at) }}</span>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.admin {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.admin-body {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-title {
  font-size: 44px;
}

.admin-sign-in {
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-sign-in p {
  margin: 0;
}

.admin-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  gap: 24px;
  align-items: start;
}

.admin-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.admin-row {
  grid-template-columns: auto minmax(0, 1fr) auto auto;
}

.admin-key {
  word-break: break-all;
}

.admin-line {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.045);
}

.admin-excerpt {
  font-style: italic;
  word-break: break-word;
}

.admin-ban {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 640px) {
  .admin-body {
    padding: 16px;
  }
}
</style>
