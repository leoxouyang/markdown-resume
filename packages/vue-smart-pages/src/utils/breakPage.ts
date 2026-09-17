const NEW_PAGE = "md-it-newpage";

export const breakPage = (
  id: string,
  height: number,
  top: number,
  bottom: number,
  left: number,
  right: number
) => {
  const page = document.getElementById(id);
  if (!page) return;
  page.querySelectorAll(":scope > .vue-smart-page-break").forEach((e) => e.remove());
  const contentH = height - top - bottom;
  if (contentH <= 0) return;

  const spacer = (remaining: number) => {
    const element = document.createElement("div");
    element.className = "vue-smart-page-break";
    element.style.marginTop = `${Math.max(0, remaining)}px`;
    element.style.paddingBottom = `${top}px`;
    element.style.marginLeft = `-${left}px`;
    element.style.marginRight = `-${right}px`;
    return element;
  };
  const outerHeight = (element: Element) => {
    const style = getComputedStyle(element);
    // offsetHeight is unscaled, unlike getBoundingClientRect in the zoomed preview.
    return (
      (element as HTMLElement).offsetHeight +
      (parseFloat(style.marginTop) || 0) +
      (parseFloat(style.marginBottom) || 0)
    );
  };
  let used = 0;
  for (const child of Array.from(page.children)) {
    const explicit =
      child.classList.contains(NEW_PAGE) || !!child.querySelector(`.${NEW_PAGE}`);
    const childH = outerHeight(child);
    child.classList.toggle("resume-block-oversize", childH > contentH);
    if (explicit || (used > 0 && used + childH > contentH)) {
      page.insertBefore(spacer(height - top - used), child);
      used = 0;
    }
    if (!explicit) used += childH;
    // A block taller than a sheet cannot be kept intact. Let print split it
    // naturally and avoid creating a blank page before it.
    if (used > contentH) used %= contentH;
  }
  page.style.paddingBottom = `${Math.max(bottom, height - top - used)}px`;
};
