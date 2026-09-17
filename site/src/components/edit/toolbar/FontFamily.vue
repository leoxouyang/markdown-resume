<template>
  <ToolItem
    :text="$t('toolbar.font_family')"
    icon="i-material-symbols:font-download-outline"
  >
    <div class="w-full hstack space-x-2 mb-2">
      <Combobox
        id="font-cjk"
        :close-on-select="true"
        flex-1
        :items="cjkFonts"
        :default="styles.fontCJK.fontFamily || styles.fontCJK.name"
      />
      <span w-13>{{ $t("toolbar.cjk") }}</span>
    </div>

    <div v-if="missingFont" class="text-xs mb-3 leading-relaxed">
      <p role="status">{{ $t("toolbar.font_help.missing", { font: missingFont }) }}</p>
      <details class="mt-2">
        <summary class="cursor-pointer underline">
          {{ $t("toolbar.font_help.install") }}
        </summary>
        <div class="mt-2 space-y-2">
          <p>{{ $t(`toolbar.font_help.${fontHelpKey}`) }}</p>
          <p>{{ $t("toolbar.font_help.mac") }}</p>
          <p>{{ $t("toolbar.font_help.windows") }}</p>
          <ul class="list-disc pl-4 space-y-1">
            <li>
              <a
                class="underline"
                href="https://support.apple.com/zh-cn/guide/font-book/fntbk1000/mac"
                target="_blank"
                rel="noopener noreferrer"
                >{{ $t("toolbar.font_help.apple") }}</a
              >
            </li>
            <li v-if="missingFont === 'PingFang SC'">
              <a
                class="underline"
                href="https://support.apple.com/zh-cn/guide/font-book/fb34862/mac"
                target="_blank"
                rel="noopener noreferrer"
                >{{ $t("toolbar.font_help.restore") }}</a
              >
            </li>
            <li v-else>
              <a
                class="underline"
                href="https://learn.microsoft.com/zh-cn/windows/deployment/windows-missing-fonts"
                target="_blank"
                rel="noopener noreferrer"
                >{{ $t("toolbar.font_help.microsoft") }}</a
              >
            </li>
            <li v-if="missingFont === 'Microsoft YaHei'">
              <a
                class="underline"
                href="https://learn.microsoft.com/en-us/typography/font-list/microsoft-yahei"
                target="_blank"
                rel="noopener noreferrer"
                >{{ $t("toolbar.font_help.font_info") }}</a
              >
            </li>
            <li>
              <a
                class="underline"
                href="https://support.microsoft.com/zh-cn/windows/experience/personalization/manage-fonts-in-windows"
                target="_blank"
                rel="noopener noreferrer"
                >{{ $t("toolbar.font_help.windows_install") }}</a
              >
            </li>
          </ul>
          <p>{{ $t("toolbar.font_help.restart") }}</p>
          <button
            type="button"
            class="underline"
            :disabled="checkingFonts"
            @click="checkLocalFonts"
          >
            {{
              $t(
                checkingFonts ? "toolbar.font_help.checking" : "toolbar.font_help.recheck"
              )
            }}
          </button>
          <p>{{ $t("toolbar.font_help.builtin") }}</p>
          <button
            type="button"
            class="underline"
            @click="setStyle('fontCJK', { name: '霞鹜文楷', fontFamily: 'LXGW WenKai' })"
          >
            {{ $t("toolbar.font_help.wenkai") }}
          </button>
        </div>
      </details>
    </div>
    <div class="hstack space-x-2 w-full">
      <Combobox
        id="font-en"
        flex-1
        :items="enFonts"
        :default="styles.fontEN.fontFamily || styles.fontEN.name"
      />
      <span w-13>{{ $t("toolbar.en") }}</span>
    </div>
  </ToolItem>
</template>

<script lang="ts" setup>
import type { ComboboxItem } from "~/types";

const { styles, setStyle } = useStyleStore();
const { t } = useI18n();

const enFonts = computed(() => {
  const en = EN_FONTS.map<ComboboxItem>((item) => {
    const family =
      EN_FONTS.find((font) => font.name === item.name)?.fontFamily || item.name;
    return {
      label: item.name,
      value: family,
      onSelect: () => setStyle("fontEN", { name: item.name, fontFamily: family })
    };
  });
  return en.concat(gEnFontList.value);
});

const missingFont = ref("");
const localAvailability = ref<Record<string, boolean>>({});
const checkingFonts = ref(false);
const fontHelpKey = computed(() =>
  missingFont.value === "PingFang SC"
    ? "pingfang"
    : missingFont.value === "SimHei"
      ? "simhei"
      : "yahei"
);
const checkLocalFonts = async () => {
  checkingFonts.value = true;
  try {
    for (const family of LOCAL_CJK_FONTS) {
      localAvailability.value[family] = await isLocalFontAvailable(family);
    }
    const selected = styles.fontCJK.fontFamily || styles.fontCJK.name;
    missingFont.value = localAvailability.value[selected] === false ? selected : "";
  } finally {
    checkingFonts.value = false;
  }
};
watch(
  () => styles.fontCJK.fontFamily || styles.fontCJK.name,
  async (family) => {
    const available =
      !LOCAL_CJK_FONTS.includes(family) || (await isLocalFontAvailable(family));
    if (family === (styles.fontCJK.fontFamily || styles.fontCJK.name)) {
      missingFont.value = available ? "" : family;
    }
  },
  { immediate: true }
);

const cjkFonts = computed(() => {
  const cn = CJK_FONTS.map<ComboboxItem>((item) => {
    const family =
      CJK_FONTS.find((font) => font.name === item.name)?.fontFamily || item.name;
    return {
      label:
        item.name +
        (localAvailability.value[family] === false
          ? t("toolbar.font_help.unavailable")
          : ""),
      value: family,
      onSelect: () => setStyle("fontCJK", { name: item.name, fontFamily: family })
    };
  });
  return cn.concat(gCJKFontList.value);
});

// Setup Google Fonts
const gEnFontList = ref<ComboboxItem[]>([]);
const gCJKFontList = ref<ComboboxItem[]>([]);

onMounted(async () => {
  await checkLocalFonts();
  const { gfonts_en, gfonts_cjk } = await getGoogleFonts();

  gEnFontList.value = gfonts_en.map((font) => ({
    label: font.family,
    value: font.family,
    onSelect: () => setStyle("fontEN", { name: font.family })
  }));

  gCJKFontList.value = gfonts_cjk.map((font) => {
    const family = font.family;
    const name = CJK_NAME_MAP[family] || family;
    return {
      label: name,
      value: family,
      onSelect: () => setStyle("fontCJK", { name: name, fontFamily: family })
    };
  });

  const first = gCJKFontList.value.filter((item) => CJK_FIRST.includes(item.label));
  const after = gCJKFontList.value.filter((item) => !CJK_FIRST.includes(item.label));

  gCJKFontList.value = first.concat(after);
});
</script>
