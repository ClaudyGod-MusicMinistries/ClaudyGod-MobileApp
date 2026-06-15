<template>
  <AuthLayout>
    <!-- Step 1: Credentials -->
    <form v-if="!mfaRequired" class="space-y-5" @submit.prevent="onLogin">
      <div class="mb-6">
        <h2 class="text-2xl font-black text-gray-900 tracking-tight">Welcome back</h2>
        <p class="text-sm text-gray-500 mt-1">Sign in to your admin account</p>
      </div>

      <div v-if="auth.error"
        class="p-3.5 rounded-2xl text-sm text-danger font-medium"
        style="background:rgba(225,109,109,0.08);border:1px solid rgba(225,109,109,0.2)">
        {{ auth.error }}
      </div>

      <AppInput
        v-model="email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        required
        autocomplete="email"
        id="email"
        :light="true"
      />
      <AppInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
        autocomplete="current-password"
        id="password"
        :light="true"
      />

      <button
        type="submit"
        :disabled="auth.isLoading"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 mt-2"
        style="background:linear-gradient(135deg,#7c3aed,#6d28d9)">
        <svg v-if="auth.isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {{ auth.isLoading ? 'Signing in…' : 'Sign in' }}
      </button>

      <div v-if="googleLoginUrl" class="relative flex items-center gap-3 my-1">
        <div class="flex-1 h-px bg-gray-100" />
        <span class="text-xs text-gray-400">or</span>
        <div class="flex-1 h-px bg-gray-100" />
      </div>

      <a
        v-if="googleLoginUrl"
        :href="googleLoginUrl"
        class="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-2xl text-sm font-semibold text-gray-700 transition-colors duration-150 border border-gray-200 hover:border-gray-300 hover:bg-gray-50">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </a>

      <p class="text-center text-sm text-gray-500 pt-1">
        Need an account?
        <RouterLink to="/register" class="font-semibold text-violet-600 hover:text-violet-700 transition-colors">
          Create one
        </RouterLink>
      </p>
    </form>

    <!-- Step 2: MFA -->
    <form v-else class="space-y-5" @submit.prevent="onMfa">
      <div class="text-center mb-6">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2)">
          <svg class="w-6 h-6" style="color:#7c3aed" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 class="text-xl font-black text-gray-900 tracking-tight">Two-factor verification</h2>
        <p class="text-sm text-gray-500 mt-1">Enter the 6-digit code from your authenticator app</p>
      </div>

      <div v-if="auth.error"
        class="p-3.5 rounded-2xl text-sm text-danger font-medium"
        style="background:rgba(225,109,109,0.08);border:1px solid rgba(225,109,109,0.2)">
        {{ auth.error }}
      </div>

      <AppInput
        v-model="mfaCode"
        label="Authentication code"
        type="text"
        placeholder="000000"
        required
        maxlength="6"
        autocomplete="one-time-code"
        inputmode="numeric"
        id="mfa-code"
        :light="true"
      />

      <button
        type="submit"
        :disabled="auth.isLoading"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-60"
        style="background:linear-gradient(135deg,#7c3aed,#6d28d9)">
        <svg v-if="auth.isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {{ auth.isLoading ? 'Verifying…' : 'Verify' }}
      </button>

      <button
        type="button"
        class="w-full py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 transition-colors"
        @click="mfaRequired = false; mfaToken = ''">
        ← Back to sign in
      </button>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { GOOGLE_LOGIN_URL } from '@/api/auth';
import AuthLayout from '@/components/layout/AuthLayout.vue';
import AppInput from '@/components/ui/AppInput.vue';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const mfaCode = ref('');
const mfaRequired = ref(false);
const mfaToken = ref('');
const googleLoginUrl = GOOGLE_LOGIN_URL || null;

async function onLogin(): Promise<void> {
  const res = await auth.login(email.value, password.value);
  if (res.requiresMfa && res.mfaToken) {
    mfaToken.value = res.mfaToken;
    mfaRequired.value = true;
    return;
  }
  if (!res.requiresMfa) {
    await router.push('/dashboard');
  }
}

async function onMfa(): Promise<void> {
  await auth.completeMfa(mfaToken.value, mfaCode.value);
  await router.push('/dashboard');
}
</script>
