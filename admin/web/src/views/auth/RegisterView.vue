<template>
  <AuthPageLayout>

    <template #panel>
      <div class="max-w-[380px]">
        <p class="text-[11px] font-bold uppercase tracking-[0.2em] mb-5 text-primary-soft/80">Admin workspace</p>
        <h1 class="text-display font-bold leading-[1.06] mb-6 text-ink">
          Manage your<br/>
          <span class="text-brand-gradient">
            ministry content.
          </span>
        </h1>
        <p class="text-sm leading-relaxed mb-10 text-ink-soft">
          Upload music, sermons, and videos. Control the mobile app experience. Monitor your audience — all from one place.
        </p>

        <div class="space-y-4">
          <div v-for="feat in panelFeatures" :key="feat.label" class="flex items-start gap-3">
            <div class="auth-logo w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <component :is="feat.icon" class="w-3.5 h-3.5 text-primary-soft" />
            </div>
            <div>
              <p class="text-ink/90 text-xs font-semibold">{{ feat.label }}</p>
              <p class="text-ink-muted text-xs leading-snug mt-0.5">{{ feat.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Form area ─────────────────────────────────────────────────────────────── -->
    <Transition name="slide" mode="out-in">

      <!-- LOADING -->
      <div v-if="phase === 'loading'" key="loading" class="text-center py-16 space-y-4">
        <div class="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <p class="text-ink-soft text-sm">Verifying your invitation…</p>
      </div>

      <!-- INVALID INVITE -->
      <div v-else-if="phase === 'invalid'" key="invalid" class="space-y-6">
        <div class="feedback-danger w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle class="w-8 h-8 text-danger" />
        </div>
        <div class="text-center">
          <h2 class="text-ink text-xl font-bold mb-2">
            {{ inviteError === 'INVITE_EXPIRED' ? 'Invitation expired' : inviteError === 'INVITE_USED' ? 'Already accepted' : 'Invalid invitation' }}
          </h2>
          <p class="text-ink-soft text-sm leading-relaxed">
            <template v-if="inviteError === 'INVITE_EXPIRED'">This invitation has expired. Ask your administrator to send a new one.</template>
            <template v-else-if="inviteError === 'INVITE_USED'">This invitation was already used to create an account.</template>
            <template v-else>This invitation link is invalid or revoked. Contact your administrator.</template>
          </p>
        </div>
        <RouterLink to="/login" class="flex items-center justify-center gap-2 text-primary-soft hover:text-primary text-sm font-medium transition-colors">
          <ArrowLeft class="w-4 h-4" />
          Back to sign in
        </RouterLink>
      </div>

      <!-- INVITE FORM -->
      <div v-else-if="phase === 'invite-form'" key="invite-form" class="space-y-6">
        <div class="auth-pill inline-flex items-center gap-2 px-3 py-1.5 rounded-full">
          <Mail class="w-3.5 h-3.5 text-primary-soft" />
          <span class="text-primary-soft text-xs font-medium">Invited by {{ invite?.inviterName || 'your admin' }}</span>
        </div>
        <div>
          <h2 class="text-ink text-2xl font-black tracking-tight mb-1">Set up your account</h2>
          <p class="text-ink-muted text-sm">Create your password to complete your account setup.</p>
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
        <p class="text-center text-xs text-ink-muted/50 pt-2">
          Already have an account?
          <RouterLink to="/login" class="text-primary-soft hover:text-primary font-medium ml-1 transition-colors">Sign in</RouterLink>
        </p>
      </div>

      <!-- INVITATION REQUIRED -->
      <div v-else-if="phase === 'access-required'" key="access-required" class="space-y-6 text-center py-8">
        <div class="auth-logo w-14 h-14 rounded-2xl flex items-center justify-center mx-auto">
          <Shield class="w-7 h-7 text-primary-soft" />
        </div>
        <div>
          <h2 class="text-ink text-xl font-bold mb-2">Invitation required</h2>
          <p class="text-ink-soft text-sm leading-relaxed">
            Privileged accounts cannot be created with a shared code. A Super Admin must review access and send a single-use invitation.
          </p>
        </div>
        <div class="grid gap-2">
          <RouterLink to="/request-access" class="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-base">Request access</RouterLink>
          <RouterLink to="/login" class="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-hover transition-base">Back to sign in</RouterLink>
        </div>
      </div>

      <!-- SUCCESS -->
      <div v-else-if="phase === 'success'" key="success" class="text-center py-10 space-y-5">
        <div class="feedback-success w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-8 h-8 text-success" />
        </div>
        <div>
          <h2 class="text-ink text-xl font-bold mb-1">Welcome to the team!</h2>
          <p class="text-ink-soft text-sm">Your account is ready. Taking you to the dashboard…</p>
        </div>
        <div class="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </div>

    </Transition>

  </AuthPageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import {
  AlertTriangle, ArrowLeft, BarChart2, CheckCircle2,
  FileText, Mail, PlayCircle, Shield,
} from 'lucide-vue-next';
import { validateInvite, acceptInvite } from '@/api/auth';
import type { InviteValidation } from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import AuthPageLayout from '@/components/layout/AuthPageLayout.vue';

type Phase = 'loading' | 'invalid' | 'invite-form' | 'access-required' | 'success';

const panelFeatures = [
  { label: 'Content management', desc: 'Upload music, sermons, and videos. Assign to sections instantly.', icon: FileText    },
  { label: 'YouTube import',      desc: 'Browse your channel and import videos directly to the app.',       icon: PlayCircle  },
  { label: 'Audience analytics',  desc: 'See who\'s listening, what\'s trending, and when they tune in.',   icon: BarChart2   },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

const FieldGroup = defineComponent({
  props: { label: String, hint: String, error: String },
  setup(props, { slots }) {
    return () => h('div', { class: 'space-y-1.5' }, [
      h('label', { class: 'flex items-center gap-1.5 text-xs font-semibold text-ink-muted' }, [
        props.label,
        props.hint ? h('span', { class: 'font-normal text-ink-muted/50' }, `(${props.hint})`) : null,
      ]),
      slots.default?.(),
      props.error ? h('p', { class: 'text-danger text-xs mt-1' }, props.error) : null,
    ]);
  },
});

const FormInput = defineComponent({
  props: { modelValue: String, type: String, placeholder: String, autocomplete: String, hasError: Boolean },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const base = 'w-full py-2.5 rounded-xl bg-bg-1 border text-ink text-sm placeholder-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all';
    const hasIcon = !!slots.icon;
    return () => h('div', { class: 'relative' }, [
      hasIcon ? h('div', { class: 'absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none' }, slots.icon?.()) : null,
      h('input', {
        value: props.modelValue,
        type: props.type ?? 'text',
        placeholder: props.placeholder,
        autocomplete: props.autocomplete,
        class: [base, hasIcon ? 'pl-10 pr-4' : 'px-4', props.hasError ? 'border-danger/50' : 'border-border focus:border-primary/50'].join(' '),
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
  return { score, label: ['','Weak','Fair','Good','Strong'][score], color: ['','bg-danger','bg-amber','bg-info','bg-success'][score] };
}

const PasswordFields = defineComponent({
  props: { password: { type: String, required: true }, confirm: { type: String, required: true }, errors: { type: Object as () => Record<string,string>, required: true } },
  emits: ['update:password', 'update:confirm'],
  setup(props, { emit }) {
    const showPass = ref(false);
    const showConf = ref(false);
    const str = computed(() => calcStrength(props.password));
    const base = 'w-full pl-4 pr-10 py-2.5 rounded-xl bg-bg-1 border text-ink text-sm placeholder-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all';
    const EyeBtn = (show: boolean, toggle: () => void) => h('button', { type:'button', class:'absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-soft transition-colors', onClick: toggle }, [
      show
        ? h('svg',{class:'w-4 h-4',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2},[h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'})])
        : h('svg',{class:'w-4 h-4',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2},[h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M15 12a3 3 0 11-6 0 3 3 0 016 0z'}),h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'})]),
    ]);
    return () => [
      h('div',{class:'space-y-1.5'},[
        h('label',{class:'block text-xs font-semibold text-ink-muted'},'Password'),
        h('div',{class:'relative'},[
          h('input',{value:props.password,type:showPass.value?'text':'password',placeholder:'Minimum 8 characters',autocomplete:'new-password',class:[base,props.errors.password?'border-danger/50':'border-border focus:border-primary/50'].join(' '),onInput:(e:Event)=>emit('update:password',(e.target as HTMLInputElement).value)}),
          EyeBtn(showPass.value,()=>{showPass.value=!showPass.value;}),
        ]),
        props.password?h('div',{class:'flex items-center gap-2 mt-1.5'},[h('div',{class:'flex gap-1 flex-1'},[1,2,3,4].map(i=>h('div',{key:i,class:`h-1 flex-1 rounded-full transition-all ${i<=str.value.score?str.value.color:'bg-border'}`}))),h('span',{class:'text-[10px] text-ink-muted whitespace-nowrap'},str.value.label)]):null,
        props.errors.password?h('p',{class:'text-danger text-xs mt-1'},props.errors.password):null,
      ]),
      h('div',{class:'space-y-1.5'},[
        h('label',{class:'block text-xs font-semibold text-ink-muted'},'Confirm password'),
        h('div',{class:'relative'},[
          h('input',{value:props.confirm,type:showConf.value?'text':'password',placeholder:'Repeat your password',autocomplete:'new-password',class:[base,'pr-16',props.errors.confirmPassword?'border-danger/50':props.confirm&&props.password===props.confirm?'border-success/40':'border-border focus:border-primary/50'].join(' '),onInput:(e:Event)=>emit('update:confirm',(e.target as HTMLInputElement).value)}),
          props.confirm?h('div',{class:'absolute right-9 top-1/2 -translate-y-1/2'},[props.password===props.confirm?h('svg',{class:'w-4 h-4 text-success',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2.5},[h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M5 13l4 4L19 7'})]):h('svg',{class:'w-4 h-4 text-danger/70',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2.5},[h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M6 18L18 6M6 6l12 12'})])]):null,
          EyeBtn(showConf.value,()=>{showConf.value=!showConf.value;}),
        ]),
        props.errors.confirmPassword?h('p',{class:'text-danger text-xs mt-1'},props.errors.confirmPassword):null,
      ]),
    ];
  },
});

const ErrorBanner = defineComponent({
  props: { message: { type: String, required: true } },
  setup(props) {
    return () => h('div',{class:'feedback-danger flex items-start gap-3 p-3.5 rounded-xl border'},[
      h('svg',{class:'w-4 h-4 text-danger flex-shrink-0 mt-0.5',fill:'none',viewBox:'0 0 24 24',stroke:'currentColor','stroke-width':2},[h('circle',{cx:'12',cy:'12',r:'10'}),h('path',{'stroke-linecap':'round','stroke-linejoin':'round',d:'M12 8v4m0 4h.01'})]),
      h('p',{class:'text-danger text-sm leading-snug'},props.message),
    ]);
  },
});

const SubmitButton = defineComponent({
  props: { loading: Boolean, label: { type: String, required: true } },
  setup(props) {
    return () => h('button',{type:'submit',disabled:props.loading,class:'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold bg-primary hover:bg-primary/90 shadow-glow transition-base mt-2'},[
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

const inviteForm = ref({ name: '', displayName: '', password: '', confirmPassword: '' });
const inviteErrors = ref<Record<string,string>>({});
const submitError = ref('');
const isSubmitting = ref(false);

function validateInviteForm(): boolean {
  inviteErrors.value = {};
  if (!inviteForm.value.name.trim()) inviteErrors.value.name = 'Full name is required';
  if (!inviteForm.value.displayName.trim()) inviteErrors.value.displayName = 'Display name is required';
  if (inviteForm.value.password.length < 12) inviteErrors.value.password = 'Use at least 12 characters';
  else if (!/[a-z]/.test(inviteForm.value.password) || !/[A-Z]/.test(inviteForm.value.password) || !/[0-9]/.test(inviteForm.value.password) || !/[^A-Za-z0-9]/.test(inviteForm.value.password)) inviteErrors.value.password = 'Include uppercase, lowercase, number, and symbol';
  if (inviteForm.value.password !== inviteForm.value.confirmPassword) inviteErrors.value.confirmPassword = 'Passwords do not match';
  return Object.keys(inviteErrors.value).length === 0;
}

async function submitInvite() {
  if (!validateInviteForm()) return;
  isSubmitting.value = true; submitError.value = '';
  try {
    const session = await acceptInvite({ token: inviteToken.value, name: inviteForm.value.name, displayName: inviteForm.value.displayName, password: inviteForm.value.password });
    authStore.applyExternalSession(session);
    phase.value = 'success';
    setTimeout(() => void router.replace('/choose-workspace'), 1400);
  } catch (e: unknown) {
    const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code ?? '';
    if (['INVITE_EXPIRED','INVITE_USED','INVITE_REVOKED'].includes(code)) { inviteError.value = code; phase.value = 'invalid'; return; }
    submitError.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong.';
  } finally { isSubmitting.value = false; }
}

onMounted(async () => {
  const t = String(route.query.token ?? '').trim();
  if (!t || t.length < 32) { phase.value = 'access-required'; return; }
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
