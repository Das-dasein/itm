// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
	site: 'https://das-dasein.github.io',
	base: '/itm/',
	output: 'static',
	adapter: undefined,
	integrations: [
		mermaid(),
		starlight({
			title: 'Введение в специальность',
			defaultLocale: 'ru',
			sidebar: [
				{
					label: 'Практики',
					items: [
						{ label: 'Первая практика', slug: 'practicies/flow-diagrams' },
						{ label: 'Аналитика', slug: 'practicies/analysis' },
					],
				}
			],
		}),
		mdx({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
		react()
	]
});
