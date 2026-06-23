<template>
  <div class="space-y-2">
    <!-- Drop zone -->
    <div
      :class="[
        'relative border-2 border-dashed rounded-xl transition-all cursor-pointer select-none',
        isDragging  ? 'border-primary bg-primary/6 scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-white/2',
        isUploading ? 'pointer-events-none' : '',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="!isUploading && triggerInput()"
    >
      <input
        ref="inputRef"
        type="file"
        :accept="accept"
        class="hidden"
        @change="onInputChange"
      />

      <!-- Idle state -->
      <div v-if="!isUploading && !uploadedFile" class="p-6 flex flex-col items-center gap-2 text-center">
        <div class="w-10 h-10 rounded-xl bg-white/6 flex items-center justify-center mb-1">
          <svg class="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <p class="text-sm font-medium text-ink-muted">{{ label }}</p>
        <p class="text-xs text-ink-muted/60">Drop file here or click to browse</p>
        <p class="text-[10px] text-ink-muted/50 mt-0.5">
          {{ acceptLabel }} · max {{ maxMb >= 1000 ? `${maxMb / 1000} GB` : `${maxMb} MB` }}
        </p>
      </div>

      <!-- Uploading state -->
      <div v-else-if="isUploading" class="p-5 space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-ink truncate">{{ pendingFile?.name }}</p>
            <p class="text-[10px] text-ink-muted">{{ formatBytes(pendingFile?.size ?? 0) }} · Uploading…</p>
          </div>
          <span class="text-xs font-bold text-primary tabular-nums">{{ progress }}%</span>
        </div>
        <!-- Progress bar -->
        <div class="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary to-primary-soft rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <p class="text-[10px] text-ink-muted text-center">{{ uploadStage }}</p>
      </div>

      <!-- Uploaded state -->
      <div v-else-if="uploadedFile" class="p-4 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-green-500/12 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-ink truncate">{{ uploadedFile.name }}</p>
          <p class="text-[10px] text-ink-muted">{{ formatBytes(uploadedFile.size) }} · Uploaded</p>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg hover:bg-white/8 text-ink-muted hover:text-ink transition-colors"
          title="Replace file"
          @click.stop="reset"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Error -->
    <p v-if="uploadError" class="text-xs text-danger flex items-center gap-1.5 px-1">
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
      </svg>
      {{ uploadError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { uploadFile } from '@/api/uploads';

const props = withDefaults(defineProps<{
  label: string;
  accept?: string;
  folder?: string;
  maxMb?: number;
}>(), { accept: '*', folder: 'content', maxMb: 500 });

const emit = defineEmits<{
  (e: 'uploaded', url: string): void;
  (e: 'reset'): void;
}>();

const inputRef    = ref<HTMLInputElement | null>(null);
const isDragging  = ref(false);
const isUploading = ref(false);
const progress    = ref(0);
const uploadError = ref('');
const uploadStage = ref('Preparing…');
const pendingFile = ref<File | null>(null);
const uploadedFile = ref<{ name: string; size: number } | null>(null);

const acceptLabel = computed(() => {
  if (!props.accept || props.accept === '*') return 'Any file';
  return props.accept.replace(/\*/g, '').replace(/,/g, ' / ').replace(/\//g, '').toUpperCase();
});

function triggerInput(): void {
  inputRef.value?.click();
}

function reset(): void {
  uploadedFile.value = null;
  uploadError.value = '';
  progress.value = 0;
  pendingFile.value = null;
  if (inputRef.value) inputRef.value.value = '';
  emit('reset');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

async function handleFile(file: File): Promise<void> {
  const maxBytes = props.maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    uploadError.value = `File too large — max is ${props.maxMb >= 1000 ? `${props.maxMb / 1000} GB` : `${props.maxMb} MB`}`;
    return;
  }

  isUploading.value = true;
  uploadError.value = '';
  progress.value = 0;
  pendingFile.value = file;
  uploadedFile.value = null;

  const isMedia = file.type.startsWith('audio/') || file.type.startsWith('video/');

  try {
    uploadStage.value = isMedia ? 'Requesting upload URL…' : 'Uploading…';
    const { publicUrl } = await uploadFile(file, props.folder, (pct) => {
      progress.value = pct;
      if (pct < 30) uploadStage.value = isMedia ? 'Requesting upload URL…' : 'Uploading…';
      else if (pct < 95) uploadStage.value = 'Uploading file…';
      else uploadStage.value = 'Verifying…';
    });
    progress.value = 100;
    uploadStage.value = 'Done!';
    uploadedFile.value = { name: file.name, size: file.size };
    emit('uploaded', publicUrl);
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : 'Upload failed — please try again';
    pendingFile.value = null;
  } finally {
    isUploading.value = false;
  }
}

function onDrop(e: DragEvent): void {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) void handleFile(file);
}

function onInputChange(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) void handleFile(file);
}
</script>
