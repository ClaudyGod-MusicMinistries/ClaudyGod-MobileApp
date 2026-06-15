<template>
  <AuthLayout>
    <!-- Success state -->
    <div v-if="success" class="text-center space-y-5">
      <div class="w-14 h-14 rounded-2xl bg-success/15 border border-success/30 flex items-center justify-center mx-auto">
        <svg class="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      </div>
      <div>
        <h2 class="text-xl font-bold text-ink">Check your inbox</h2>
        <p class="text-sm text-ink-muted mt-2 leading-relaxed">
          Account created for <strong class="text-ink-soft">{{ registeredEmail }}</strong>.<br/>
          Open the verification link sent to your email to activate access.
        </p>
      </div>
      <RouterLink
        to="/login"
        class="block w-full text-center py-2.5 text-sm font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary/8 transition-colors">
        Back to sign in
      </RouterLink>
    </div>

    <!-- Registration form -->
    <form v-else class="space-y-4" @submit.prevent="onRegister">
      <div class="text-center mb-5">
        <h2 class="text-xl font-bold text-ink">Create admin account</h2>
        <p class="text-sm text-ink-muted mt-1">You need a valid admin access code</p>
      </div>

      <div v-if="errorMsg" class="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
        {{ errorMsg }}
      </div>

      <AppInput
        v-model="form.username"
        label="Full name"
        type="text"
        placeholder="Your name"
        required
        autocomplete="name"
        id="reg-name"
      />
      <AppInput
        v-model="form.email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        required
        autocomplete="email"
        id="reg-email"
      />
      <AppInput
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
        autocomplete="new-password"
        id="reg-password"
      />

      <!-- Admin signup code -->
      <div>
        <AppInput
          v-model="form.adminSignupCode"
          label="Admin access code"
          type="text"
          placeholder="Provided by your administrator"
          required
          autocomplete="off"
          id="reg-code"
        />
        <p class="text-[11px] text-ink-muted mt-1.5 pl-0.5">
          Contact your system administrator if you don't have this code.
        </p>
      </div>

      <AppButton type="submit" :loading="isLoading" full-width size="lg" class="mt-2">
        Create account
      </AppButton>

      <p class="text-center text-sm text-ink-muted pt-1">
        Already have an account?
        <RouterLink to="/login" class="text-primary font-semibold hover:text-primary-soft transition-colors">
          Sign in
        </RouterLink>
      </p>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { register } from '@/api/auth';
import AuthLayout from '@/components/layout/AuthLayout.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const isLoading = ref(false);
const errorMsg = ref<string | null>(null);
const success = ref(false);
const registeredEmail = ref('');

const form = reactive({
  username: '',
  email: '',
  password: '',
  adminSignupCode: '',
});

async function onRegister(): Promise<void> {
  errorMsg.value = null;
  isLoading.value = true;
  try {
    await register({ ...form, role: 'ADMIN' });
    registeredEmail.value = form.email;
    success.value = true;
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Registration failed. Check your access code and try again.';
  } finally {
    isLoading.value = false;
  }
}
</script>
