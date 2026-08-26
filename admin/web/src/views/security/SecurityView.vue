<template>
  <AppPage eyebrow="Account protection" title="Secure your administrator account" description="Multi-factor authentication is required before privileged workspace access is granted.">
    <AppCard v-if="auth.user?.mfaEnabled" class="max-w-2xl p-6">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success"><ShieldCheck class="h-5 w-5" /></div>
        <div><h2 class="text-sm font-semibold text-ink">Multi-factor authentication is active</h2><p class="mt-1 text-sm text-ink-muted">Your account requires a verification code at sign-in.</p></div>
      </div>
      <AppButton class="mt-5" size="sm" @click="$router.push('/choose-workspace')">Continue to workspace</AppButton>
    </AppCard>

    <AppCard v-else class="max-w-2xl p-6">
      <div v-if="!setup" class="space-y-4">
        <h2 class="text-sm font-semibold text-ink">Protect your account with email verification</h2>
        <p class="text-sm leading-6 text-ink-muted">We will send a short-lived six-digit security code to your registered administrator email whenever additional verification is required.</p>
        <AppButton :loading="loading" @click="beginSetup">Send verification code</AppButton>
      </div>

      <div v-else-if="!backupCodes.length" class="space-y-5">
        <div><h2 class="text-sm font-semibold text-ink">Check your email</h2><p class="mt-1 text-sm text-ink-muted">Enter the six-digit code sent to <strong class="text-ink-soft">{{ setup.maskedEmail }}</strong>. It expires in {{ setup.expiresInMinutes }} minutes.</p></div>
        <form class="space-y-3" @submit.prevent="verify">
          <label class="block space-y-1.5"><span class="text-xs font-medium text-ink-muted">Verification code</span><input v-model.trim="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" class="h-11 w-full max-w-xs rounded-xl border border-border bg-bg-1 px-3 font-mono text-lg tracking-[0.3em] text-ink outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" /></label>
          <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>
          <AppButton type="submit" :loading="loading" :disabled="code.length !== 6">Verify and enable MFA</AppButton>
          <AppButton type="button" variant="ghost" :loading="loading" @click="beginSetup">Send a new code</AppButton>
        </form>
      </div>

      <div v-else class="space-y-5">
        <div><h2 class="text-sm font-semibold text-ink">Save your recovery codes</h2><p class="mt-1 text-sm text-ink-muted">Store these one-time codes in a password manager. They will not be shown again.</p></div>
        <div class="grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg-1 p-4 font-mono text-sm text-ink"><code v-for="item in backupCodes" :key="item" class="select-all">{{ item }}</code></div>
        <label class="flex items-start gap-2 text-sm text-ink-muted"><input v-model="saved" type="checkbox" class="mt-1" />I have stored these recovery codes securely.</label>
        <AppButton :disabled="!saved" @click="$router.push('/choose-workspace')">Finish security setup</AppButton>
      </div>
    </AppCard>
  </AppPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ShieldCheck } from 'lucide-vue-next';
import { setupMfa, verifyMfaSetup } from '@/api/auth';
import { refreshSession } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import AppPage from '@/components/ui/AppPage.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppButton from '@/components/ui/AppButton.vue';

const auth = useAuthStore();
const setup = ref<{ delivery: 'email'; maskedEmail: string; expiresInMinutes: number } | null>(null);
const code = ref('');
const backupCodes = ref<string[]>([]);
const saved = ref(false);
const loading = ref(false);
const error = ref('');

async function beginSetup() {
  loading.value = true; error.value = '';
  try { setup.value = await setupMfa(); }
  catch (e) { error.value = e instanceof Error ? e.message : 'MFA setup failed.'; }
  finally { loading.value = false; }
}

async function verify() {
  if (code.value.length !== 6) return;
  loading.value = true; error.value = '';
  try {
    const result = await verifyMfaSetup(code.value);
    backupCodes.value = result.codes;
    auth.applyExternalSession(await refreshSession());
  } catch (e) { error.value = e instanceof Error ? e.message : 'The verification code was rejected.'; }
  finally { loading.value = false; }
}
</script>
