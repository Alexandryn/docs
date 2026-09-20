import starlight from '@astrojs/starlight'
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://alexandryn.github.io',
  base: '/docs',
  integrations: [
    starlight({
      title: 'Alexandryn',
      description: 'Documentation for Alexandryn, a self-hosted digital library.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Alexandryn/alexandryn' },
      ],
      plugins: [
        starlightOpenAPI([
          {
            base: 'api',
            label: 'API reference',
            schema: './openapi/openapi.yaml',
            sidebar: { operations: { badges: true } },
          },
        ]),
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Getting started', items: [{ autogenerate: { directory: 'getting-started' } }] },
        ...openAPISidebarGroups,
      ],
    }),
  ],
})
