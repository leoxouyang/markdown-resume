<h1 align="center">Markdown Resume</h1>

<p align="center">用 Markdown 编写对 ATS 和人类都友好的简历。<br />Write an ATS- and human-friendly resume in Markdown.</p>

<p align="center">
  <a href="https://leoxouyang.github.io/resume/"><strong>在线使用 / Live Demo</strong></a>
  ·
  <a href="#中文说明">中文</a>
  ·
  <a href="#english">English</a>
</p>

<img align="center" src="https://raw.githubusercontent.com/junian/markdown-resume/assets/img/markdown-resume-screenshot-00.jpg" alt="Markdown Resume screenshot" />

## 中文说明

### 项目简介

Markdown Resume 是一个开源的静态简历编辑器，可以实时预览 Markdown 内容，并导出适合 ATS 解析和人工阅读的简历。

这个仓库基于 [Junian 的 Markdown Resume](https://github.com/junian/markdown-resume)，而该项目源自 [Oh My CV](https://github.com/Renovamen/oh-my-cv)。Junian 的版本加入了接近 [CareerCup][careercup] 的默认模板、全黑配色、Web 安全字体，以及 HTML 和 DOCX 导出等改进。

### 我在原版本上做的改动

- 将简体中文设为默认界面语言，同时保留英文切换。
- 将默认英文字体从 Verdana 改为 Arial。
- 增加常用中文系统字体：苹方、黑体和微软雅黑。
- 修复包含空格的字体名称在 CSS 和字体加载接口中未正确加引号的问题。
- 将应用内 GitHub 链接及各语言的功能链接指向本仓库。
- 将站点元信息、README 在线入口、robots 和 sitemap 地址改为当前站点。
- 支持通过环境变量配置部署子路径和站点域名，不再依赖 CI 临时修改源码。
- 修复 GitHub Pages 子路径部署下的 favicon、PWA manifest、离线缓存 scope 和图标路径。
- 当前版本由主站构建并发布到 [`https://leoxouyang.github.io/resume/`](https://leoxouyang.github.io/resume/)。

### 功能

- Markdown 实时编辑和预览。
- 导出 A4 或 US Letter PDF，以及 HTML 和 DOCX。
- 自定义页边距、主题色、行高、字号和字体。
- 支持 Google Fonts、Iconify 图标、KaTeX 和交叉引用。
- 自动分页、自定义 CSS、大小写纠正和多简历管理。
- 支持离线使用（PWA）。
- 简历数据保存在浏览器本地，不上传服务器，不含追踪和广告。

建议使用 [Chrome][chrome] 或 [Microsoft Edge][edge] 等 Chromium 浏览器。

### 本地开发

项目使用 Nuxt 3、Vue 3、Vite、Zag 和 UnoCSS，并使用仓库锁定的 pnpm 版本。

```bash
pnpm install
pnpm build:pkg
pnpm dev
```

普通构建：

```bash
pnpm build
```

按当前主站 `/resume/` 路径构建：

```bash
NUXT_APP_BASE_URL=/resume/ \
NUXT_PUBLIC_SITE_URL=https://leoxouyang.github.io \
pnpm build
```

如需使用 Google Fonts 选择器，请申请 [Google Fonts Developer API Key](https://developers.google.com/fonts/docs/developer_api#APIKey)，然后在 `site/.env` 中配置：

```dotenv
NUXT_PUBLIC_GOOGLE_FONTS_KEY="YOUR_API_KEY"
```

### 致谢与许可证

- 上游项目：[junian/markdown-resume](https://github.com/junian/markdown-resume)
- 原始项目：[Renovamen/oh-my-cv](https://github.com/Renovamen/oh-my-cv)
- 模板参考：[billryan/resume](https://github.com/billryan/resume)

本项目使用 [MIT License](LICENSE)。

## English

### About

Markdown Resume is an open-source static resume editor with real-time Markdown preview. It helps produce resumes that are readable by both applicant tracking systems and people.

This repository is based on [Junian's Markdown Resume](https://github.com/junian/markdown-resume), which itself originated from [Oh My CV](https://github.com/Renovamen/oh-my-cv). Junian's version introduced a [CareerCup][careercup]-inspired default template, an all-black color scheme, web-safe fonts, and HTML and DOCX export.

### Changes in this fork

- Made Simplified Chinese the default interface language while retaining English switching.
- Changed the default Latin font from Verdana to Arial.
- Added common CJK system fonts: PingFang SC, SimHei, and Microsoft YaHei.
- Fixed unquoted multi-word font names in generated CSS and the browser font-loading API.
- Updated the in-app GitHub link and translated feature links to point to this repository.
- Updated site metadata, the README live link, robots, and sitemap URLs for the current site.
- Made the deployment base path and site origin configurable through environment variables instead of CI source rewriting.
- Fixed favicon, PWA manifest, offline-cache scope, and icon paths when deployed under a GitHub Pages subpath.
- The current version is built by the main website and published at [`https://leoxouyang.github.io/resume/`](https://leoxouyang.github.io/resume/).

### Features

- Real-time Markdown editing and preview.
- Export to A4 or US Letter PDF, HTML, and DOCX.
- Custom margins, theme colors, line heights, font sizes, and font families.
- Google Fonts, Iconify icons, KaTeX, and cross-reference support.
- Automatic page breaking, custom CSS, case correction, and multiple resume management.
- Offline support through a PWA.
- Resume data stays in local browser storage; there is no server upload, tracking, or advertising.

Chromium-based browsers such as [Chrome][chrome] and [Microsoft Edge][edge] are recommended.

### Development

The project uses Nuxt 3, Vue 3, Vite, Zag, and UnoCSS, with the pnpm version pinned by the repository.

```bash
pnpm install
pnpm build:pkg
pnpm dev
```

For a regular build:

```bash
pnpm build
```

To build for the current `/resume/` deployment:

```bash
NUXT_APP_BASE_URL=/resume/ \
NUXT_PUBLIC_SITE_URL=https://leoxouyang.github.io \
pnpm build
```

To enable the Google Fonts picker, obtain a [Google Fonts Developer API Key](https://developers.google.com/fonts/docs/developer_api#APIKey) and add it to `site/.env`:

```dotenv
NUXT_PUBLIC_GOOGLE_FONTS_KEY="YOUR_API_KEY"
```

### Credits and license

- Upstream fork: [junian/markdown-resume](https://github.com/junian/markdown-resume)
- Original project: [Renovamen/oh-my-cv](https://github.com/Renovamen/oh-my-cv)
- Template reference: [billryan/resume](https://github.com/billryan/resume)

This project is licensed under the [MIT License](LICENSE).

[careercup]: <https://web.archive.org/web/20240501052328/https://www.careercup.com/resume> "CareerCup Good Resume"
[chrome]: <https://www.google.com/chrome/> "Download Google Chrome"
[edge]: <https://www.microsoft.com/en-us/edge/> "Download Microsoft Edge"
