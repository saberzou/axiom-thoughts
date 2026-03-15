import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const thoughts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/thoughts' }),
  schema: z.object({
    title: z.string(),
    title_en: z.string().optional(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
    lang: z.enum(['zh', 'en']).default('zh'),
    painting_id: z.string().optional(),
    painting_title: z.string().optional(),
    painting_artist: z.string().optional(),
  }),
});

export const collections = { thoughts };
