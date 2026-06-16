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

        <!-- LOADING (invite validation) -->
        <div v-if="phase === 'loading'" key="loading" class="bg-surface border border-border rounded-3xl p-8 text-center shadow-2xl shadow-black/30">
          <div class="flex justify-center mb-5">
            <div class="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p class="text-ink-soft text-sm">Verifying your invitation…</p>
        </div>

        <!-- INVITE INVALID / EXPIRED / USED -->
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

        <!-- INVITE FORM (with token) -->
        <div v-else-if="phase === 'invite-form'" key="invite-form" class="bg-surface border border-border rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
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

            <form @submit.prevent="submitInvite" novalidate class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Full name</label>
                <input v-model="inviteForm.name" type="text" placeholder="Your full name" autocomplete="name" :class="inputClass(inviteErrors, 'name')" />
                <p v-if="inviteErrors.name" class="text-danger text-xs mt-1">{{ inviteErrors.name }}</p>
              </div>
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                  Display name <span class="normal-case font-normal opacity-70">(shown in the admin)</span>
                </label>
                <input v-model="inviteForm.displayName" type="text" placeholder="e.g. john_admin" autocomplete="username" :class="inputClass(inviteErrors, 'displayName')" />
                <p v-if="inviteErrors.displayName" class="text-danger text-xs mt-1">{{ inviteErrors.displayName }}</p>
              </div>
              <PasswordFields v-model:password="inviteForm.password" v-model:confirm="inviteForm.confirmPassword" :errors="inviteErrors" />
              <div v-if="submitError" class="flex items-start gap-2.5 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3">
                <svg class="w-4 h-4 text-danger flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" /></svg>
                <p class="text-danger text-sm leading-snug">{{ submitError }}</p>
              </div>
              <button type="submit" :disabled="isSubmitting" class="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-all shadow-lg shadow-primary/20 mt-2">
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

        <!-- CODE-BASED SELF-REGISTRATION (no invite token) -->
        <div v-else-if="phase === 'code-form'" key="code-form" class="bg-surface border border-border rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
          <div class="bg-primary/8 border-b border-primary/12 px-6 py-4 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <p class="text-ink text-sm font-semibold">Restricted access</p>
              <p class="text-ink-soft text-xs mt-0.5">You need an admin access code to register.</p>
            </div>
          </div>

          <div class="p-6 pt-5">
            <h1 class="text-ink text-2xl font-bold tracking-tight mb-1">Create admin account</h1>
            <p class="text-ink-soft text-sm mb-6">Enter your details and the access code provided by your system administrator.</p>

            <form @submit.prevent="submitCode" novalidate class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Email</label>
                <input v-model="codeForm.email" type="email" placeholder="you@example.com" autocomplete="email" :class="inputClass(codeErrors, 'email')" />
                <p v-if="codeErrors.email" class="text-danger text-xs mt-1">{{ codeErrors.email }}</p>
              </div>
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Display name</label>
                <input v-model="codeForm.username" type="text" placeholder="e.g. john_admin" autocomplete="username" :class="inputClass(codeErrors, 'username')" />
                <p v-if="codeErrors.username" class="text-danger text-xs mt-1">{{ codeErrors.username }}</p>
              </div>
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Role</label>
                <select v-model="codeForm.role" :class="inputClass(codeErrors, 'role')">
                  <option value="ADMIN">Administrator</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="CREATOR">Creator</option>
                </select>
                <p v-if="codeErrors.role" class="text-danger text-xs mt-1">{{ codeErrors.role }}</p>
              </div>
              <PasswordFields v-model:password="codeForm.password" v-model:confirm="codeForm.confirmPassword" :errors="codeErrors" />
              <div>
                <label class="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Admin access code</label>
                <input v-model="codeForm.adminSignupCode" type="password" placeholder="Enter the access code" autocomplete="off" :class="inputClass(codeErrors, 'adminSignupCode')" />
                <p v-if="codeErrors.adminSignupCode" class="text-danger text-xs mt-1">{{ codeErrors.adminSignupCode }}</p>
              </div>
              <div v-if="submitError" class="flex items-start gap-2.5 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3">
                <svg class="w-4 h-4 text-danger flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" /></svg>
                <p class="text-danger text-sm leading-snug">{{ submitError }}</p>
              </div>
              <button type="submit" :disabled="isSubmitting" class="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-all shadow-lg shadow-primary/20 mt-2">
                <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{{ isSubmitting ? 'Creating account…' : 'Create account' }}</span>
              </button>
            </form>

            <p class="text-center text-xs text-ink-muted mt-5">
              Have an invite link?
              <RouterLink to="/login" class="text-primary hover:text-primary/80 font-medium ml-1 transition-colors">Sign in instead</RouterLink>
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

        <!-- SUCCESS — email verification required -->
        <div v-else-if="phase === 'verify-email'" key="verify-email" class="bg-surface border border-border rounded-3xl p-8 text-center shadow-2xl shadow-black/30">
          <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <svg class="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 class="text-ink text-xl font-bold mb-2">Check your email</h1>
          <p class="text-ink-soft text-sm leading-relaxed mb-4">We sent a verification link to <strong class="text-primary">{{ verifyEmail }}</strong>. Click it to activate your account.</p>
          <RouterLink to="/login" class="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to sign in
          </RouterLink>
        </div>

      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { validateInvite, acceptInvite, registerWithCode } from '@/api/auth';
import type { InviteValidation } from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';

type Phase = 'loading' | 'invalid' | 'invite-form' | 'code-form' | 'success' | 'verify-email';

// ── Password strength helper ──────────────────────────────────────────────────
function calcStrength(p: string) {
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
}

// ── Shared password fields sub-component ─────────────────────────────────────
const PasswordFields = defineComponent({
  props: {
    password: { type: String, required: true },
    confirm: { type: String, required: true },
    errors: { type: Object as () => Record<string, string>, required: true },
  },
  emits: ['update:password', 'update:confirm'],
  setup(props, { emit }) {
    const showPass = ref(false);
    const showConf = ref(false);
    const str = computed(() => calcStrength(props.password));
    const eyeOn = () => h('svg', { class: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' }),
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' }),
    ]);
    const eyeOff = () => h('svg', { class: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': 2 }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' }),
    ]);
    const baseInput = 'w-full px-3.5 py-2.5 rounded-xl bg-bg-1 border text-ink text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all';
    return () => [
      h('div', { key: 'pw' }, [
        h('label', { class: 'block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5' }, 'Password'),
        h('div', { class: 'relative' }, [
          h('input', {
            value: props.password,
            type: showPass.value ? 'text' : 'password',
            placeholder: 'Minimum 8 characters',
            autocomplete: 'new-password',
            class: props.errors.password ? `${baseInput} border-danger/60 pr-10` : `${baseInput} border-border focus:border-primary/60 pr-10`,
            onInput: (e: Event) => emit('update:password', (e.target as HTMLInputElement).value),
          }),
          h('button', { type: 'button', class: 'absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-soft transition-colors', onClick: () => { showPass.value = !showPass.value; } }, [showPass.value ? eyeOff() : eyeOn()]),
        ]),
        props.password ? h('div', { class: 'mt-2 flex items-center gap-2' }, [
          h('div', { class: 'flex gap-1 flex-1' }, [1,2,3,4].map(i => h('div', { key: i, class: `h-1 flex-1 rounded-full transition-all duration-300 ${i <= str.value.score ? str.value.color : 'bg-border'}` }))),
          h('span', { class: 'text-xs text-ink-muted whitespace-nowrap' }, str.value.label),
        ]) : null,
        props.errors.password ? h('p', { class: 'text-danger text-xs mt-1' }, props.errors.password) : null,
      ]),
      h('div', { key: 'cf' }, [
        h('label', { class: 'block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5' }, 'Confirm password'),
        h('div', { class: 'relative' }, [
          h('input', {
            value: props.confirm,
            type: showConf.value ? 'text' : 'password',
            placeholder: 'Repeat your password',
            autocomplete: 'new-password',
            class: props.errors.confirmPassword
              ? `${baseInput} border-danger/60 pr-16`
              : props.confirm && props.password === props.confirm
                ? `${baseInput} border-success/50 pr-16`
                : `${baseInput} border-border focus:border-primary/60 pr-16`,
            onInput: (e: Event) => emit('update:confirm', (e.target as HTMLInputElement).value),
          }),
          props.confirm ? h('div', { class: 'absolute right-9 top-1/2 -translate-y-1/2' }, [
            props.password === props.confirm
              ? h('svg', { class: 'w-4 h-4 text-success', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': 2.5 }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M5 13l4 4L19 7' })])
              : h('svg', { class: 'w-4 h-4 text-danger/70', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': 2.5 }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6 18L18 6M6 6l12 12' })]),
          ]) : null,
          h('button', { type: 'button', class: 'absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-soft transition-colors', onClick: () => { showConf.value = !showConf.value; } }, [showConf.value ? eyeOff() : eyeOn()]),
        ]),
        props.errors.confirmPassword ? h('p', { class: 'text-danger text-xs mt-1' }, props.errors.confirmPassword) : null,
      ]),
    ];
  },
});

// ── State ─────────────────────────────────────────────────────────────────────
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const phase = ref<Phase>('loading');
const invite = ref<InviteValidation | null>(null);
const inviteError = ref('');
const inviteToken = ref('');
const verifyEmail = ref('');

const inviteForm = ref({ name: '', displayName: '', password: '', confirmPassword: '' });
const inviteErrors = ref<Record<string, string>>({});

const codeForm = ref({ email: '', username: '', role: 'ADMIN' as 'ADMIN' | 'MODERATOR' | 'CREATOR', password: '', confirmPassword: '', adminSignupCode: '' });
const codeErrors = ref<Record<string, string>>({});

const submitError = ref('');
const isSubmitting = ref(false);

// ── Helpers ───────────────────────────────────────────────────────────────────
const roleLabel = computed(() => {
  const r = invite.value?.role ?? '';
  if (r === 'SUPER_ADMIN') return 'Super Admin';
  if (r === 'ADMIN') return 'Administrator';
  if (r === 'MODERATOR') return 'Moderator';
  if (r === 'CREATOR') return 'Creator';
  return r || 'Team member';
});

function inputClass(errors: Record<string, string>, key: string): string {
  const base = 'w-full px-3.5 py-2.5 rounded-xl bg-bg-1 border text-ink text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all';
  return errors[key] ? `${base} border-danger/60` : `${base} border-border focus:border-primary/60`;
}

function validateInviteForm(): boolean {
  inviteErrors.value = {};
  if (!inviteForm.value.name.trim()) inviteErrors.value.name = 'Full name is required';
  if (!inviteForm.value.displayName.trim()) inviteErrors.value.displayName = 'Display name is required';
  if (inviteForm.value.password.length < 8) inviteErrors.value.password = 'Password must be at least 8 characters';
  if (inviteForm.value.password !== inviteForm.value.confirmPassword) inviteErrors.value.confirmPassword = 'Passwords do not match';
  return Object.keys(inviteErrors.value).length === 0;
}

function validateCodeForm(): boolean {
  codeErrors.value = {};
  if (!codeForm.value.email.includes('@')) codeErrors.value.email = 'Valid email required';
  if (codeForm.value.username.trim().length < 2) codeErrors.value.username = 'Display name must be at least 2 characters';
  if (codeForm.value.password.length < 8) codeErrors.value.password = 'Password must be at least 8 characters';
  if (codeForm.value.password !== codeForm.value.confirmPassword) codeErrors.value.confirmPassword = 'Passwords do not match';
  if (!codeForm.value.adminSignupCode.trim()) codeErrors.value.adminSignupCode = 'Access code is required';
  return Object.keys(codeErrors.value).length === 0;
}

// ── Submit handlers ───────────────────────────────────────────────────────────
async function submitInvite() {
  if (!validateInviteForm()) return;
  isSubmitting.value = true;
  submitError.value = '';
  try {
    const session = await acceptInvite({
      token: inviteToken.value,
      name: inviteForm.value.name,
      displayName: inviteForm.value.displayName,
      password: inviteForm.value.password,
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
    submitError.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}

async function submitCode() {
  if (!validateCodeForm()) return;
  isSubmitting.value = true;
  submitError.value = '';
  try {
    const session = await registerWithCode({
      email: codeForm.value.email,
      password: codeForm.value.password,
      username: codeForm.value.username,
      role: codeForm.value.role,
      adminSignupCode: codeForm.value.adminSignupCode,
    });
    if (!session.accessToken) {
      verifyEmail.value = codeForm.value.email;
      phase.value = 'verify-email';
      return;
    }
    authStore.applyExternalSession(session);
    phase.value = 'success';
    setTimeout(() => void router.replace('/dashboard'), 1400);
  } catch (e: unknown) {
    const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? '';
    if (code === 'AUTH_ADMIN_CODE_INVALID') {
      codeErrors.value.adminSignupCode = 'Invalid access code';
      return;
    }
    if (code === 'AUTH_ADMIN_DISABLED') {
      submitError.value = 'Admin self-registration is not enabled. Ask your administrator for an invite link.';
      return;
    }
    submitError.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}

// ── Mount ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const t = String(route.query.token ?? '').trim();
  if (!t || t.length < 32) {
    phase.value = 'code-form';
    return;
  }
  inviteToken.value = t;
  try {
    invite.value = await validateInvite(t);
    phase.value = 'invite-form';
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
