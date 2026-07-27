<template>
  <AuthPageLayout eyebrow="Account recovery">
    <div v-if="submitted" class="space-y-5" role="status" aria-live="polite">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/25">
        <MailCheck class="w-6 h-6 text-primary-soft" aria-hidden="true" />
      </div>
      <div>
        <h2 class="text-2xl font-black text-ink tracking-tight">Check your email</h2>
        <p class="text-sm text-ink-soft mt-2 leading-relaxed">
          If an admin account exists for <strong class="text-ink">{{ email }}</strong>, we sent a recovery code with the next steps.
        </p>
      </div>
      <AppButton :full-width="true" size="lg" @click="openReset">Enter recovery code</AppButton>
      <button type="button" class="w-full text-sm text-ink-muted hover:text-ink transition-colors" @click="submitted = false">
        Use a different email
      </button>
    </div>

    <form v-else class="space-y-5" @submit.prevent="submit">
      <div>
        <h2 class="text-2xl font-black text-ink tracking-tight">Recover admin access</h2>
        <p class="text-sm text-ink-soft mt-1">We will send a short-lived recovery code to your account email.</p>
      </div>

      <div v-if="error" role="alert" class="p-3.5 rounded-2xl text-sm text-danger font-medium bg-danger/10 border border-danger/25">
        {{ error }}
      </div>

      <AppInput
        id="recovery-email"
        v-model="email"
        label="Email address"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
        :disabled="loading"
      />

      <AppButton type="submit" variant="gradient" size="lg" :loading="loading" :full-width="true">
        {{ loading ? 'Sending…' : 'Send recovery code' }}
      </AppButton>

      <RouterLink to="/login" class="flex items-center justify-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft class="w-4 h-4" aria-hidden="true" />
        Back to sign in
      </RouterLink>
    </form>
  </AuthPageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { ArrowLeft, MailCheck } from 'lucide-vue-next';
import { requestPasswordReset } from '@/api/auth';
import { toErrorMessage } from '@/utils/formatters';
import AuthPageLayout from '@/components/layout/AuthPageLayout.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const route = useRoute();
const router = useRouter();
const initialEmail = typeof route.query.email === 'string' ? route.query.email : '';
const email = ref(initialEmail.trim().toLowerCase());
const loading = ref(false);
const submitted = ref(false);
const error = ref('');

async function submit(): Promise<void> {
  error.value = '';
  loading.value = true;
  try {
    email.value = email.value.trim().toLowerCase();
    await requestPasswordReset(email.value);
    submitted.value = true;
  } catch (cause) {
    error.value = toErrorMessage(cause, 'We could not send recovery instructions. Please try again.');
  } finally {
    loading.value = false;
  }
}

function openReset(): void {
  void router.push({ name: 'reset-password', query: { email: email.value } });
}
</script>
