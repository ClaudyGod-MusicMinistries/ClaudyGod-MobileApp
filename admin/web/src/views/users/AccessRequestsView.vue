<template>
  <div class="space-y-5">

    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-base font-bold text-ink">Access requests</h2>
        <p class="text-xs text-ink-muted mt-0.5">People requesting admin portal access. Send an invite to approve.</p>
      </div>
      <AppButton variant="secondary" size="sm" :loading="isLoading" @click="loadRequests">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </template>
        Refresh
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !requests.length" class="flex items-center justify-center py-20">
      <AppSpinner size="lg" />
    </div>

    <!-- Empty -->
    <AppCard v-else-if="!requests.length" class="p-10 text-center">
      <div class="w-12 h-12 rounded-2xl bg-surface-strong border border-border flex items-center justify-center mx-auto mb-3">
        <svg class="w-6 h-6 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
      </div>
      <p class="text-sm font-semibold text-ink">No pending requests</p>
      <p class="text-xs text-ink-muted mt-1">New access requests will appear here.</p>
    </AppCard>

    <!-- Requests table -->
    <AppCard v-else class="overflow-hidden divide-y divide-border">
      <div
        v-for="req in requests"
        :key="req.id"
        class="flex items-start gap-4 p-4 hover:bg-surface-strong/50 transition-colors"
      >
        <!-- Avatar -->
        <UserAvatar :name="req.name" :email="req.email" size="sm" class="flex-shrink-0 mt-0.5" />

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-semibold text-ink truncate">{{ req.name }}</p>
            <RolePill :role="roleRank(req.role)" />
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                req.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-red-500/10 text-red-400 border border-red-500/20',
              ]"
            >{{ req.status }}</span>
          </div>
          <p class="text-xs text-ink-muted mt-0.5">{{ req.email }}</p>
          <p v-if="req.message" class="text-xs text-ink-soft mt-1.5 leading-snug line-clamp-2 italic">"{{ req.message }}"</p>
          <p class="text-[10px] text-ink-muted mt-1.5">Submitted {{ formatDate(req.createdAt) }}</p>
        </div>

        <!-- Actions -->
        <div v-if="req.status === 'pending'" class="flex gap-2 flex-shrink-0">
          <AppButton
            variant="primary"
            size="sm"
            :loading="actingOn === req.id + '-approve'"
            @click="approve(req)"
          >
            Send invite
          </AppButton>
          <AppButton
            variant="ghost"
            size="sm"
            :loading="actingOn === req.id + '-reject'"
            @click="reject(req)"
          >
            Dismiss
          </AppButton>
        </div>

        <!-- Reviewed info -->
        <div v-else class="flex-shrink-0 text-right">
          <p class="text-[10px] text-ink-muted">{{ formatDate(req.reviewedAt ?? req.createdAt) }}</p>
        </div>
      </div>
    </AppCard>

    <!-- Role modal for approve -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="approveTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="approveTarget = null" />
          <div class="relative z-10 w-full max-w-sm bg-surface rounded-2xl border border-border p-6 space-y-5 shadow-2xl">
            <div>
              <h3 class="text-sm font-bold text-ink">Send invitation to {{ approveTarget.name }}</h3>
              <p class="text-xs text-ink-muted mt-0.5">Choose the role this person will receive.</p>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="r in ROLE_OPTIONS"
                :key="r.value"
                type="button"
                :class="[
                  'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all',
                  approveRole === r.value
                    ? 'bg-primary/15 border-primary/30 text-primary-soft'
                    : 'bg-surface-strong border-border text-ink-muted hover:border-ink-muted',
                ]"
                @click="approveRole = r.value"
              >
                <span class="text-[11px] font-semibold">{{ r.label }}</span>
                <span class="text-[9px] text-ink-muted">{{ r.desc }}</span>
              </button>
            </div>

            <div v-if="approveError" class="text-xs text-danger p-3 rounded-xl bg-danger/8 border border-danger/20">
              {{ approveError }}
            </div>

            <div class="flex gap-2">
              <AppButton variant="primary" size="sm" :loading="approving" class="flex-1" @click="confirmApprove">
                Send invite email
              </AppButton>
              <AppButton variant="secondary" size="sm" @click="approveTarget = null">Cancel</AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { listAccessRequests, approveAccessRequest, rejectAccessRequest } from '@/api/auth';
import type { AccessRequest } from '@/api/auth';
import { roleRank } from '@/utils/constants';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import UserAvatar from '@/components/shared/UserAvatar.vue';
import RolePill from '@/components/shared/RolePill.vue';

const auth = useAuthStore();

const ROLE_OPTIONS = [
  { value: 'ADMIN' as const,     label: 'Admin',     desc: 'Full access' },
  { value: 'MODERATOR' as const, label: 'Moderator', desc: 'Review' },
  { value: 'CREATOR' as const,   label: 'Creator',   desc: 'Upload' },
];

const requests = ref<AccessRequest[]>([]);
const isLoading = ref(false);
const actingOn = ref('');

const approveTarget = ref<AccessRequest | null>(null);
const approveRole = ref<'ADMIN' | 'MODERATOR' | 'CREATOR'>('MODERATOR');
const approving = ref(false);
const approveError = ref('');

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function loadRequests() {
  isLoading.value = true;
  try {
    const res = await listAccessRequests();
    requests.value = res.requests;
  } catch { /* silently fail */ }
  finally { isLoading.value = false; }
}

function approve(req: AccessRequest) {
  approveTarget.value = req;
  approveRole.value = req.role as 'ADMIN' | 'MODERATOR' | 'CREATOR';
  approveError.value = '';
}

async function confirmApprove() {
  if (!approveTarget.value) return;
  approving.value = true;
  approveError.value = '';
  try {
    await approveAccessRequest(approveTarget.value.id, {
      role: approveRole.value,
      invitedBy: auth.user!.id,
    });
    requests.value = requests.value.map(r =>
      r.id === approveTarget.value!.id ? { ...r, status: 'approved' as const } : r,
    );
    approveTarget.value = null;
  } catch (e: unknown) {
    approveError.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send invite.';
  } finally {
    approving.value = false;
  }
}

async function reject(req: AccessRequest) {
  actingOn.value = req.id + '-reject';
  try {
    await rejectAccessRequest(req.id);
    requests.value = requests.value.map(r =>
      r.id === req.id ? { ...r, status: 'rejected' as const } : r,
    );
  } catch { /* silently fail */ }
  finally { actingOn.value = ''; }
}

onMounted(loadRequests);
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
