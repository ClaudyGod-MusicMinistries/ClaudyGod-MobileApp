<template>
  <AuthPageLayout>

    <template #panel>
      <div class="max-w-[380px]">
        <p class="text-[11px] font-bold uppercase tracking-[0.2em] mb-5 text-primary-soft/80">Access request</p>
        <h1 class="font-black leading-[1.06] mb-6 text-ink" style="font-size: clamp(2.2rem, 3.2vw, 2.9rem)">
          How access<br/>
          <span style="background: linear-gradient(92deg, #c4b5fd 0%, #818cf8 55%, #8b5cf6 100%); -webkit-background-clip: text; background-clip: text; color: transparent">
            works.
          </span>
        </h1>
        <p class="text-sm leading-relaxed mb-10 text-ink-soft">
          The admin portal is invite-only to protect your platform. Submit your request and a Super Admin will review it.
        </p>

        <div class="space-y-5">
          <div v-for="(step, i) in STEPS" :key="i" class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style="background: rgba(141,99,255,0.15); border: 1px solid rgba(141,99,255,0.30)">
              <span class="text-primary-soft text-[11px] font-bold">{{ i + 1 }}</span>
            </div>
            <div>
              <p class="text-ink/90 text-xs font-semibold">{{ step.title }}</p>
              <p class="text-ink-muted text-xs leading-snug mt-0.5">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Form area ─────────────────────────────────────────────────────────────── -->
    <Transition name="slide" mode="out-in">

      <!-- REQUEST FORM -->
      <div v-if="phase === 'form'" key="form" class="space-y-6">

        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
          style="background: rgba(141,99,255,0.10); border: 1px solid rgba(141,99,255,0.22)">
          <svg class="w-3.5 h-3.5 text-primary-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          <span class="text-primary-soft text-xs font-medium">Admin access request</span>
        </div>

        <div>
          <h2 class="text-ink text-2xl font-black tracking-tight mb-1">Request access</h2>
          <p class="text-ink-muted text-sm">Fill in your details and we'll send your request to the Super Admin for review.</p>
        </div>

        <form @submit.prevent="submit" novalidate class="space-y-4">

          <!-- Name -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-muted">Full name</label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <input v-model="form.name" type="text" placeholder="Your full name" autocomplete="name" :class="inputClass(errors.name)" />
            </div>
            <p v-if="errors.name" class="text-danger text-xs">{{ errors.name }}</p>
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-muted">Work email</label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <input v-model="form.email" type="email" placeholder="you@example.com" autocomplete="email" :class="inputClass(errors.email)" />
            </div>
            <p v-if="errors.email" class="text-danger text-xs">{{ errors.email }}</p>
          </div>

          <!-- Role -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-ink-muted">Requested role</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="r in ROLE_OPTIONS"
                :key="r.value"
                type="button"
                :class="[
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                  form.role === r.value
                    ? 'bg-primary/15 border-primary/40 text-primary-soft'
                    : 'bg-white/3 border-border text-ink-muted hover:border-border-strong hover:text-ink-soft',
                ]"
                @click="form.role = r.value"
              >
                <span class="text-[11px] font-semibold leading-none mt-1">{{ r.label }}</span>
                <span class="text-[9px] text-ink-muted/60 leading-none mt-0.5">{{ r.desc }}</span>
              </button>
            </div>
          </div>

          <!-- Message -->
          <div class="space-y-1.5">
            <label class="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              Message
              <span class="font-normal text-ink-muted/50">(optional)</span>
            </label>
            <textarea
              v-model="form.message"
              rows="3"
              placeholder="Tell us why you need access or your role in the ministry…"
              class="w-full px-4 py-2.5 rounded-xl bg-bg-1 border border-border text-ink text-sm placeholder-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all resize-none"
            />
          </div>

          <!-- Error -->
          <div v-if="submitError"
            class="flex items-start gap-3 p-3.5 rounded-xl border"
            style="background: rgba(225,109,109,0.08); border-color: rgba(225,109,109,0.22)">
            <svg class="w-4 h-4 text-danger flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/></svg>
            <p class="text-danger text-sm leading-snug">{{ submitError }}</p>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style="background: linear-gradient(135deg, #7c3aed, #6d28d9); box-shadow: 0 8px 24px rgba(109,40,217,0.25)"
          >
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {{ isSubmitting ? 'Sending request…' : 'Send access request' }}
          </button>
        </form>

        <p class="text-center text-xs text-ink-muted/50 pt-2">
          Already have an invite link?
          <RouterLink to="/register" class="text-primary-soft hover:text-primary font-medium ml-1 transition-colors">Use it here</RouterLink>
        </p>
        <p class="text-center text-xs text-ink-muted/50">
          Have an account?
          <RouterLink to="/login" class="text-primary-soft hover:text-primary font-medium ml-1 transition-colors">Sign in</RouterLink>
        </p>
      </div>

      <!-- SUCCESS -->
      <div v-else-if="phase === 'success'" key="success" class="text-center py-10 space-y-5">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style="background: rgba(52,211,153,0.10); border: 1px solid rgba(52,211,153,0.22)">
          <svg class="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <h2 class="text-ink text-xl font-bold mb-2">Request sent!</h2>
          <p class="text-ink-soft text-sm leading-relaxed max-w-xs mx-auto">
            Your request has been forwarded to the Super Admin. If approved, you'll receive an invitation email at
            <span class="text-primary-soft font-semibold">{{ form.email }}</span> with a link to set up your account.
          </p>
        </div>
        <div class="p-4 rounded-xl border text-left max-w-xs mx-auto"
          style="background: rgba(141,99,255,0.08); border-color: rgba(141,99,255,0.18)">
          <p class="text-xs text-ink-muted leading-relaxed">
            <strong class="text-ink-soft">What happens next:</strong><br />
            The Super Admin will review your request and send an invite link to your email. Check your inbox (and spam folder) within 24–48 hours.
          </p>
        </div>
        <RouterLink to="/login" class="inline-flex items-center gap-2 text-primary-soft hover:text-primary text-sm font-medium transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to sign in
        </RouterLink>
      </div>

    </Transition>

  </AuthPageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { requestAdminAccess } from '@/api/auth';
import AuthPageLayout from '@/components/layout/AuthPageLayout.vue';

type Phase = 'form' | 'success';

const STEPS = [
  { title: 'Submit your request',  desc: 'Enter your name, email, and the role you need on the platform.' },
  { title: 'Admin reviews',        desc: 'The Super Admin is notified and reviews your request.' },
  { title: 'Receive your invite',  desc: 'If approved, an invitation link is sent to your email — valid for 48 hours.' },
  { title: 'Set up your account',  desc: 'Click the link, choose a password, and you\'re in.' },
];

const ROLE_OPTIONS = [
  { value: 'ADMIN' as const,     label: 'Admin',     desc: 'Full access'     },
  { value: 'MODERATOR' as const, label: 'Moderator', desc: 'Review content'  },
  { value: 'CREATOR' as const,   label: 'Creator',   desc: 'Upload content'  },
];

const phase = ref<Phase>('form');
const isSubmitting = ref(false);
const submitError = ref('');

const form = ref({
  name: '',
  email: '',
  role: 'MODERATOR' as 'ADMIN' | 'MODERATOR' | 'CREATOR',
  message: '',
});

const errors = ref<Record<string, string>>({});

const inputClass = (hasError?: string) =>
  [
    'w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-1 border text-ink text-sm placeholder-ink-muted/40',
    'focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all',
    hasError ? 'border-danger/50' : 'border-border focus:border-primary/50',
  ].join(' ');

function validate(): boolean {
  errors.value = {};
  if (!form.value.name.trim()) errors.value.name = 'Full name is required';
  if (!form.value.email.includes('@')) errors.value.email = 'A valid email address is required';
  return Object.keys(errors.value).length === 0;
}

async function submit() {
  if (!validate()) return;
  isSubmitting.value = true;
  submitError.value = '';
  try {
    await requestAdminAccess({
      name: form.value.name.trim(),
      email: form.value.email.trim().toLowerCase(),
      role: form.value.role,
      message: form.value.message.trim() || undefined,
    });
    phase.value = 'success';
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    submitError.value = msg ?? 'Something went wrong. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-enter-from { opacity: 0; transform: translateY(8px); }
.slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
