<template>
  <button
    v-if="compact"
    class="new-resume-button rect-btn border border-dark-c hover:bg-darker-c"
    :aria-label="$t('resumes.new')"
    @click="newAndSwitch"
  >
    <span i-ic:round-plus text-lg />
    <span>{{ $t("resumes.new") }}</span>
  </button>

  <div v-else w-56 h-80>
    <button
      class="resume-card group w-[210px] h-[299px] flex-center bg-darker-c hover:bg-c"
      :aria-label="$t('resumes.new')"
      @click="newAndSwitch"
    >
      <span i-ic:round-plus text="5xl light-c group-hover:brand" />
    </button>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    compact?: boolean;
  }>(),
  {
    compact: false
  }
);

const router = useRouter();
const localePath = useLocalePath();

const newAndSwitch = async () => {
  const id = await newResume();
  router.push(localePath(`/edit/${id}`));
};
</script>
