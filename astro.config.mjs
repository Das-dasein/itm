// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Введение в специальность',
			defaultLocale: 'ru',
			sidebar: [
				{
					label: 'Практики',
					items: [
						{ label: 'Первая практика', slug: 'guides/flow-diagrams' },
					],
				}
			],
		}),
	],
	redirects: {
		"/": {
			destination: "/guides/flow-diagrams",
			status: 302
		}
	}
});
