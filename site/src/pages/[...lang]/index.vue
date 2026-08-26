<template>
  <div class="resumes-page">
    <Header />

    <main class="resume-library max-w-306 mx-auto px-5 py-12 text-dark-c">
      <div class="resume-library__header">
        <div>
          <h1 font-bold text-3xl>{{ $t("resumes.my_resumes") }}</h1>
          <p class="resume-library__intro">
            {{ $t("resumes.library_desc") }}
          </p>
        </div>

        <div class="resume-library__actions">
          <NewResume compact />
          <FileOptions @update="loadResumes" />
        </div>
      </div>

      <nav class="resume-library__filters" :aria-label="$t('resumes.filter_label')">
        <button
          v-for="filter in filters"
          :key="filter.key"
          type="button"
          class="resume-library__filter"
          :class="{ 'resume-library__filter--active': selectedCategory === filter.key }"
          :aria-pressed="selectedCategory === filter.key"
          @click="selectedCategory = filter.key"
        >
          <span>{{ filter.label }}</span>
          <span class="resume-library__count">{{ filter.count }}</span>
        </button>
      </nav>

      <div class="resume-library__groups">
        <section v-for="group in visibleGroups" :key="group.key" class="resume-group">
          <div class="resume-group__heading">
            <div>
              <h2>{{ group.label }}</h2>
              <p>{{ group.description }}</p>
            </div>
            <span>{{ group.items.length }} {{ $t("resumes.documents") }}</span>
          </div>

          <div v-if="group.items.length" class="resume-group__grid">
            <ResumeItem
              v-for="resume in group.items"
              :key="resume.id"
              class="resume-item"
              :resume="resume"
              @update="loadResumes"
            />
          </div>

          <p v-else class="resume-group__empty">{{ $t("resumes.empty_category") }}</p>
        </section>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { ResumeListItem } from "~/types";

type ResumeCategory = "zh" | "en" | "cover";
type ResumeFilter = ResumeCategory | "all";

// Load resumes from storage
const list = ref<ResumeListItem[]>([]);
const selectedCategory = ref<ResumeFilter>("all");
const { t } = useI18n();

const loadResumes = async () => {
  list.value = await getResumeList();
};

const getResumeCategory = (resume: ResumeListItem): ResumeCategory => {
  const nameAndOpening = `${resume.name}\n${resume.markdown.slice(0, 1600)}`;

  if (
    /cover\s*letter|coverletter|求职信|申请信/i.test(nameAndOpening) ||
    /(^|\n)\s*(?:\*\*)?dear\b/i.test(nameAndOpening) ||
    /尊敬的.{0,24}(招聘|经理|团队|负责人)/.test(nameAndOpening)
  )
    return "cover";

  const cjkCount = (resume.markdown.match(/[\u3400-\u9fff]/g) || []).length;
  if (/中文|chinese|\bzh\b/i.test(resume.name) || cjkCount >= 60) return "zh";

  return "en";
};

const groups = computed(() => {
  const groupMeta = [
    {
      key: "zh" as const,
      label: t("resumes.categories.zh"),
      description: t("resumes.category_desc.zh")
    },
    {
      key: "en" as const,
      label: t("resumes.categories.en"),
      description: t("resumes.category_desc.en")
    },
    {
      key: "cover" as const,
      label: t("resumes.categories.cover"),
      description: t("resumes.category_desc.cover")
    }
  ];

  return groupMeta.map((group) => ({
    ...group,
    items: list.value.filter((resume) => getResumeCategory(resume) === group.key)
  }));
});

const filters = computed(() => [
  {
    key: "all" as const,
    label: t("resumes.categories.all"),
    count: list.value.length
  },
  ...groups.value.map((group) => ({
    key: group.key,
    label: group.label,
    count: group.items.length
  }))
]);

const visibleGroups = computed(() =>
  selectedCategory.value === "all"
    ? groups.value
    : groups.value.filter((group) => group.key === selectedCategory.value)
);

onMounted(loadResumes);
</script>

<style scoped>
.resume-library__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
}

.resume-library__intro {
  max-width: 42rem;
  margin-top: 0.65rem;
  color: rgb(107 114 128);
  line-height: 1.65;
}

.resume-library__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.resume-library__filters {
  display: flex;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 0.4rem;
  overflow-x: auto;
  border: 1px solid rgb(209 213 219);
  border-radius: 0.9rem;
  background: rgb(243 244 246);
}

.resume-library__filter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
  padding: 0.55rem 0.85rem;
  border-radius: 0.65rem;
  color: rgb(75 85 99);
  font-size: 0.9rem;
  transition: 150ms ease;
}

.resume-library__filter:hover {
  background: rgb(255 255 255 / 0.7);
}

.resume-library__filter--active {
  color: rgb(17 24 39);
  background: white;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.12);
}

.resume-library__count {
  min-width: 1.45rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  color: rgb(107 114 128);
  background: rgb(229 231 235);
  font-size: 0.75rem;
  text-align: center;
}

.resume-library__groups {
  display: grid;
  gap: 2.5rem;
  margin-top: 2.5rem;
}

.resume-group {
  min-width: 0;
}

.resume-group__heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid rgb(209 213 219);
}

.resume-group__heading h2 {
  font-size: 1.2rem;
  font-weight: 700;
}

.resume-group__heading p,
.resume-group__heading > span,
.resume-group__empty {
  margin-top: 0.25rem;
  color: rgb(107 114 128);
  font-size: 0.85rem;
}

.resume-group__heading > span {
  flex: none;
}

.resume-group__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 2rem 1rem;
  margin-top: 1.4rem;
}

.resume-group__empty {
  padding: 2rem 0;
  text-align: center;
}

:global(.dark) .resume-library__intro,
:global(.dark) .resume-group__heading p,
:global(.dark) .resume-group__heading > span,
:global(.dark) .resume-group__empty {
  color: rgb(156 163 175);
}

:global(.dark) .resume-library__filters {
  border-color: rgb(100 116 139);
  background: rgb(71 85 105);
}

:global(.dark) .resume-library__filter {
  color: rgb(203 213 225);
}

:global(.dark) .resume-library__filter:hover {
  background: rgb(100 116 139 / 0.65);
}

:global(.dark) .resume-library__filter--active {
  color: white;
  background: rgb(100 116 139);
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.35);
}

:global(.dark) .resume-library__count {
  color: rgb(226 232 240);
  background: rgb(71 85 105);
}

:global(.dark) .resume-group__heading {
  border-color: rgb(100 116 139);
}

@media (max-width: 768px) {
  .resume-library {
    padding-top: 2rem;
  }

  .resume-library__header {
    flex-direction: column;
    gap: 1rem;
  }

  .resume-library__actions {
    justify-content: flex-start;
  }

  .resume-group__heading {
    align-items: flex-start;
  }
}
</style>
