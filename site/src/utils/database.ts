import * as localForage from "localforage";
import { downloadFile, uploadFile, copy, isClient } from "@renovamen/utils";
import { DEFAULT_STYLES, DEFAULT_NAME, DEFAULT_MD_CONTENT, DEFAULT_CSS_CONTENT } from ".";
import type { ResumeStorage, ResumeStorageItem, ResumeStyles } from "~/types";

const MARKDOWN_RESUME_KEY = "MARKDOWN_RESUME_data";
const MARKDOWN_RESUME_DRAFT_PREFIX = "MARKDOWN_RESUME_draft_";

export const saveResumeDraft = (id: string, resume: ResumeStorageItem) => {
  if (!isClient) return;
  localStorage.setItem(`${MARKDOWN_RESUME_DRAFT_PREFIX}${id}`, JSON.stringify(resume));
};

export const getResumeDraft = (id: string) => {
  if (!isClient) return null;

  try {
    const draft = localStorage.getItem(`${MARKDOWN_RESUME_DRAFT_PREFIX}${id}`);
    return draft ? (JSON.parse(draft) as ResumeStorageItem) : null;
  } catch {
    return null;
  }
};

export const clearResumeDraft = (id: string, expectedUpdate?: string) => {
  if (!isClient) return;

  const draft = getResumeDraft(id);
  if (!expectedUpdate || draft?.update === expectedUpdate)
    localStorage.removeItem(`${MARKDOWN_RESUME_DRAFT_PREFIX}${id}`);
};

export const getStorage = async () =>
  isClient ? localForage.getItem<ResumeStorage>(MARKDOWN_RESUME_KEY) : null;

export const getResumeList = async () => {
  const storage = (await getStorage()) || {};
  return Object.keys(storage)
    .map((i) => ({
      id: i,
      ...storage[i]
    }))
    .sort((a, b) => (b.update || b.id).localeCompare(a.update || a.id));
};

export const setResumeStyles = (styles: ResumeStyles) => {
  const { setStyle } = useStyleStore();

  for (const key of Object.keys(styles) as Array<keyof ResumeStyles>)
    setStyle(key, styles[key]);
};

export const setResumeMd = (content: string) => {
  const { setData, toggleMdFlag } = useDataStore();

  setData("mdContent", content);
  toggleMdFlag(true);
};

export const setResumeCss = (content: string) => {
  const { setData, toggleCssFlag } = useDataStore();

  setData("cssContent", content);
  toggleCssFlag(true);
};

/**
 * Overwrite data for a given resume to local storage
 *
 * @param id resume id
 * @param resume resume data
 */
export const setResume = (id: string, resume: ResumeStorageItem) => {
  const { setData } = useDataStore();

  setData("curResumeId", id);
  setData("curResumeName", resume.name);
  setResumeMd(resume.markdown);
  setResumeCss(resume.css);
  setResumeStyles(resume.styles);
};

/**
 * Save changes to a certain resume
 *
 * @param id resume id
 * @param resume resume data
 */
export const saveResume = async (
  id: string,
  resume: ResumeStorageItem,
  options: { notify?: boolean } = {}
) => {
  const storage = (await getStorage()) || {};
  storage[id] = resume;

  await localForage.setItem(MARKDOWN_RESUME_KEY, storage);

  if (options.notify !== false) {
    const toast = useToast();
    toast.save();
  }
};

/**
 * New a resume using default styles and content
 */
export const newResume = async () => {
  const id = new Date().getTime().toString(); // generate a new id
  const resume = {
    name: DEFAULT_NAME,
    markdown: DEFAULT_MD_CONTENT,
    css: DEFAULT_CSS_CONTENT,
    styles: DEFAULT_STYLES,
    update: id
  } as ResumeStorageItem;

  await saveResume(id, resume);

  const toast = useToast();
  toast.new();

  return id;
};

/**
 * Download data for all resumes to a .json file
 */
export const saveResumesToLocal = async () => {
  const storage = (await getStorage()) || {};
  downloadFile("MARKDOWN_RESUME_data.json", JSON.stringify(storage));
};

/**
 * Import resumes from a local .json file
 *
 * @param callback A callback function to be excuted after importing finished
 */
export const importResumesFromLocal = async (callback?: () => void) => {
  const toast = useToast();

  const check = (data: ResumeStorage) => {
    for (const resume of Object.values(data)) {
      if (typeof resume.name !== "string") return false;
      if (typeof resume.markdown !== "string") return false;
      if (typeof resume.css !== "string") return false;
      if (typeof resume.styles !== "object") return false;
      if (!["string", "undefined"].includes(typeof resume.update)) return false;

      const styles = resume.styles;

      if (typeof styles.fontSize !== "number") return false;
      if (typeof styles.lineHeight !== "number") return false;
      if (typeof styles.marginH !== "number") return false;
      if (typeof styles.marginV !== "number") return false;
      if (typeof styles.paper !== "string") return false;
      if (typeof styles.paragraphSpace !== "number") return false;
      if (typeof styles.themeColor !== "string") return false;

      if (typeof styles.fontCJK !== "object" || typeof styles.fontCJK.name !== "string")
        return false;
      if (typeof styles.fontEN !== "object" || typeof styles.fontEN.name !== "string")
        return false;
    }

    return true;
  };

  const storage = (await getStorage()) || {};

  const merge = async (content: string) => {
    const data = JSON.parse(content) as ResumeStorage;

    if (!check(data)) {
      toast.import(false);
      return;
    }

    const newStorage = {
      ...storage,
      ...data
    };

    await localForage.setItem(MARKDOWN_RESUME_KEY, newStorage);
    toast.import(true);

    callback && callback();
  };

  uploadFile(merge, ".json");
};

export const deleteResume = async (id: string) => {
  const toast = useToast();
  const storage = await getStorage();

  if (storage && storage[id]) {
    const name = storage[id].name;
    delete storage[id];

    await localForage.setItem(MARKDOWN_RESUME_KEY, storage);

    toast.delete(name);
  }
};

export const switchResume = async (id: string) => {
  const toast = useToast();
  const storage = await getStorage();

  if (storage && storage[id]) {
    const savedResume = storage[id];
    const draft = getResumeDraft(id);
    const resume = draft && draft.update >= savedResume.update ? draft : savedResume;

    setResume(id, resume);
    toast.switch(resume.name);
    return true;
  }

  return false;
};

export const duplicateResume = async (id: string) => {
  const toast = useToast();
  const storage = await getStorage();

  if (storage && storage[id]) {
    // Generate an id and name for duplicated resume
    const resume = copy(storage[id]);
    const newId = new Date().getTime().toString();
    const oldName = resume.name;

    resume.name = oldName + " Copy";
    resume.update = newId;
    storage[newId] = resume;

    await localForage.setItem(MARKDOWN_RESUME_KEY, storage);
    toast.duplicate(oldName);
  }
};

export const renameResume = async (id: string, name: string) => {
  const storage = (await getStorage()) || {};
  storage[id].name = name;

  await localForage.setItem(MARKDOWN_RESUME_KEY, storage);

  const toast = useToast();
  toast.save();
};
