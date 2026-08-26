<template>
  <div class="autosave-control">
    <span class="autosave-status" :class="`autosave-status--${status}`">
      <span class="autosave-status__dot" />
      <span>{{ statusText }}</span>
    </span>

    <button
      class="round-btn"
      :aria-label="$t('resumes.manual_save')"
      :title="$t('resumes.manual_save')"
      @click="manualSave"
    >
      <span i-ic:baseline-save md:text-lg />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { useShortcuts } from "@renovamen/vue-shortcuts";
import type { ResumeStorageItem } from "~/types";

const { data } = useDataStore();
const { styles } = useStyleStore();
const { t } = useI18n();

type SaveStatus = "ready" | "pending" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY = 700;
const status = ref<SaveStatus>("ready");
const lastSavedAt = ref<Date>();
let timer: ReturnType<typeof setTimeout> | undefined;
let pendingResume: ResumeStorageItem | undefined;
let saveQueue = Promise.resolve();

const buildResume = (): ResumeStorageItem => ({
  name: data.curResumeName,
  markdown: data.mdContent,
  css: data.cssContent,
  styles: toRaw(styles),
  update: new Date().getTime().toString()
});

const persist = async (resume: ResumeStorageItem, notify: boolean) => {
  const id = data.curResumeId;
  if (!id) return;

  status.value = "saving";

  try {
    saveQueue = saveQueue.then(() => saveResume(id, resume, { notify }));
    await saveQueue;
    clearResumeDraft(id, resume.update);
    lastSavedAt.value = new Date(parseInt(resume.update));
    if (pendingResume?.update === resume.update) {
      pendingResume = undefined;
      status.value = "saved";
    } else {
      status.value = pendingResume ? "pending" : "saved";
    }
  } catch {
    status.value = "error";
    saveQueue = Promise.resolve();
  }
};

const scheduleAutosave = () => {
  const id = data.curResumeId;
  if (!id) return;

  clearTimeout(timer);
  pendingResume = buildResume();

  try {
    saveResumeDraft(id, pendingResume);
    status.value = "pending";
  } catch {
    status.value = "error";
  }

  timer = setTimeout(() => {
    if (pendingResume) persist(pendingResume, false);
  }, AUTOSAVE_DELAY);
};

const manualSave = () => {
  const id = data.curResumeId;
  if (!id) return;

  clearTimeout(timer);
  const resume = buildResume();
  pendingResume = resume;

  try {
    saveResumeDraft(id, resume);
  } catch {
    status.value = "error";
  }

  persist(resume, true);
};

const statusText = computed(() => {
  if (status.value === "saved" && lastSavedAt.value)
    return t("resumes.autosave.saved", {
      time: lastSavedAt.value.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    });

  return t(`resumes.autosave.${status.value}`);
});

watch(
  () => ({
    id: data.curResumeId,
    name: data.curResumeName,
    markdown: data.mdContent,
    css: data.cssContent,
    styles
  }),
  scheduleAutosave,
  { deep: true }
);

onBeforeUnmount(() => {
  clearTimeout(timer);
  if (data.curResumeId && pendingResume) {
    try {
      saveResumeDraft(data.curResumeId, pendingResume);
    } catch {
      // IndexedDB autosave may still finish even if the synchronous draft is too large.
    }
  }
});

useShortcuts("ctrl+s", manualSave);
</script>

<style scoped>
.autosave-control,
.autosave-status {
  display: flex;
  align-items: center;
}

.autosave-control {
  gap: 0.25rem;
}

.autosave-status {
  gap: 0.4rem;
  margin-right: 0.25rem;
  color: rgb(107 114 128);
  font-size: 0.75rem;
  white-space: nowrap;
}

.autosave-status__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: rgb(156 163 175);
}

.autosave-status--pending .autosave-status__dot,
.autosave-status--saving .autosave-status__dot {
  background: rgb(245 158 11);
}

.autosave-status--saved .autosave-status__dot {
  background: rgb(34 197 94);
}

.autosave-status--error {
  color: rgb(220 38 38);
}

.autosave-status--error .autosave-status__dot {
  background: rgb(239 68 68);
}

@media (max-width: 768px) {
  .autosave-status span:last-child {
    display: none;
  }
}
</style>
