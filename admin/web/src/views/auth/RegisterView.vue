<template>
  <div class="min-h-screen bg-bg-1 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background glow orbs -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div class="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/4 blur-3xl" />
    </div>

    <!-- Content -->
    <div class="relative z-10 w-full max-w-md">

      <!-- Brand mark -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-12 h-12 rounded-2xl bg-primary/12 border border-primary/28 flex items-center justify-center mb-3 shadow-lg shadow-primary/10">
          <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <span class="text-ink text-sm font-semibold tracking-wide">ClaudyGod Admin</span>
      </div>

      <Transition name="fade" mode="out-in">

        <!-- LOADING -->
        <div v-if="phase === 'loading'" key="loading" class="bg-surface border border-border rounded-3xl p-8 text-center shadow-2xl shadow-black/30">
          <div class="flex justify-center mb-5">
            <div class="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p class="text-ink-soft text-sm">Verifying your invitation…</p>
        </div>

        <!-- NO TOKEN -->
        <div v-else-if="phase === 'no-token'" key="no-token" class="bg-surface border border-border rounded-3xl p-8 text-center shadow-2xl shadow-black/30">
          <div class="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mx-auto mb-5">
            <svg class="w-7 h-7 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 class="text-ink text-xl font-bold mb-2">Invitation required</h1>
          <p class="text-ink-soft text-sm leading-relaxed mb-6">
            Admin accounts are created by invitation only. Ask your ClaudyGod system administrator to send you an invite link.
          </p>
          <div class="bg-bg-1 border border-border/60 rounded-2xl px-4 py-3 text-xs text-ink-muted text-center">
            Already have an account?
            <RouterLink to="/login" class="text-primary hover:text-primary/80 font-medium ml-1 transition-colors">Sign in</RouterLink>
          </div>
        </div>

        <!-- INVALID TOKEN -->
        <div v-else-if="phase === 'invalid'" key="invalid" class="bg-surface border border-border rounded-3xl p-8 text-center shadow-2xl shadow-black/30">
          <div class="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-5">
            <svg class="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 class="text-ink text-xl font-bold mb-2">
            {{ inviteError === 'INVITE_EXPIRED' ? 'Invitation expired'
              : inviteError === 'INVITE_USED' ? 'Already accepted'
              : 'Invitation invalid' }}
          </h1>
          <p class="text-ink-soft text-sm leading-relaxed mb-6">
            <template v-if="inviteError === 'INVITE_EXPIRED'">This invitation link has expired. Ask your administrator to send a new one.</template>
            <template v-else-if="inviteError === 'INVITE_USED'">This invitation has already been used to create an account.</template>
            <template v-else>This invitation link is invalid or has been revoked. Contact your administrator.</template>
          </p>
          <RouterLink to="/login" class="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to sign in
          </RouterLink>
        </div>

        <!-- FORM -->
        <div v-else-if="phase === 'form'" key="form" class="bg-surface border border-border rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
          <!-- Invite banner -->
          <div class="bg-primary/8 border-b border-primary/12 px-6 py-4 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-ink text-sm font-semibold">
                Invited{{ invite?.inviterName ? ` by ${invite.inviterName}` : '' }}
              </p>
              <p class="text-ink-soft text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span class="font-medium text-primary">{{ invite?.email }}</span>
                <span class="opacity-40">·</span>
                <span class="inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary/70 inline-block" />
                  {{ roleLabel }}
                </span>
              </p>
            </div>
          </div>

          <div class="p-6 pt-5">
            <h1 class="text-ink text-2xl font-bold tracking-tight mb-1">Set up your account</h1>
            <p class="text-ink-soft text-sm mb-6">Choose a name and a strong password to get started.</p>

            <form @submit.prevent="submit" novalidate class="space-y-4">
              <!-- Full name -->
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Full name</label>
                <input v-model="form.name" type="text" placeholder="Your full name" autocomplete="name"
                  :class="inputClass('name')" />
                <p v-if="fieldError('name')" class="text-danger text-xs mt-1">{{ fieldError('name') }}</p>
              </div>

              <!-- Display name -->
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                  Display name <span class="normal-case font-normal opacity-70">(shown in the admin)</span>
                </label>
                <input v-model="form.displayName" type="text" placeholder="e.g. john_admin" autocomplete="username"
                  :class="inputClass('displayName')" />
                <p v-if="fieldError('displayName')" class="text-danger text-xs mt-1">{{ fieldError('displayName') }}</p>
              </div>

              <!-- Password -->
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Password</label>
                <div class="relative">
                  <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                    placeholder="Minimum 8 characters" autocomplete="new-password"
                    :class="inputClass('password') + ' pr-10'" />
                  <button type="button" @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-soft transition-colors">
                    <svg v-if="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
                <!-- Strength bar -->
                <div v-if="form.password" class="mt-2 flex items-center gap-2">
                  <div class="flex gap-1 flex-1">
                    <div v-for="i in 4" :key="i"
                      :class="['h-1 flex-1 rounded-full transition-all duration-300', i <= strength.score ? strength.color : 'bg-border']" />
                  </div>
                  <span class="text-xs text-ink-muted whitespace-nowrap">{{ strength.label }}</span>
                </div>
                <p v-if="fieldError('password')" class="text-danger text-xs mt-1">{{ fieldError('password') }}</p>
              </div>

              <!-- Confirm password -->
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Confirm password</label>
                <div class="relative">
                  <input v-model="form.confirmPassword" :type="showConfirm ? 'text' : 'password'"
                    placeholder="Repeat your password" autocomplete="new-password"
                    :class="[inputClass('confirmPassword') + ' pr-16',
                      form.confirmPassword && form.password === form.confirmPassword ? 'border-success/50' : '']" />
                  <div v-if="form.confirmPassword" class="absolute right-9 top-1/2 -translate-y-1/2">
                    <svg v-if="form.password === form.confirmPassword" class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <svg v-else class="w-4 h-4 text-danger/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <button type="button" @click="showConfirm = !showConfirm"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-soft transition-colors">
                    <svg v-if="!showConfirm" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
                <p v-if="fieldError('confirmPassword')" class="text-danger text-xs mt-1">{{ fieldError('confirmPassword') }}</p>
              </div>

              <!-- Global error -->
              <div v-if="submitError" class="flex items-start gap-2.5 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3">
                <svg class="w-4 h-4 text-danger flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" /></svg>
                <p class="text-danger text-sm leading-snug">{{ submitError }}</p>
              </div>

              <!-- Submit -->
              <button type="submit" :disabled="isSubmitting"
                class="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-all shadow-lg shadow-primary/20 mt-2">
                <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{{ isSubmitting ? 'Creating account…' : 'Create account' }}</span>
              </button>
            </form>

            <p class="text-center text-xs text-ink-muted mt-5">
              Already have an account?
              <RouterLink to="/login" class="text-primary hover:text-primary/80 font-medium ml-1 transition-colors">Sign in</RouterLink>
            </p>
          </div>
        </div>

        <!-- SUCCESS -->
        <div v-else-if="phase === 'success'" key="success" class="bg-surface border border-border rounded-3xl p-8 text-center shadow-2xl shadow-black/30">
          <div class="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
            <svg class="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-ink text-xl font-bold mb-2">Welcome to the team!</h1>
          <p class="text-ink-soft text-sm leading-relaxed">Your account is ready. Taking you to the dashboard…</p>
          <div class="flex justify-center mt-5">
            <div class="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>

      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { validateInvite, acceptInvite } from '@/api/auth';
import type { InviteValidation } from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';

type Phase = 'loading' | 'no-token' | 'invalid' | 'form' | 'success';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const phase = ref<Phase>('loading');
const invite = ref<InviteValidation | null>(null);
const inviteError = ref('');
const token = ref('');

const form = ref({ name: '', displayName: '', password: '', confirmPassword: '' });
const errors = ref<Record<string, string>>({});
const submitError = ref('');
const isSubmitting = ref(false);
const showPassword = ref(false);
const showConfirm = ref(false);

const roleLabel = computed(() => {
  const r = invite.value?.role ?? '';
  if (r === 'SUPER_ADMIN') return 'Super Admin';
  if (r === 'ADMIN') return 'Administrator';
  if (r === 'MODERATOR') return 'Moderator';
  if (r === 'CREATOR') return 'Creator';
  return r || 'Team member';
});

const strength = computed(() => {
  const p = form.value.password;
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const score = Math.min(4, Math.ceil(s * 0.9)) as 0 | 1 | 2 | 3 | 4;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const;
  const colors = ['', 'bg-danger', 'bg-amber', 'bg-blue-400', 'bg-success'] as const;
  return { score, label: labels[score], color: colors[score] };
});

function fieldError(key: string) { return errors.value[key] ?? ''; }

function inputClass(key: string): string {
  const base = 'w-full px-3.5 py-2.5 rounded-xl bg-bg-1 border text-ink text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all';
  return fieldError(key) ? `${base} border-danger/60` : `${base} border-border focus:border-primary/60`;
}

function validate(): boolean {
  errors.value = {};
  if (!form.value.name.trim()) errors.value.name = 'Full name is required';
  if (!form.value.displayName.trim()) errors.value.displayName = 'Display name is required';
  if (form.value.password.length < 8) errors.value.password = 'Password must be at least 8 characters';
  if (form.value.password !== form.value.confirmPassword) errors.value.confirmPassword = 'Passwords do not match';
  return Object.keys(errors.value).length === 0;
}

async function submit() {
  if (!validate()) return;
  isSubmitting.value = true;
  submitError.value = '';
  try {
    const session = await acceptInvite({
      token: token.value,
      name: form.value.name,
      displayName: form.value.displayName,
      password: form.value.password,
    });
    authStore.applyExternalSession(session);
    phase.value = 'success';
    setTimeout(() => void router.replace('/dashboard'), 1400);
  } catch (e: unknown) {
    const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? '';
    if (code === 'INVITE_EXPIRED' || code === 'INVITE_USED' || code === 'INVITE_REVOKED') {
      inviteError.value = code;
      phase.value = 'invalid';
      return;
    }
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    submitError.value = msg ?? 'Something went wrong. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(async () => {
  const t = String(route.query.token ?? '').trim();
  if (!t || t.length < 32) {
    phase.value = 'no-token';
    return;
  }
  token.value = t;
  try {
    invite.value = await validateInvite(t);
    phase.value = 'form';
  } catch (e: unknown) {
    const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? '';
    inviteError.value = code;
    phase.value = 'invalid';
  }
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
