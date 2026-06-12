<template>
  <div
    :class="['border-2 border-dashed rounded-xl p-6 text-center transition-colors', isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40']"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="onDrop"
  >
    <input
      :id="`drop-${label}`"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onInputChange"
    />
    <label :for="`drop-${label}`" class="cursor-pointer block">
      <template v-if="isUploading">
        <p class="text-xs text-ink-muted">Uploading… {{ progress }}%</p>
        <div class="mt-2 h-1 bg-white/10 rounded-full">
          <div class="h-1 bg-primary rounded-full transition-all" :style="{ width: `${progress}%` }" />
        </div>
      </template>
      <template v-else>
        <svg class="w-6 h-6 text-ink-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <p class="text-xs text-ink-muted">{{ label }} — drop or click</p>
      </template>
      <p v-if="uploadError" class="text-xs text-danger mt-1">{{ uploadError }}</p>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { uploadFile } from '@/api/uploads';

const props = withDefaults(defineProps<{
  label: string;
  accept?: string;
  folder?: string;
}>(), { accept: '*', folder: 'content' });

const emit = defineEmits<{ (e: 'uploaded', url: string): void }>();

const isDragging = ref(false);
const isUploading = ref(false);
const progress = ref(0);
const uploadError = ref('');

async function handleFile(file: File): Promise<void> {
  isUploading.value = true;
  uploadError.value = '';
  progress.value = 0;
  try {
    const { publicUrl } = await uploadFile(file, props.folder, (pct) => { progress.value = pct; });
    emit('uploaded', publicUrl);
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : 'Upload failed';
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
