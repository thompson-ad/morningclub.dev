/**
 * The one content collection: every note in notes/ (FR-1).
 *
 * Content lives at the repo root, not under src/ — an article is the thing this
 * project is for, not an implementation detail of the site that renders it. The
 * glob loader's `base` reaches out of src/ to say so.
 *
 * The schema is the build gate: a typo in a stage value or a missing
 * description fails `npm run build` naming the file, so a bad frontmatter can
 * never reach the live site (FR-2). Note `stage` stores the neutral domain
 * value (exploratory / developing / established) — the reader-facing word is
 * applied at the view.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { STAGES } from './lib/site.ts';

const stage = z.enum(STAGES);

export const collections = {
  notes: defineCollection({
    // `base` resolves from the project root, so this reaches notes/ at the
    // repo root rather than anything under src/.
    loader: glob({ pattern: '*.md', base: './notes' }),
    // Strict: an unrecognised key fails the build naming the file and the key.
    // Zod would otherwise strip it silently — but the `.md` sibling ships the
    // authored frontmatter verbatim (NFR-7), so a stripped key would still
    // reach agents while rendering nowhere. Better to be loud than to lie.
    schema: z.strictObject({
      title: z.string().min(1),
      description: z
        .string()
        .min(1)
        .max(200, 'description must be 200 characters or fewer — it is a one-line summary'),
      /** The date the idea was first written. `updated` is git-derived, never written here. */
      created: z.date(),
      stage,
      tags: z
        .array(
          z
            .string()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'tags must be lowercase kebab-case'),
        )
        .default([]),
      /**
       * Brain citations that seeded this essay, when it began as a Morning Club
       * essay question (`morning-club` repo, `essays/`). Carried so the routine
       * can see which questions became essays; rendered nowhere, but the `.md`
       * sibling ships it verbatim (NFR-7), which is the surface that matters.
       */
      seeds: z
        .array(
          z
            .string()
            .regex(
              /^[a-z0-9-]+\.md#[a-z0-9-]+$/,
              'seeds must be brain citations of the form file.md#key',
            ),
        )
        .default([]),
    }),
  }),
};
