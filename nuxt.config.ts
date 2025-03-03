import swc from "unplugin-swc";
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  imports: { autoImport: false },
  ssr: false,
  modules: ["@vueuse/nuxt", "@nuxtjs/tailwindcss"],
  $production: {
    vite: {
      plugins: [
        swc.rollup({
          // @ts-ignore
          exclude: [/core-js/, /howler/],
          tsconfigFile: false,
          jsc: {
            parser: {
              syntax: "typescript",
            },
          },
          env: {
            coreJs: "3.41.0",
            mode: "usage",
            forceAllTransforms: true,
          },
        }),
      ],
    },
  },
});
