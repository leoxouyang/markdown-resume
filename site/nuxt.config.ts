import { pwa } from "./configs/pwa";
import { i18n } from "./configs/i18n";

const baseURL = process.env.NUXT_APP_BASE_URL || "/markdown-resume/";
const siteURL = process.env.NUXT_PUBLIC_SITE_URL || "https://leoxouyang.github.io";
const canonicalURL = new URL(baseURL, siteURL).toString();

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: "src/",

  modules: [
    "@vueuse/nuxt",
    "@unocss/nuxt",
    "@pinia/nuxt",
    "@nuxtjs/i18n",
    "@nuxtjs/color-mode",
    "@vite-pwa/nuxt",
    "nuxt-simple-sitemap"
  ],

  css: [
    "@unocss/reset/tailwind.css",
    "katex/dist/katex.min.css",
    "~/assets/css/index.css"
  ],

  components: [
    {
      path: "~/components",
      pathPrefix: false
    }
  ],

  i18n,

  runtimeConfig: {
    public: {
      googleFontsKey: ""
    }
  },

  colorMode: {
    preference: "light",
    classSuffix: ""
  },

  app: {
    // If host it on https://example.com
    //    baseURL: '/'
    // Else if host it on https://example.com/resume
    //    baseURL: '/resume/'
    baseURL,
    buildAssetsDir: "assets", // don't use "_" at the begining of the folder name to avoids
    head: {
      viewport: "width=device-width,initial-scale=1",
      link: [
        { rel: "apple-touch-icon", href: `${baseURL}apple-touch-icon.png` },
        {
          rel: "mask-icon",
          href: `${baseURL}safari-pinned-tab.svg`,
          color: "#222"
        }
      ],
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "application-name", content: "Markdown Resume" },
        { name: "apple-mobile-web-app-title", content: "Markdown Resume" },
        { name: "msapplication-TileColor", content: "#fff" },
        { property: "og:url", content: canonicalURL },
        { property: "og:type", content: "website" }
      ]
    }
  },

  site: {
    url: siteURL
  },

  pwa
});
