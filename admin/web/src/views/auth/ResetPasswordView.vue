<template>
  <AuthPageLayout eyebrow="Secure recovery">
    <div v-if="complete" class="space-y-5" role="status" aria-live="polite">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/25">
        <CircleCheck class="w-6 h-6 text-primary-soft" aria-hidden="true" />
      </div>
      <div>
        <h2 class="text-2xl font-black text-ink tracking-tight">Password updated</h2>
        <p class="text-sm text-ink-soft mt-2">All existing sessions have been revoked. Sign in again with your new password.</p>
      </div>
      <AppButton :full-width="true" size="lg" @click="goToLogin">Return to sign in</AppButton>
    </div>

    <form v-else class="space-y-5" @submit.prevent="submit">
      <div>
        <h2 class="text-2xl font-black text-ink tracking-tight">Choose a new password</h2>
        <p class="text-sm text-ink-soft mt-1">Enter the recovery code from your email and set a strong replacement.</p>
      </div>

      <div v-if="error" role="alert" class="p-3.5 rounded-2xl text-sm text-danger font-medium bg-danger/10 border border-danger/25">
        {{ error }}
      </div>

      <AppInput
        v-if="needsEmail"
        id="reset-email"
        v-model="email"
        label="Email address"
        type="email"
        autocomplete="email"
        required
        :disabled="loading"
      />
      <AppInput
        id="recovery-code"
        v-model="token"
        label="Recovery code"
        autocomplete="one-time-code"
        inputmode="numeric"
        placeholder="6-digit code"
        required
        :disabled="loading"
      />
      <AppInput
        id="new-password"
        v-model="password"
        label="New password"
        type="password"
        autocomplete="new-password"
        required
        :disabled="loading"
        hint="8–72 characters with uppercase, lowercase, number, and symbol."
        :error="passwordError"
      />
      <AppInput
        id="confirm-password"
        v-model="confirmation"
        label="Confirm new password"
        type="password"
        autocomplete="new-password"
        required
        :disabled="loading"
        :error="confirmationError"
      />

      <AppButton type="submit" variant="gradient" size="lg" :loading="loading" :full-width="true">
        {{ loading ? 'Updating…' : 'Update password' }}
      </AppButton>

      <RouterLink :to="{ name: 'forgot-password', query: { email } }" class="flex items-center justify-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft class="w-4 h-4" aria-hidden="true" />
        Request a new code
      </RouterLink>
    </form>
  </AuthPageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { ArrowLeft, CircleCheck } from 'lucide-vue-next';
import { resetPassword } from '@/api/auth';
import { toErrorMessage } from '@/utils/formatters';
import AuthPageLayout from '@/components/layout/AuthPageLayout.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const route = useRoute();
const router = useRouter();
const queryValue = (key: string) => typeof route.query[key] === 'string' ? String(route.query[key]).trim() : '';
const email = ref(queryValue('email').toLowerCase());
const token = ref(queryValue('token') || queryValue('code'));
const password = ref('');
const confirmation = ref('');
const loading = ref(false);
const complete = ref(false);
const error = ref('');
const attempted = ref(false);

const needsEmail = computed(() => /^\d{6}$/.test(token.value.trim()) || !token.value.trim());
const passwordError = computed(() => {
  if (!attempted.value) return '';
  if (password.value.length < 8 || password.value.length > 72) return 'Use between 8 and 72 characters.';
  if (!/[A-Z]/.test(password.value) || !/[a-z]/.test(password.value) || !/[0-9]/.test(password.value) || !/[^A-Za-z0-9]/.test(password.value)) {
    return 'Include uppercase, lowercase, a number, and a symbol.';
  }
  return '';
});
const confirmationError = computed(() => attempted.value && confirmation.value !== password.value ? 'Passwords do not match.' : '');

async function submit(): Promise<void> {
  attempted.value = true;
  error.value = '';
  if (passwordError.value || confirmationError.value) return;
  const normalizedToken = token.value.trim();
  const normalizedEmail = email.value.trim().toLowerCase();
  if (/^\d{6}$/.test(normalizedToken) && !normalizedEmail) {
    error.value = 'Enter the email address that received this recovery code.';
    return;
  }

  loading.value = true;
  try {
    await resetPassword({
      token: normalizedToken,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      newPassword: password.value,
    });
    complete.value = true;
  } catch (cause) {
    error.value = toErrorMessage(cause, 'We could not update the password. Request a new code and try again.');
  } finally {
    loading.value = false;
  }
}

function goToLogin(): void {
  void router.replace({ name: 'login', query: email.value ? { email: email.value } : {} });
}
</script>
