<template>
  <div class="min-h-screen bg-[#07050C] flex">

    <!-- ── Left brand panel (hidden on mobile) ─────────────────────────────── -->
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
          Manage your<br />ministry content.
        </h1>
        <p class="text-white/50 text-sm leading-relaxed mb-10">
          Upload music, sermons, and videos. Control the mobile app experience. Monitor your audience — all from one place.
        </p>

        <div class="space-y-4">
          <div v-for="feature in FEATURES" :key="feature.label" class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5" v-html="feature.icon" />
            <div>
              <p class="text-white/90 text-xs font-semibold">{{ feature.label }}</p>
              <p class="text-white/35 text-xs leading-snug mt-0.5">{{ feature.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <p class="relative z-10 text-white/20 text-xs">© {{ new Date().getFullYear() }} ClaudyGod Music Ministries</p>
    </div>

    <!-- ── Right form panel ────────────────────────────────────────────────── -->
    <div class="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      <div class="w-full max-w-md py-8">

        <!-- Mobile-only brand mark -->
        <div class="flex lg:hidden items-center gap-2.5 mb-8">
          <img :src="BRAND_LOGO_URL" alt="ClaudyGod" class="w-8 h-8 rounded-xl object-contain" />
          <div>
            <p class="text-white text-sm font-bold leading-none">ClaudyGod</p>
            <p class="text-white/40 text-xs">Admin Studio</p>
          </div>
        </div>

        <Transition name="slide" mode="out-in">

          <!-- LOADING -->
          <div v-if="phase === 'loading'" key="loading" class="text-center py-16 space-y-4">
            <div class="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
            <p class="text-white/50 text-sm">Verifying your invitation…</p>
          </div>

          <!-- INVALID INVITE -->
          <div v-else-if="phase === 'invalid'" key="invalid" class="space-y-6">
            <div class="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div class="text-center">
              <h2 class="text-white text-xl font-bold mb-2">
                {{ inviteError === 'INVITE_EXPIRED' ? 'Invitation expired' : inviteError === 'INVITE_USED' ? 'Already accepted' : 'Invalid invitation' }}
              </h2>
              <p class="text-white/50 text-sm leading-relaxed">
                <template v-if="inviteError === 'INVITE_EXPIRED'">This invitation has expired. Ask your administrator to send a new one.</template>
                <template v-else-if="inviteError === 'INVITE_USED'">This invitation was already used to create an account.</template>
                <template v-else>This invitation link is invalid or revoked. Contact your administrator.</template>
              </p>
            </div>
            <RouterLink to="/login" class="flex items-center justify-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to sign in
            </RouterLink>
          </div>

          <!-- INVITE FORM -->
          <div v-else-if="phase === 'invite-form'" key="invite-form" class="space-y-6">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
              <svg class="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span class="text-violet-300 text-xs font-medium">Invited by {{ invite?.inviterName || 'your admin' }}</span>
            </div>
            <div>
              <h2 class="text-white text-2xl font-black tracking-tight mb-1">Set up your account</h2>
              <p class="text-white/45 text-sm">Create your password to complete your account setup.</p>
            </div>
            <form @submit.prevent="submitInvite" novalidate class="space-y-4">
              <FieldGroup label="Full name" :error="inviteErrors.name">
                <FormInput v-model="inviteForm.name" type="text" placeholder="Your full name" autocomplete="name" :hasError="!!inviteErrors.name" />
              </FieldGroup>
              <FieldGroup label="Display name" hint="shown in the admin" :error="inviteErrors.displayName">
                <FormInput v-model="inviteForm.displayName" type="text" placeholder="e.g. john_admin" autocomplete="username" :hasError="!!inviteErrors.displayName" />
              </FieldGroup>
              <PasswordFields v-model:password="inviteForm.password" v-model:confirm="inviteForm.confirmPassword" :errors="inviteErrors" />
              <ErrorBanner v-if="submitError" :message="submitError" />
              <SubmitButton :loading="isSubmitting" label="Create account" />
            </form>
            <p class="text-center text-xs text-white/30 pt-2">
              Already have an account?
              <RouterLink to="/login" class="text-violet-400 hover:text-violet-300 font-medium ml-1 transition-colors">Sign in</RouterLink>
            </p>
          </div>

          <!-- CODE REGISTRATION FORM -->
          <div v-else-if="phase === 'code-form'" key="code-form" class="space-y-7">
            <div>
              <h2 class="text-white text-2xl font-black tracking-tight mb-1">Create admin account</h2>
              <p class="text-white/45 text-sm">Enter your details and the access code from your administrator.</p>
            </div>

            <form @submit.prevent="submitCode" novalidate class="space-y-6">

              <!-- Account details -->
              <div class="space-y-3">
                <p class="text-[10px] font-bold text-white/25 uppercase tracking-widest">Your details</p>
                <FieldGroup label="Email address" :error="codeErrors.email">
                  <FormInput v-model="codeForm.email" type="email" placeholder="you@example.com" autocomplete="email" :hasError="!!codeErrors.email">
                    <template #icon>
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </template>
                  </FormInput>
                </FieldGroup>
                <FieldGroup label="Display name" hint="visible in sidebar" :error="codeErrors.username">
                  <FormInput v-model="codeForm.username" type="text" placeholder="e.g. john_admin" autocomplete="username" :hasError="!!codeErrors.username">
                    <template #icon>
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </template>
                  </FormInput>
                </FieldGroup>
              </div>

              <!-- Role picker -->
              <div class="space-y-3">
                <p class="text-[10px] font-bold text-white/25 uppercase tracking-widest">Access level</p>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="r in ROLE_OPTIONS"
                    :key="r.value"
                    type="button"
                    :class="[
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                      codeForm.role === r.value
                        ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                        : 'bg-white/3 border-white/8 text-white/40 hover:border-white/15 hover:text-white/60',
                    ]"
                    @click="codeForm.role = r.value"
                  >
                    <span class="text-base leading-none">{{ r.emoji }}</span>
                    <span class="text-[11px] font-semibold leading-none mt-0.5">{{ r.label }}</span>
                    <span class="text-[9px] text-white/30 leading-none mt-0.5">{{ r.desc }}</span>
                  </button>
                </div>
              </div>

              <!-- Password -->
              <div class="space-y-3">
                <p class="text-[10px] font-bold text-white/25 uppercase tracking-widest">Password</p>
                <PasswordFields v-model:password="codeForm.password" v-model:confirm="codeForm.confirmPassword" :errors="codeErrors" />
              </div>

              <!-- Access code -->
              <div class="space-y-3">
                <p class="text-[10px] font-bold text-white/25 uppercase tracking-widest">Admin code</p>
                <FieldGroup label="Admin access code" hint="provided by your administrator" :error="codeErrors.adminSignupCode">
                  <div class="relative">
                    <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <input
                      v-model="codeForm.adminSignupCode"
                      type="password"
                      placeholder="Enter your access code"
                      autocomplete="off"
                      :class="[
                        'w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/4 border text-white/90 text-sm placeholder-white/20 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all',
                        codeErrors.adminSignupCode ? 'border-red-500/50' : 'border-white/8 focus:border-violet-500/40',
                      ]"
                    />
                  </div>
                </FieldGroup>
              </div>

              <ErrorBanner v-if="submitError" :message="submitError" />
              <SubmitButton :loading="isSubmitting" label="Create account" />
            </form>

            <p class="text-center text-xs text-white/30">
              Already have an account?
              <RouterLink to="/login" class="text-violet-400 hover:text-violet-300 font-medium ml-1 transition-colors">Sign in</RouterLink>
            </p>
          </div>

          <!-- SUCCESS -->
          <div v-else-if="phase === 'success'" key="success" class="text-center py-10 space-y-5">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-white text-xl font-bold mb-1">Welcome to the team!</h2>
              <p class="text-white/45 text-sm">Your account is ready. Taking you to the dashboard…</p>
            </div>
            <div class="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
          </div>

          <!-- VERIFY EMAIL -->
          <div v-else-if="phase === 'verify-email'" key="verify-email" class="text-center py-10 space-y-5">
            <div class="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <h2 class="text-white text-xl font-bold mb-1">Check your inbox</h2>
              <p class="text-white/45 text-sm leading-relaxed">
                We sent a verification link to<br />
                <span class="text-violet-400 font-semibold">{{ verifyEmail }}</span>
              </p>
            </div>
            <RouterLink to="/login" class="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to sign in
            </RouterLink>
          </div>

        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { validateInvite, acceptInvite, registerWithCode } from '@/api/auth';
import type { InviteValidation } from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import { BRAND_LOGO_URL } from '@/utils/constants';

type Phase = 'loading' | 'invalid' | 'invite-form' | 'code-form' | 'success' | 'verify-email';

const FEATURES = [
  { label: 'Content management', desc: 'Upload music, sermons, and videos. Assign to sections instantly.', icon: '<svg class="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' },
  { label: 'YouTube import', desc: 'Browse your channel and import videos directly to the app.', icon: '<svg class="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' },
  { label: 'Audience analytics', desc: "See who's listening, what's trending, and when they tune in.", icon: '<svg class="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>' },
];

const ROLE_OPTIONS = [
  { value: 'ADMIN' as const,     label: 'Admin',     emoji: '🛡️', desc: 'Full platform access' },
  { value: 'MODERATOR' as const, label: 'Moderator', emoji: '👁️', desc: 'Review content' },
  { value: 'CREATOR' as const,   label: 'Creator',   emoji: '✏️', desc: 'Create & upload' },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

const FieldGroup = defineComponent({
  props: { label: String, hint: String, error: String },
  setup(props, { slots }) {
    return () => h('div', { class: 'space-y-1.5' }, [
      h('label', { class: 'flex items-center gap-1.5 text-xs font-semibold text-white/50' }, [
        props.label,
        props.hint ? h('span', { class: 'font-normal text-white/25' }, `(${props.hint})`) : null,
      ]),
      slots.default?.(),
      props.error ? h('p', { class: 'text-red-400 text-xs mt-1' }, props.error) : null,
    ]);
  },
});

const FormInput = defineComponent({
  props: { modelValue: String, type: String, placeholder: String, autocomplete: String, hasError: Boolean },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const base = 'w-full py-2.5 rounded-xl bg-white/4 border text-white/90 text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all';
    const hasIcon = !!slots.icon;
    return () => h('div', { class: 'relative' }, [
      hasIcon ? h('div', { class: 'absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none' }, slots.icon?.()) : null,
      h('input', {
        value: props.modelValue,
        type: props.type ?? 'text',
        placeholder: props.placeholder,
        autocomplete: props.autocomplete,
        class: [base, hasIcon ? 'pl-10 pr-4' : 'px-4', props.hasError ? 'border-red-500/50' : 'border-white/8 focus:border-violet-500/40'].join(' '),
        onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
      }),
    ]);
  },
});

function calcStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const score = Math.min(4, Math.ceil(s * 0.9)) as 0|1|2|3|4;
  return { score, label: ['','Weak','Fair','Good','Strong'][score], color: ['','bg-red-500','bg-amber-400','bg-blue-400','bg-emerald-500'][score] };
}

const PasswordFields = defineComponent({
  props: { password: { type: String, required: true }, confirm: { type: String, required: true }, errors: { type: Object as () => Record<string,string>, required: true } },
  emits: ['update:password', 'update:confirm'],
  setup(props, { emit }) {
    const showPass = ref(false);
    const showConf = ref(false);
    const str = computed(() => calcStrength(props.password));
    const base = 'w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/4 border text-white/90 text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all';
    const EyeBtn = (show: boolean, toggle: () => void) => h('button', { type:'button', class:'absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors', onClick: toggle }, [
      show
        ? h('svg',{class:'w-4 h-4',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2},[h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'})])
        : h('svg',{class:'w-4 h-4',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2},[h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M15 12a3 3 0 11-6 0 3 3 0 016 0z'}),h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'})]),
    ]);
    return () => [
      h('div',{class:'space-y-1.5'},[
        h('label',{class:'block text-xs font-semibold text-white/50'},'Password'),
        h('div',{class:'relative'},[
          h('input',{value:props.password,type:showPass.value?'text':'password',placeholder:'Minimum 8 characters',autocomplete:'new-password',class:[base,props.errors.password?'border-red-500/50':'border-white/8 focus:border-violet-500/40'].join(' '),onInput:(e:Event)=>emit('update:password',(e.target as HTMLInputElement).value)}),
          EyeBtn(showPass.value,()=>{showPass.value=!showPass.value;}),
        ]),
        props.password?h('div',{class:'flex items-center gap-2 mt-1.5'},[h('div',{class:'flex gap-1 flex-1'},[1,2,3,4].map(i=>h('div',{key:i,class:`h-1 flex-1 rounded-full transition-all ${i<=str.value.score?str.value.color:'bg-white/8'}`}))),h('span',{class:'text-[10px] text-white/35 whitespace-nowrap'},str.value.label)]):null,
        props.errors.password?h('p',{class:'text-red-400 text-xs mt-1'},props.errors.password):null,
      ]),
      h('div',{class:'space-y-1.5'},[
        h('label',{class:'block text-xs font-semibold text-white/50'},'Confirm password'),
        h('div',{class:'relative'},[
          h('input',{value:props.confirm,type:showConf.value?'text':'password',placeholder:'Repeat your password',autocomplete:'new-password',class:[base,'pr-16',props.errors.confirmPassword?'border-red-500/50':props.confirm&&props.password===props.confirm?'border-emerald-500/40':'border-white/8 focus:border-violet-500/40'].join(' '),onInput:(e:Event)=>emit('update:confirm',(e.target as HTMLInputElement).value)}),
          props.confirm?h('div',{class:'absolute right-9 top-1/2 -translate-y-1/2'},[props.password===props.confirm?h('svg',{class:'w-4 h-4 text-emerald-400',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2.5},[h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M5 13l4 4L19 7'})]):h('svg',{class:'w-4 h-4 text-red-400/70',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2.5},[h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M6 18L18 6M6 6l12 12'})])]):null,
          EyeBtn(showConf.value,()=>{showConf.value=!showConf.value;}),
        ]),
        props.errors.confirmPassword?h('p',{class:'text-red-400 text-xs mt-1'},props.errors.confirmPassword):null,
      ]),
    ];
  },
});

const ErrorBanner = defineComponent({
  props: { message: { type: String, required: true } },
  setup(props) {
    return () => h('div',{class:'flex items-start gap-3 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20'},[
      h('svg',{class:'w-4 h-4 text-red-400 flex-shrink-0 mt-0.5',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2},[h('circle',{cx:'12',cy:'12',r:'10'}),h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M12 8v4m0 4h.01'})]),
      h('p',{class:'text-red-400 text-sm leading-snug'},props.message),
    ]);
  },
});

const SubmitButton = defineComponent({
  props: { loading: Boolean, label: { type: String, required: true } },
  setup(props) {
    return () => h('button',{type:'submit',disabled:props.loading,class:'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-all mt-2 shadow-lg shadow-violet-500/20'},[
      props.loading?h('span',{class:'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'}):null,
      h('span',{},props.loading?'Creating account…':props.label),
    ]);
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
const inviteErrors = ref<Record<string,string>>({});
const codeForm = ref({ email: '', username: '', role: 'ADMIN' as 'ADMIN'|'MODERATOR'|'CREATOR', password: '', confirmPassword: '', adminSignupCode: '' });
const codeErrors = ref<Record<string,string>>({});
const submitError = ref('');
const isSubmitting = ref(false);


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
  if (codeForm.value.username.trim().length < 2) codeErrors.value.username = 'At least 2 characters';
  if (codeForm.value.password.length < 8) codeErrors.value.password = 'Password must be at least 8 characters';
  if (codeForm.value.password !== codeForm.value.confirmPassword) codeErrors.value.confirmPassword = 'Passwords do not match';
  if (!codeForm.value.adminSignupCode.trim()) codeErrors.value.adminSignupCode = 'Access code is required';
  return Object.keys(codeErrors.value).length === 0;
}

async function submitInvite() {
  if (!validateInviteForm()) return;
  isSubmitting.value = true; submitError.value = '';
  try {
    const session = await acceptInvite({ token: inviteToken.value, name: inviteForm.value.name, displayName: inviteForm.value.displayName, password: inviteForm.value.password });
    authStore.applyExternalSession(session);
    phase.value = 'success';
    setTimeout(() => void router.replace('/dashboard'), 1400);
  } catch (e: unknown) {
    const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? '';
    if (['INVITE_EXPIRED','INVITE_USED','INVITE_REVOKED'].includes(code)) { inviteError.value = code; phase.value = 'invalid'; return; }
    submitError.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong.';
  } finally { isSubmitting.value = false; }
}

async function submitCode() {
  if (!validateCodeForm()) return;
  isSubmitting.value = true; submitError.value = '';
  try {
    const session = await registerWithCode({ email: codeForm.value.email, password: codeForm.value.password, username: codeForm.value.username, role: codeForm.value.role, adminSignupCode: codeForm.value.adminSignupCode });
    if (!session.accessToken) { verifyEmail.value = codeForm.value.email; phase.value = 'verify-email'; return; }
    authStore.applyExternalSession(session);
    phase.value = 'success';
    setTimeout(() => void router.replace('/dashboard'), 1400);
  } catch (e: unknown) {
    const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? '';
    if (code === 'AUTH_ADMIN_CODE_INVALID') { codeErrors.value.adminSignupCode = 'Invalid access code'; return; }
    if (code === 'AUTH_ADMIN_DISABLED') { submitError.value = 'Admin self-registration is not enabled. Ask your administrator for an invite link.'; return; }
    submitError.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong.';
  } finally { isSubmitting.value = false; }
}

onMounted(async () => {
  const t = String(route.query.token ?? '').trim();
  if (!t || t.length < 32) { phase.value = 'code-form'; return; }
  inviteToken.value = t;
  try {
    invite.value = await validateInvite(t);
    phase.value = 'invite-form';
  } catch (e: unknown) {
    inviteError.value = (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? '';
    phase.value = 'invalid';
  }
});
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-enter-from { opacity: 0; transform: translateY(8px); }
.slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
