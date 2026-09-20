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
        {
          label: 'Getting started',
          items: [
            'getting-started/what-is-alexandryn',
            'getting-started/install-the-desktop-app',
            'getting-started/run-with-docker',
            'getting-started/first-run-setup',
          ],
        },
        {
          label: 'Using Alexandryn',
          items: ['using/add-a-source', 'using/import-books', 'using/read-on-another-device'],
        },
        {
          label: 'Administration',
          items: ['admin/accounts-and-libraries', 'admin/back-up-and-restore'],
        },
        {
          label: 'Security',
          items: ['security/how-security-works', 'security/exposing-alexandryn'],
        },
        { label: 'Updating', items: ['updating/update-alexandryn'] },
        ...openAPISidebarGroups,
      ],
    }),
  ],
})
