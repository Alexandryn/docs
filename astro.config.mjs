import starlight from '@astrojs/starlight'
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
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Getting started', items: [{ autogenerate: { directory: 'getting-started' } }] },
      ],
    }),
  ],
})
