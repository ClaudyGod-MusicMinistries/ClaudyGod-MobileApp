<template>
  <AuthLayout>

    <!-- ── Step progress dots ──────────────────────────────────────────────── -->
    <div v-if="step < 3" class="flex items-center gap-2 mb-6">
      <div
        v-for="n in 2"
        :key="n"
        class="h-1 rounded-full transition-all duration-500"
        :class="[
          n <= step ? 'bg-violet-600' : 'bg-gray-200',
          n === step ? 'flex-1' : 'w-6',
        ]"
      />
    </div>

    <!-- ── STEP 1: Team access code ────────────────────────────────────────── -->
    <Transition name="slide-x" mode="out-in">
      <div v-if="step === 1" key="s1" class="space-y-5">
        <div class="mb-5">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
            style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.18)">
            <svg class="w-5 h-5" style="color:#7c3aed" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">Enter access code</h2>
          <p class="text-sm text-gray-500 mt-1.5 leading-relaxed">
            You'll receive a unique team access code from your administrator to create an admin account.
          </p>
        </div>

        <div v-if="step1Error"
          class="p-3.5 rounded-2xl text-sm text-red-600 font-medium"
          style="background:#fef2f2;border:1px solid #fecaca">
          {{ step1Error }}
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
            Team Access Code
          </label>
          <input
            v-model="form.adminSignupCode"
            type="text"
            placeholder="Paste your access code here"
            autocomplete="off"
            class="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all duration-150"
            @keydown.enter.prevent="nextStep"
          />
          <p class="text-xs text-gray-400 pt-0.5">Contact your ClaudyGod system administrator if you don't have this.</p>
        </div>

        <button
          type="button"
          :disabled="!form.adminSignupCode.trim()"
          class="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40"
          style="background:linear-gradient(135deg,#7c3aed,#6d28d9)"
          @click="nextStep">
          Continue →
        </button>

        <p class="text-center text-sm text-gray-500">
          Already have an account?
          <RouterLink to="/login" class="font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            Sign in
          </RouterLink>
        </p>
      </div>
    </Transition>

    <!-- ── STEP 2: Registration form ───────────────────────────────────────── -->
    <Transition name="slide-x" mode="out-in">
      <form v-if="step === 2" key="s2" class="space-y-4" @submit.prevent="onRegister">
        <div class="mb-5">
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">Create account</h2>
          <p class="text-sm text-gray-500 mt-1">Fill in your details to get started</p>
        </div>

        <div v-if="regError"
          class="p-3.5 rounded-2xl text-sm text-red-600 font-medium"
          style="background:#fef2f2;border:1px solid #fecaca">
          {{ regError }}
        </div>

        <!-- Name row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
              First name <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.firstName"
              type="text" required placeholder="Peter"
              autocomplete="given-name"
              class="w-full px-4 py-3 rounded-2xl border bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all duration-150"
              :class="fieldErrors.firstName ? 'border-red-300' : 'border-gray-200'"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
              Last name <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.lastName"
              type="text" required placeholder="Chima"
              autocomplete="family-name"
              class="w-full px-4 py-3 rounded-2xl border bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all duration-150"
              :class="fieldErrors.lastName ? 'border-red-300' : 'border-gray-200'"
            />
          </div>
        </div>

        <!-- Display name -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
            Display name <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.username"
            type="text" required placeholder="How others see you (e.g. Peter Ogba)"
            autocomplete="nickname"
            class="w-full px-4 py-3 rounded-2xl border bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all duration-150"
            :class="fieldErrors.username ? 'border-red-300' : 'border-gray-200'"
          />
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
            Email address <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.email"
            type="email" required placeholder="you@example.com"
            autocomplete="email"
            class="w-full px-4 py-3 rounded-2xl border bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all duration-150"
            :class="fieldErrors.email ? 'border-red-300' : 'border-gray-200'"
          />
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
            Password <span class="text-danger">*</span>
          </label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required placeholder="Minimum 8 characters"
              autocomplete="new-password"
              class="w-full pl-4 pr-11 py-3 rounded-2xl border bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all duration-150"
              :class="fieldErrors.password ? 'border-red-300' : 'border-gray-200'"
              @input="validatePassword"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              @click="showPassword = !showPassword">
              <svg v-if="!showPassword" class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <svg v-else class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>

          <!-- Password strength bar -->
          <div v-if="form.password" class="space-y-1.5 pt-0.5">
            <div class="flex gap-1">
              <div
                v-for="i in 4" :key="i"
                class="h-1 flex-1 rounded-full transition-all duration-300"
                :style="{ background: i <= passwordStrength.score ? passwordStrength.color : '#e5e7eb' }"
              />
            </div>
            <p class="text-xs font-medium transition-colors" :style="{ color: passwordStrength.color }">
              {{ passwordStrength.label }}
            </p>
          </div>
          <p v-if="fieldErrors.password" class="text-xs text-red-500 font-medium">{{ fieldErrors.password }}</p>
        </div>

        <!-- Confirm password -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
            Confirm password <span class="text-danger">*</span>
          </label>
          <div class="relative">
            <input
              v-model="form.confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              required placeholder="Re-enter your password"
              autocomplete="new-password"
              class="w-full pl-4 pr-11 py-3 rounded-2xl border bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all duration-150"
              :class="confirmError ? 'border-red-300' : form.confirmPassword && !confirmError ? 'border-green-300' : 'border-gray-200'"
              @input="validateConfirm"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              @click="showConfirm = !showConfirm">
              <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path v-if="!showConfirm" stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                <path v-else stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
          <div v-if="form.confirmPassword" class="flex items-center gap-1.5">
            <svg v-if="!confirmError" class="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <p class="text-xs font-medium" :class="confirmError ? 'text-red-500' : 'text-green-600'">
              {{ confirmError || 'Passwords match' }}
            </p>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading || !!confirmError || !form.confirmPassword || passwordStrength.score < 2"
          class="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 mt-1 flex items-center justify-center gap-2"
          style="background:linear-gradient(135deg,#7c3aed,#6d28d9)">
          <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ isLoading ? 'Creating account…' : 'Create account' }}
        </button>

        <button type="button" class="w-full py-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors" @click="step = 1">
          ← Back
        </button>
      </form>
    </Transition>

    <!-- ── STEP 3: Email verification ──────────────────────────────────────── -->
    <Transition name="slide-x" mode="out-in">
      <div v-if="step === 3" key="s3" class="space-y-5">
        <div class="text-center">
          <div class="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.18)">
            <svg class="w-7 h-7" style="color:#7c3aed" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">Check your email</h2>
          <p class="text-sm text-gray-500 mt-2 leading-relaxed">
            We sent a 6-digit verification code to<br/>
            <strong class="text-gray-700 font-semibold">{{ form.email }}</strong>
          </p>
        </div>

        <div v-if="otpError"
          class="p-3.5 rounded-2xl text-sm text-red-600 font-medium"
          style="background:#fef2f2;border:1px solid #fecaca">
          {{ otpError }}
        </div>

        <!-- OTP input -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
            Verification code
          </label>
          <input
            v-model="otpCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            autocomplete="one-time-code"
            class="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-2xl font-black text-center tracking-[0.4em] placeholder:text-gray-300 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all duration-150"
          />
        </div>

        <button
          type="button"
          :disabled="otpCode.length < 6 || isVerifying"
          class="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2"
          style="background:linear-gradient(135deg,#7c3aed,#6d28d9)"
          @click="onVerify">
          <svg v-if="isVerifying" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ isVerifying ? 'Verifying…' : 'Verify email' }}
        </button>

        <p class="text-center text-sm text-gray-400">
          Didn't receive it?
          <button type="button" class="text-violet-600 font-semibold hover:text-violet-700 transition-colors" @click="resendCode">
            Resend
          </button>
        </p>
      </div>
    </Transition>

    <!-- ── STEP 4: All done ────────────────────────────────────────────────── -->
    <Transition name="slide-x" mode="out-in">
      <div v-if="step === 4" key="s4" class="text-center space-y-5">
        <div class="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto"
          style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25)">
          <svg class="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <h2 class="text-2xl font-black text-gray-900 tracking-tight">You're in!</h2>
          <p class="text-sm text-gray-500 mt-2 leading-relaxed">
            Your account has been verified. Redirecting to the studio…
          </p>
        </div>
        <div class="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-violet-600 rounded-full animate-progress" />
        </div>
      </div>
    </Transition>

  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { register, verifyEmail } from '@/api/auth';
import AuthLayout from '@/components/layout/AuthLayout.vue';

const router = useRouter();

const step = ref(1);
const isLoading = ref(false);
const isVerifying = ref(false);
const step1Error = ref<string | null>(null);
const regError = ref<string | null>(null);
const otpError = ref<string | null>(null);
const otpCode = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const confirmError = ref('');

const form = reactive({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  adminSignupCode: '',
});

const fieldErrors = reactive({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
});

// ── Password strength ──────────────────────────────────────────────────────
const passwordStrength = computed(() => {
  const p = form.password;
  if (!p) return { score: 0, label: '', color: '#e5e7eb' };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const clamped = Math.min(4, Math.ceil(score * 0.9)) as 0 | 1 | 2 | 3 | 4;
  const map: Record<0|1|2|3|4, { label: string; color: string }> = {
    0: { label: '', color: '#e5e7eb' },
    1: { label: 'Weak', color: '#ef4444' },
    2: { label: 'Fair', color: '#f59e0b' },
    3: { label: 'Good', color: '#3b82f6' },
    4: { label: 'Strong', color: '#10b981' },
  };
  return { score: clamped, ...map[clamped] };
});

function validatePassword(): void {
  fieldErrors.password = form.password.length > 0 && form.password.length < 8
    ? 'Password must be at least 8 characters'
    : '';
  if (form.confirmPassword) validateConfirm();
}

function validateConfirm(): void {
  confirmError.value = form.confirmPassword && form.password !== form.confirmPassword
    ? 'Passwords do not match'
    : '';
}

// ── Step navigation ────────────────────────────────────────────────────────
function nextStep(): void {
  step1Error.value = null;
  if (!form.adminSignupCode.trim()) {
    step1Error.value = 'Please enter your team access code.';
    return;
  }
  step.value = 2;
}

// ── Submit registration ────────────────────────────────────────────────────
async function onRegister(): Promise<void> {
  regError.value = null;
  validateConfirm();
  if (confirmError.value) return;
  if (passwordStrength.value.score < 2) return;

  isLoading.value = true;
  try {
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    await register({
      email: form.email,
      password: form.password,
      username: form.username || fullName,
      adminSignupCode: form.adminSignupCode,
      role: 'ADMIN',
    });
    step.value = 3;
  } catch (e: unknown) {
    regError.value = e instanceof Error ? e.message : 'Registration failed. Please check your details.';
  } finally {
    isLoading.value = false;
  }
}

// ── Verify OTP ─────────────────────────────────────────────────────────────
async function onVerify(): Promise<void> {
  otpError.value = null;
  isVerifying.value = true;
  try {
    await verifyEmail(otpCode.value, form.email);
    step.value = 4;
    setTimeout(() => { void router.push('/login'); }, 1800);
  } catch (e: unknown) {
    otpError.value = e instanceof Error ? e.message : 'Invalid code. Please try again.';
  } finally {
    isVerifying.value = false;
  }
}

async function resendCode(): Promise<void> {
  try {
    await import('@/api/auth').then(m => m.register({
      email: form.email,
      password: form.password,
      username: form.username,
      adminSignupCode: form.adminSignupCode,
      role: 'ADMIN',
    }));
    otpError.value = null;
    otpCode.value = '';
  } catch { /* ignore */ }
}
</script>

<style scoped>
.slide-x-enter-active,
.slide-x-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.slide-x-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.slide-x-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

@keyframes progress {
  from { width: 0%; }
  to   { width: 100%; }
}
.animate-progress {
  animation: progress 1.8s ease-in-out forwards;
}
</style>
