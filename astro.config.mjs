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
						{ label: 'Вторая практика', slug: 'practicies/analysis' },
						{ label: 'Третья практика', slug: 'practicies/cmd' },
						{ label: 'Четвёртая практика', slug: 'practicies/scm' },
						{ label: 'Пятая практика', slug: 'practicies/qa' },
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
