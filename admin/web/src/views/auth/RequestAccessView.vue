<template>
  <div class="min-h-screen bg-[#07050C] flex">

    <!-- Left panel -->
    <div class="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#0D0B17] border-r border-white/6 p-10 relative overflow-hidden">
      <div class="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-3xl" />
      <div class="pointer-events-none absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-3xl" />

      <div class="relative z-10">
        <div class="flex items-center gap-3 mb-14">
          <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-9 h-9 rounded-xl object-contain" />
          <div>
            <p class="text-white text-sm font-bold leading-none">ClaudyGod</p>
            <p class="text-white/40 text-xs mt-0.5">Admin Studio</p>
          </div>
        </div>

        <h1 class="text-white text-3xl font-black tracking-tight leading-snug mb-4">
          How access<br />works.
        </h1>
        <p class="text-white/50 text-sm leading-relaxed mb-10">
          The admin portal is invite-only to protect your platform. Submit your request and a Super Admin will review it.
        </p>

        <div class="space-y-5">
          <div v-for="(step, i) in STEPS" :key="i" class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span class="text-violet-400 text-[11px] font-bold">{{ i + 1 }}</span>
            </div>
            <div>
              <p class="text-white/90 text-xs font-semibold">{{ step.title }}</p>
              <p class="text-white/35 text-xs leading-snug mt-0.5">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <p class="relative z-10 text-white/20 text-xs">© {{ year }} ClaudyGod Music Ministries</p>
    </div>

    <!-- Right form panel -->
    <div class="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      <div class="w-full max-w-md py-8">

        <!-- Mobile brand mark -->
        <div class="flex lg:hidden items-center gap-2.5 mb-8">
          <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-8 h-8 rounded-xl object-contain" />
          <div>
            <p class="text-white text-sm font-bold leading-none">ClaudyGod</p>
            <p class="text-white/40 text-xs">Admin Studio</p>
          </div>
        </div>

        <Transition name="slide" mode="out-in">

          <!-- REQUEST FORM -->
          <div v-if="phase === 'form'" key="form" class="space-y-6">

            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
              <svg class="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
              <span class="text-violet-300 text-xs font-medium">Admin access request</span>
            </div>

            <div>
              <h2 class="text-white text-2xl font-black tracking-tight mb-1">Request access</h2>
              <p class="text-white/45 text-sm">Fill in your details and we'll send your request to the Super Admin for review.</p>
            </div>

            <form @submit.prevent="submit" novalidate class="space-y-4">

              <!-- Name -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-white/50">Full name</label>
                <div class="relative">
                  <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="Your full name"
                    autocomplete="name"
                    :class="inputClass(errors.name)"
                  />
                </div>
                <p v-if="errors.name" class="text-red-400 text-xs">{{ errors.name }}</p>
              </div>

              <!-- Email -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-white/50">Work email</label>
                <div class="relative">
                  <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <input
                    v-model="form.email"
                    type="email"
                    placeholder="you@example.com"
                    autocomplete="email"
                    :class="inputClass(errors.email)"
                  />
                </div>
                <p v-if="errors.email" class="text-red-400 text-xs">{{ errors.email }}</p>
              </div>

              <!-- Role -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-white/50">Requested role</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="r in ROLE_OPTIONS"
                    :key="r.value"
                    type="button"
                    :class="[
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                      form.role === r.value
                        ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                        : 'bg-white/3 border-white/8 text-white/40 hover:border-white/15 hover:text-white/60',
                    ]"
                    @click="form.role = r.value"
                  >
                    <span class="text-[11px] font-semibold leading-none mt-1">{{ r.label }}</span>
                    <span class="text-[9px] text-white/30 leading-none mt-0.5">{{ r.desc }}</span>
                  </button>
                </div>
              </div>

              <!-- Message -->
              <div class="space-y-1.5">
                <label class="flex items-center gap-1.5 text-xs font-semibold text-white/50">
                  Message
                  <span class="font-normal text-white/25">(optional)</span>
                </label>
                <textarea
                  v-model="form.message"
                  rows="3"
                  placeholder="Tell us why you need access or your role in the ministry…"
                  class="w-full px-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-white/90 text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all resize-none"
                />
              </div>

              <!-- Error -->
              <div v-if="submitError" class="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20">
                <svg class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/></svg>
                <p class="text-red-400 text-sm leading-snug">{{ submitError }}</p>
              </div>

              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all mt-2 shadow-lg shadow-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                style="background: linear-gradient(135deg, #7c3aed, #6d28d9)"
              >
                <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {{ isSubmitting ? 'Sending request…' : 'Send access request' }}
              </button>
            </form>

            <p class="text-center text-xs text-white/30 pt-2">
              Already have an invite link?
              <RouterLink to="/register" class="text-violet-400 hover:text-violet-300 font-medium ml-1 transition-colors">Use it here</RouterLink>
            </p>
            <p class="text-center text-xs text-white/30">
              Have an account?
              <RouterLink to="/login" class="text-violet-400 hover:text-violet-300 font-medium ml-1 transition-colors">Sign in</RouterLink>
            </p>
          </div>

          <!-- SUCCESS -->
          <div v-else-if="phase === 'success'" key="success" class="text-center py-10 space-y-5">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <h2 class="text-white text-xl font-bold mb-2">Request sent!</h2>
              <p class="text-white/45 text-sm leading-relaxed max-w-xs mx-auto">
                Your request has been forwarded to the Super Admin. If approved, you'll receive an invitation email at
                <span class="text-violet-400 font-semibold">{{ form.email }}</span> with a link to set up your account.
              </p>
            </div>
            <div class="p-4 rounded-xl bg-violet-500/8 border border-violet-500/15 text-left max-w-xs mx-auto">
              <p class="text-xs text-white/50 leading-relaxed">
                <strong class="text-white/70">What happens next:</strong><br />
                The Super Admin will review your request and send an invite link to your email. Check your inbox (and spam folder) within 24–48 hours.
              </p>
            </div>
            <RouterLink to="/login" class="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to sign in
            </RouterLink>
          </div>

        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { BRAND_LOGO_URL } from '@/utils/constants';
import { requestAdminAccess } from '@/api/auth';

type Phase = 'form' | 'success';

const year = new Date().getFullYear();

const STEPS = [
  { title: 'Submit your request', desc: 'Enter your name, email, and the role you need on the platform.' },
  { title: 'Admin reviews', desc: 'The Super Admin is notified and reviews your request.' },
  { title: 'Receive your invite', desc: 'If approved, an invitation link is sent to your email — valid for 48 hours.' },
  { title: 'Set up your account', desc: 'Click the link, choose a password, and you\'re in.' },
];

const ROLE_OPTIONS = [
  { value: 'ADMIN' as const,     label: 'Admin',     desc: 'Full access' },
  { value: 'MODERATOR' as const, label: 'Moderator', desc: 'Review content' },
  { value: 'CREATOR' as const,   label: 'Creator',   desc: 'Upload content' },
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
    'w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/4 border text-white/90 text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all',
    hasError ? 'border-red-500/50' : 'border-white/8 focus:border-violet-500/40',
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
