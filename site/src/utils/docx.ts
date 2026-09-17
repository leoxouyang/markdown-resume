import JSZip from "jszip";
import type { ResumeStyles } from "~/types";

const xml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!
  );
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

// Write ordinary WordprocessingML; no HTML/MHT import step is required by readers.
export const createResumeDocx = async (html: string, styles: ResumeStyles) => {
  const root = new DOMParser().parseFromString(html, "text/html").body;
  const relationships: string[] = [];
  const zip = new JSZip();
  const imageRuns = new Map<string, string>();
  for (const [index, element] of Array.from(root.querySelectorAll("img")).entries()) {
    const source = element.getAttribute("src") || "";
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = source;
    try {
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d")!.drawImage(image, 0, 0);
      const encoded = canvas.toDataURL("image/png").split(",")[1];
      const id = `image${index + 1}`;
      zip.file(`word/media/${id}.png`, encoded, { base64: true });
      relationships.push(
        `<Relationship Id="${id}" Type="${R}/image" Target="media/${id}.png"/>`
      );
      const maxWidth = (styles.paper === "letter" ? 816 : 793.7) - 2 * styles.marginH;
      const requestedWidth = Number(element.getAttribute("width")) || image.naturalWidth;
      const width = Math.min(requestedWidth, maxWidth);
      const height = (width * image.naturalHeight) / image.naturalWidth;
      const cx = Math.round(width * 9525),
        cy = Math.round(height * 9525);
      imageRuns.set(
        source,
        `<w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${index + 1}" name="${id}" descr="${xml(element.alt)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${index + 1}" name="${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
      );
    } catch {
      throw new Error(
        "无法读取简历中的图片，请使用允许跨域访问的图片或 data URL 后重试。"
      );
    }
  }
  let bookmarkId = 0;
  const anchor = (id: string) => "resume_" + id.replace(/[^a-zA-Z0-9_]/g, "_");
  const size = Math.round(styles.fontSize * 1.5);
  const color = /^[#]?[0-9a-f]{6}$/i.test(styles.themeColor)
    ? styles.themeColor.replace("#", "")
    : "000000";
  const fonts = `<w:rFonts w:ascii="${xml(styles.fontEN.fontFamily || styles.fontEN.name)}" w:hAnsi="${xml(styles.fontEN.fontFamily || styles.fontEN.name)}" w:eastAsia="${xml(styles.fontCJK.fontFamily || styles.fontCJK.name)}"/>`;
  const run = (text: string, properties = "") =>
    text
      ? `<w:r><w:rPr>${fonts}${properties.includes("<w:sz ") ? "" : `<w:sz w:val="${size}"/>`}${properties}</w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r>`
      : "";
  const inline = (node: Node, properties = ""): string => {
    if (node.nodeType === 3) return run(node.textContent || "", properties);
    if (node.nodeType !== 1) return "";
    const element = node as HTMLElement;
    const tag = element.tagName;
    if (tag === "IMG") return imageRuns.get(element.getAttribute("src") || "") || "";
    if (element.classList.contains("katex")) {
      return run(
        element.querySelector("annotation")?.textContent || element.textContent || "",
        properties
      );
    }
    if (["SCRIPT", "STYLE", "SVG"].includes(tag) || element.classList.contains("iconify"))
      return "";
    if (tag === "BR") return "<w:r><w:br/></w:r>";
    const format: Record<string, string> = {
      STRONG: "<w:b/>",
      B: "<w:b/>",
      EM: "<w:i/>",
      I: "<w:i/>",
      U: '<w:u w:val="single"/>',
      S: "<w:strike/>",
      DEL: "<w:strike/>",
      SUP: '<w:vertAlign w:val="superscript"/>',
      SUB: '<w:vertAlign w:val="subscript"/>'
    };
    let content = Array.from(element.childNodes)
      .map((child) => inline(child, properties + (format[tag] || "")))
      .join("");
    if (tag === "P" && element.parentElement?.tagName === "LI")
      content += "<w:r><w:br/></w:r>";
    if (element.id) {
      const id = ++bookmarkId;
      content = `<w:bookmarkStart w:id="${id}" w:name="${anchor(element.id)}"/>${content}<w:bookmarkEnd w:id="${id}"/>`;
    }
    if (tag === "A") {
      const href = element.getAttribute("href") || "";
      if (href.startsWith("#"))
        return `<w:hyperlink w:anchor="${anchor(href.slice(1))}">${content}</w:hyperlink>`;
      if (/^(https?:|mailto:|tel:)/i.test(href)) {
        const id = `link${relationships.length + 1}`;
        relationships.push(
          `<Relationship Id="${id}" Type="${R}/hyperlink" Target="${xml(href)}" TargetMode="External"/>`
        );
        return `<w:hyperlink r:id="${id}">${content}</w:hyperlink>`;
      }
    }
    return content;
  };
  type Paragraph = { content: string; properties: string; keep?: boolean };
  const body: string[] = [];
  let listId = 0;
  const numbering: string[] = [];
  const paragraph = (p: Paragraph) =>
    `<w:p><w:pPr><w:keepLines/>${p.keep ? "<w:keepNext/>" : ""}${p.properties}</w:pPr>${p.content}</w:p>`;
  const pageWidth = styles.paper === "letter" ? 12240 : 11906;
  const pageHeight = styles.paper === "letter" ? 15840 : 16838;
  const marginH = Math.round(styles.marginH * 15);
  const marginV = Math.round(styles.marginV * 15);
  const contentWidth = pageWidth - 2 * marginH;
  const collect = (element: HTMLElement, paragraphs: Paragraph[], depth = 0) => {
    const tag = element.tagName;
    if (element.classList.contains("md-it-newpage")) {
      paragraphs.push({ content: '<w:r><w:br w:type="page"/></w:r>', properties: "" });
    } else if (/^H[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      paragraphs.push({
        content: inline(
          element,
          `<w:b/><w:color w:val="${color}"/><w:sz w:val="${Math.round(size * (level === 1 ? 2.5 : 1.2))}"/>`
        ),
        properties:
          `<w:outlineLvl w:val="${level - 1}"/><w:spacing w:before="${level === 1 ? 0 : Math.round(styles.paragraphSpace * 15)}" w:after="60"/>` +
          (level === 1
            ? '<w:jc w:val="center"/>'
            : level === 2
              ? `<w:pBdr><w:bottom w:val="single" w:sz="6" w:color="${color}"/></w:pBdr>`
              : "")
      });
    } else if (tag === "UL" || tag === "OL") {
      const num = ++listId;
      numbering.push(
        `<w:num w:numId="${num}"><w:abstractNumId w:val="${tag === "OL" ? 1 : 0}"/><w:lvlOverride w:ilvl="${Math.min(depth, 8)}"><w:startOverride w:val="${Number(element.getAttribute("start")) || 1}"/></w:lvlOverride></w:num>`
      );
      Array.from(element.children).forEach((li) => {
        const copy = li.cloneNode(true) as HTMLElement;
        copy.querySelectorAll("ul,ol").forEach((nested) => nested.remove());
        paragraphs.push({
          content: inline(copy),
          properties: `<w:numPr><w:ilvl w:val="${Math.min(depth, 8)}"/><w:numId w:val="${num}"/></w:numPr>`
        });
        Array.from(li.children)
          .filter((child) => /^(UL|OL)$/.test(child.tagName))
          .forEach((nested) => collect(nested as HTMLElement, paragraphs, depth + 1));
      });
    } else if (tag === "DL") {
      const cells = Array.from(element.children);
      const tabs =
        cells.length > 2
          ? `<w:tab w:val="center" w:pos="${Math.round(contentWidth / 2)}"/>`
          : "";
      paragraphs.push({
        content: cells.map((cell) => inline(cell)).join("<w:r><w:tab/></w:r>"),
        properties: `<w:tabs>${tabs}<w:tab w:val="right" w:pos="${contentWidth}"/></w:tabs>`
      });
    } else if (tag === "TABLE") {
      // Preserve table text as tab-separated native paragraphs.
      element.querySelectorAll("tr").forEach((row) =>
        paragraphs.push({
          content: Array.from(row.children)
            .map((cell) => inline(cell))
            .join("<w:r><w:tab/></w:r>"),
          properties: ""
        })
      );
    } else if (["DIV", "SECTION", "BLOCKQUOTE"].includes(tag)) {
      if (
        element.children.length &&
        Array.from(element.children).some((child) =>
          /^(P|H[1-6]|DL|UL|OL|DIV|TABLE)$/.test(child.tagName)
        )
      ) {
        Array.from(element.children).forEach((child) =>
          collect(child as HTMLElement, paragraphs, depth)
        );
      } else if (element.textContent?.trim()) {
        paragraphs.push({ content: inline(element), properties: "" });
      }
    } else if (
      element.textContent?.trim() ||
      tag === "IMG" ||
      element.querySelector("img")
    ) {
      paragraphs.push({ content: inline(element), properties: "" });
    }
  };
  Array.from(root.children).forEach((block) => {
    const paragraphs: Paragraph[] = [];
    collect(block as HTMLElement, paragraphs);
    paragraphs.forEach((p, i) => {
      p.keep = i < paragraphs.length - 1;
      body.push(paragraph(p));
    });
  });
  zip.file(
    "[Content_Types].xml",
    declaration +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="png" ContentType="image/png"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${["document", "styles", "numbering"].map((part) => `<Override PartName="/word/${part}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${part === "document" ? "document.main" : part}+xml"/>`).join("")}</Types>`
  );
  zip.file(
    "_rels/.rels",
    declaration +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="document" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`
  );
  zip.file(
    "word/document.xml",
    declaration +
      `<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="${pageWidth}" w:h="${pageHeight}"/><w:pgMar w:top="${marginV}" w:bottom="${marginV}" w:left="${marginH}" w:right="${marginH}"/></w:sectPr></w:body></w:document>`
  );
  zip.file(
    "word/styles.xml",
    declaration +
      `<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr>${fonts}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="40" w:line="${Math.round(styles.lineHeight * 240)}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`
  );
  zip.file(
    "word/numbering.xml",
    declaration +
      `<w:numbering xmlns:w="${W}">${[0, 1].map((id) => `<w:abstractNum w:abstractNumId="${id}"><w:multiLevelType w:val="multilevel"/>${Array.from({ length: 9 }, (_, level) => `<w:lvl w:ilvl="${level}"><w:start w:val="1"/><w:numFmt w:val="${id ? "decimal" : "bullet"}"/><w:lvlText w:val="${id ? `%${level + 1}.` : "•"}"/><w:pPr><w:ind w:left="${360 * (level + 1)}" w:hanging="180"/></w:pPr></w:lvl>`).join("")}</w:abstractNum>`).join("")}${numbering.join("")}</w:numbering>`
  );
  zip.file(
    "word/_rels/document.xml.rels",
    declaration +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="styles" Type="${R}/styles" Target="styles.xml"/><Relationship Id="numbering" Type="${R}/numbering" Target="numbering.xml"/>${relationships.join("")}</Relationships>`
  );
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE"
  });
};
