<template>
  <AuthPageLayout eyebrow="Secure access">

    <!-- Step 1: Credentials ─────────────────────────────────────────────────── -->
    <form v-if="!mfaRequired" class="space-y-5" @submit.prevent="onLogin">
      <div class="mb-6">
        <h2 class="text-2xl font-black text-ink tracking-tight">Welcome back</h2>
        <p class="text-sm text-ink-soft mt-1">Sign in to your admin account</p>
      </div>

      <div v-if="auth.error"
        class="flex items-start gap-3 p-3.5 rounded-2xl text-sm text-danger font-medium"
        style="background: rgba(225,109,109,0.08); border: 1px solid rgba(225,109,109,0.22)">
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/>
        </svg>
        {{ auth.error }}
      </div>

      <AppInput
        v-model="email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        required
        autocomplete="email"
        id="login-email"
      >
        <template #prefix>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </template>
      </AppInput>

      <AppInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
        autocomplete="current-password"
        id="login-password"
      >
        <template #prefix>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </template>
      </AppInput>

      <AppButton
        type="submit"
        variant="gradient"
        size="lg"
        :loading="auth.isLoading"
        :full-width="true"
        class="mt-2"
      >
        {{ auth.isLoading ? 'Signing in…' : 'Sign in' }}
      </AppButton>

      <!-- Divider -->
      <div class="relative flex items-center gap-3 my-1">
        <div class="flex-1 h-px bg-border"/>
        <span class="text-xs text-ink-muted/70 whitespace-nowrap">or continue with</span>
        <div class="flex-1 h-px bg-border"/>
      </div>

      <!-- Social buttons -->
      <div class="flex gap-3">
        <a
          :href="googleLoginUrl || '#'"
          :class="[
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-colors duration-150',
            'text-ink-soft hover:text-ink border border-border hover:border-border-strong',
            !googleLoginUrl && 'opacity-50 pointer-events-none',
          ]"
          style="background: rgba(255,255,255,0.04)"
        >
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </a>
        <a
          :href="facebookLoginUrl || '#'"
          :class="[
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-white transition-colors duration-150 hover:opacity-90',
            !facebookLoginUrl && 'opacity-50 pointer-events-none',
          ]"
          style="background: #1877F2"
        >
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
          Facebook
        </a>
      </div>

      <p class="text-center text-sm text-ink-muted pt-1">
        Need an account?
        <RouterLink to="/register" class="font-semibold text-primary-soft hover:text-primary transition-colors">
          Create one
        </RouterLink>
      </p>
    </form>

    <!-- Step 2: MFA ──────────────────────────────────────────────────────────── -->
    <form v-else class="space-y-5" @submit.prevent="onMfa">
      <div class="text-center mb-6">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style="background: rgba(141,99,255,0.12); border: 1px solid rgba(141,99,255,0.28)">
          <ShieldCheck class="w-6 h-6 text-primary-soft" />
        </div>
        <h2 class="text-xl font-black text-ink tracking-tight">Verification code</h2>
        <p class="text-sm text-ink-soft mt-1">Enter the 6-digit security code from your authenticator app.</p>
      </div>

      <div v-if="auth.error"
        class="flex items-start gap-3 p-3.5 rounded-2xl text-sm text-danger font-medium"
        style="background: rgba(225,109,109,0.08); border: 1px solid rgba(225,109,109,0.22)">
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/>
        </svg>
        {{ auth.error }}
      </div>

      <AppInput
        v-model="mfaCode"
        label="Security code"
        type="text"
        placeholder="· · · · · ·"
        required
        maxlength="6"
        autocomplete="one-time-code"
        inputmode="numeric"
        id="mfa-code"
      />

      <AppButton
        type="submit"
        variant="gradient"
        size="lg"
        :loading="auth.isLoading"
        :full-width="true"
      >
        {{ auth.isLoading ? 'Verifying…' : 'Verify' }}
      </AppButton>

      <button
        type="button"
        class="w-full py-2 rounded-xl text-sm text-ink-muted hover:text-ink-soft transition-colors flex items-center justify-center gap-1.5"
        @click="mfaRequired = false; mfaToken = ''">
        <ArrowLeft class="w-3.5 h-3.5" />
        Back to sign in
      </button>
    </form>

  </AuthPageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { ArrowLeft, ShieldCheck } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { GOOGLE_LOGIN_URL, FACEBOOK_LOGIN_URL } from '@/api/auth';
import AuthPageLayout from '@/components/layout/AuthPageLayout.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const mfaCode = ref('');
const mfaRequired = ref(false);
const mfaToken = ref('');
const googleLoginUrl = GOOGLE_LOGIN_URL || null;
const facebookLoginUrl = FACEBOOK_LOGIN_URL || null;

async function onLogin(): Promise<void> {
  try {
    const res = await auth.login(email.value, password.value);
    if (res.mfaRequired) {
      mfaToken.value = res.mfaToken;
      mfaRequired.value = true;
      return;
    }
    await router.push('/dashboard');
  } catch {
    // auth.error is set by the store — the template already displays it
  }
}

async function onMfa(): Promise<void> {
  try {
    await auth.completeMfa(mfaToken.value, mfaCode.value);
    await router.push('/dashboard');
  } catch {
    // auth.error is set by the store — the template already displays it
  }
}
</script>
