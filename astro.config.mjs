// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://das-dasein.github.io/itm',
    base: '/itm/',
	integrations: [
		starlight({
			title: 'Введение в специальность',
			defaultLocale: 'ru',
			sidebar: [
				{
					label: 'Практики',
					items: [
						{ label: 'Первая практика', slug: 'practicies/flow-diagrams' },
					],
				}
			],
		}),
	],
	redirects: {
	  "/": {
	    destination: "./practicies/flow-diagrams",
	    status: 302
	  }
	}
});
