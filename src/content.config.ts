/**
 * The one content collection: every article in drafts/ (FR-1).
 *
 * Content lives at the repo root, not under src/ — an article is the thing this
 * project is for, not an implementation detail of the site that renders it. The
 * glob loader's `base` reaches out of src/ to say so.
 *
 * The schema is the build gate: a typo in a stage name or a missing description
 * fails `npm run build` naming the file, so a bad frontmatter can never reach
 * the live site (FR-2).
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { STAGES } from './lib/site.ts';

const stage = z.enum(STAGES);

const changelogEntry = z.object({
  date: z.date(),
  note: z.string().min(1),
  /** Present only when this revision moved the article to a new stage. */
  stage: stage.optional(),
});

export const collections = {
  drafts: defineCollection({
    // `base` resolves from the project root, so this reaches drafts/ at the
    // repo root rather than anything under src/.
    loader: glob({ pattern: '*.md', base: './drafts' }),
    schema: z.object({
      title: z.string().min(1),
      description: z
        .string()
        .min(1)
        .max(200, 'description must be 200 characters or fewer — it is a one-line summary'),
      /** The date the idea entered the garden. `updated` is git-derived, never written here. */
      created: z.date(),
      stage,
      tags: z
        .array(
          z
            .string()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'tags must be lowercase kebab-case'),
        )
        .default([]),
      /** The curated evolution record — the layer of record above raw git history. */
      changelog: z.array(changelogEntry).default([]),
    }),
  }),
};
