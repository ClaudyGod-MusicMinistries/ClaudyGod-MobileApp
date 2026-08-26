<template>
  <AuthPageLayout eyebrow="Secure access">

    <!-- Step 1: Credentials ─────────────────────────────────────────────────── -->
    <form v-if="!mfaRequired" class="space-y-5" @submit.prevent="onLogin">
      <div class="mb-6">
        <h2 class="text-2xl font-black text-ink tracking-tight">Welcome back</h2>
        <p class="text-sm text-ink-soft mt-1">Sign in to your admin account</p>
      </div>

      <div v-if="auth.error"
        class="feedback-danger flex items-start gap-3 p-3.5 rounded-2xl text-sm text-danger font-medium">
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

      <div class="flex justify-end -mt-2">
        <RouterLink
          :to="{ name: 'forgot-password', query: { email } }"
          class="text-xs font-semibold text-primary-soft hover:text-primary transition-colors"
        >
          Forgot password?
        </RouterLink>
      </div>

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
      <div v-if="googleLoginUrl || facebookLoginUrl" class="relative flex items-center gap-3 my-1">
        <div class="flex-1 h-px bg-border"/>
        <span class="text-xs text-ink-soft whitespace-nowrap">or continue with</span>
        <div class="flex-1 h-px bg-border"/>
      </div>

      <!-- Social buttons -->
      <div v-if="googleLoginUrl || facebookLoginUrl" class="flex gap-3">
        <a
          v-if="googleLoginUrl"
          :href="googleLoginUrl || '#'"
          :class="[
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-colors duration-150',
            'bg-surface-hover text-ink-soft hover:text-ink border border-border hover:border-border-strong',
          ]"
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
          v-if="facebookLoginUrl"
          :href="facebookLoginUrl || '#'"
          :class="[
            'social-facebook flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-white transition-base hover:brightness-110',
          ]"
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
        <div class="auth-logo w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldCheck class="w-6 h-6 text-primary-soft" />
        </div>
        <h2 class="text-xl font-black text-ink tracking-tight">Verification code</h2>
        <p class="text-sm text-ink-soft mt-1">{{ mfaMessage || 'Enter the 6-digit security code sent to your registered email address.' }}</p>
      </div>

      <div v-if="auth.error"
        class="feedback-danger flex items-start gap-3 p-3.5 rounded-2xl text-sm text-danger font-medium">
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/>
        </svg>
        {{ auth.error }}
      </div>

      <fieldset v-if="!useRecoveryCode" class="space-y-2">
        <legend class="text-xs font-medium text-ink-soft">Security code<span class="text-danger ml-0.5">*</span></legend>
        <div class="flex justify-center gap-2" role="group" aria-label="Security code">
          <input
            v-for="(_, index) in mfaDigits"
            :key="index"
            :ref="(element) => setDigitInput(element, index)"
            :value="mfaDigits[index]"
            :aria-label="`Digit ${index + 1} of 6`"
            class="h-12 w-11 rounded-xl border border-border bg-surface-strong text-center text-xl font-bold text-ink outline-none transition-base focus:border-primary/60 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
            autocomplete="one-time-code"
            :disabled="auth.isLoading"
            @input="onDigitInput($event, index)"
            @keydown="onDigitKeydown($event, index)"
            @paste.prevent="onDigitPaste"
          />
        </div>
        <p class="text-center text-xs text-ink-muted">Verification starts automatically after the sixth digit.</p>
      </fieldset>

      <AppInput
        v-else
        v-model="mfaCode"
        label="Recovery code"
        type="text"
        placeholder="A1B2C3D4"
        required
        maxlength="8"
        autocomplete="off"
        id="mfa-recovery-code"
      />

      <button type="button" class="w-full text-xs font-semibold text-primary-soft hover:text-primary" @click="toggleRecoveryCode">
        {{ useRecoveryCode ? 'Use the 6-digit email code' : 'Use an eight-character recovery code' }}
      </button>

      <AppButton
        type="submit"
        variant="gradient"
        size="lg"
        :loading="auth.isLoading"
        :disabled="useRecoveryCode ? mfaCode.trim().length !== 8 : mfaCode.length !== 6"
        :full-width="true"
      >
        {{ auth.isLoading ? 'Verifying…' : 'Verify' }}
      </AppButton>

      <AppButton
        type="button"
        variant="ghost"
        :full-width="true"
        :loading="resendLoading"
        :disabled="resendCooldown > 0"
        @click="resendCode"
      >
        {{ resendCooldown > 0 ? `Send a new code in ${resendCooldown}s` : 'Send a new code' }}
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
import { nextTick, onUnmounted, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { ArrowLeft, ShieldCheck } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { GOOGLE_LOGIN_URL, FACEBOOK_LOGIN_URL, resendMfaCode } from '@/api/auth';
import AuthPageLayout from '@/components/layout/AuthPageLayout.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref(typeof route.query.email === 'string' ? route.query.email : '');
const password = ref('');
const mfaCode = ref('');
const mfaDigits = ref<string[]>(Array.from({ length: 6 }, () => ''));
const digitInputs = ref<Array<HTMLInputElement | null>>([]);
const useRecoveryCode = ref(false);
const mfaRequired = ref(false);
const mfaToken = ref('');
const mfaMessage = ref('');
const resendLoading = ref(false);
const resendCooldown = ref(0);
let resendTimer: ReturnType<typeof setInterval> | null = null;
let autoSubmittingCode = '';
const googleLoginUrl = GOOGLE_LOGIN_URL || null;
const facebookLoginUrl = FACEBOOK_LOGIN_URL || null;

function startResendCooldown(): void {
  resendCooldown.value = 30;
  if (resendTimer) clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    resendCooldown.value = Math.max(0, resendCooldown.value - 1);
    if (resendCooldown.value === 0 && resendTimer) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }, 1000);
}

onUnmounted(() => { if (resendTimer) clearInterval(resendTimer); });

function setDigitInput(element: Element | ComponentPublicInstance | null, index: number): void {
  digitInputs.value[index] = element instanceof HTMLInputElement ? element : null;
}

function applyMfaDigits(value: string): void {
  const digits = value.replace(/\D/g, '').slice(0, 6).split('');
  mfaDigits.value = Array.from({ length: 6 }, (_, index) => digits[index] ?? '');
  mfaCode.value = digits.join('');
  const focusIndex = Math.min(digits.length, 5);
  void nextTick(() => digitInputs.value[focusIndex]?.focus());
  if (mfaCode.value.length === 6 && autoSubmittingCode !== mfaCode.value) {
    autoSubmittingCode = mfaCode.value;
    void onMfa();
  }
}

function onDigitInput(event: Event, index: number): void {
  const input = event.target as HTMLInputElement;
  const entered = input.value.replace(/\D/g, '');
  if (entered.length > 1) {
    applyMfaDigits(entered);
    return;
  }
  mfaDigits.value[index] = entered;
  mfaCode.value = mfaDigits.value.join('');
  if (entered && index < 5) digitInputs.value[index + 1]?.focus();
  if (mfaCode.value.length === 6 && autoSubmittingCode !== mfaCode.value) {
    autoSubmittingCode = mfaCode.value;
    void onMfa();
  }
}

function onDigitKeydown(event: KeyboardEvent, index: number): void {
  if (event.key === 'Backspace' && !mfaDigits.value[index] && index > 0) {
    mfaDigits.value[index - 1] = '';
    mfaCode.value = mfaDigits.value.join('');
    digitInputs.value[index - 1]?.focus();
  }
  if (event.key === 'ArrowLeft' && index > 0) digitInputs.value[index - 1]?.focus();
  if (event.key === 'ArrowRight' && index < 5) digitInputs.value[index + 1]?.focus();
}

function onDigitPaste(event: ClipboardEvent): void {
  applyMfaDigits(event.clipboardData?.getData('text') ?? '');
}

function toggleRecoveryCode(): void {
  useRecoveryCode.value = !useRecoveryCode.value;
  mfaCode.value = '';
  mfaDigits.value = Array.from({ length: 6 }, () => '');
  autoSubmittingCode = '';
  if (!useRecoveryCode.value) void nextTick(() => digitInputs.value[0]?.focus());
}

async function onLogin(): Promise<void> {
  try {
    const res = await auth.login(email.value, password.value);
    if (res.mfaRequired) {
      mfaToken.value = res.mfaToken;
      mfaMessage.value = res.message || '';
      mfaRequired.value = true;
      startResendCooldown();
      return;
    }
    // Every fresh login lands on the workspace chooser now — Mobile Studio and
    // Web Studio are two separate shells with nothing meaningfully in common,
    // so there's no single "the dashboard" to jump straight back into anymore
    // (this used to hardcode '/dashboard', a leftover from before Web Studio
    // existed).
    await router.push('/choose-workspace');
  } catch {
    // auth.error is set by the store — the template already displays it
  }
}

async function resendCode(): Promise<void> {
  if (!mfaToken.value || resendLoading.value || resendCooldown.value > 0) return;
  resendLoading.value = true;
  try {
    const result = await resendMfaCode(mfaToken.value);
    mfaMessage.value = result.message;
    startResendCooldown();
  } catch {
    // The shared API error is displayed by the next verification attempt; keep
    // the current challenge usable instead of clearing the login state.
  } finally {
    resendLoading.value = false;
  }
}

async function onMfa(): Promise<void> {
  const code = mfaCode.value.trim();
  if (auth.isLoading || (useRecoveryCode.value ? code.length !== 8 : code.length !== 6)) return;
  try {
    await auth.completeMfa(mfaToken.value, code);
    await router.push('/choose-workspace');
  } catch {
    // auth.error is set by the store — the template already displays it
    if (!useRecoveryCode.value) {
      autoSubmittingCode = '';
      mfaDigits.value = Array.from({ length: 6 }, () => '');
      mfaCode.value = '';
      void nextTick(() => digitInputs.value[0]?.focus());
    }
  }
}
</script>
