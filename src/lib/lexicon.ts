/**
 * The lexicon — the one place the metaphor lives.
 *
 * The domain is metaphor-indifferent: articles are stored with neutral stage
 * values (exploratory / developing / established), the code speaks of a Corpus
 * of notes, and every machine surface (.md siblings, llms.txt, graph.json,
 * feeds, history docs) uses those neutral terms. The metaphor — currently a
 * workbench, once a garden — is a skin applied at the rendered-HTML layer only.
 *
 * Because of that, changing the metaphor is an edit to THIS FILE and nothing
 * else: no domain logic, no types, no endpoints, no article frontmatter. The
 * two exceptions are irreducibly hand-authored: the stages diagram
 * (images/bench-stages.svg) and any article whose prose is *about* the
 * metaphor. Those are content, not infrastructure.
 *
 * The rule that keeps this honest: only rendered HTML pages read from this
 * file. If a data or text surface imports it, the seam has leaked.
 */
import type { Stage } from './site.ts';

interface StageLabel {
  /** The visible word beside the stage mark. */
  label: string;
  /** A short gloss, used where the UI has room to explain the mark. */
  gloss: string;
}

export const LEXICON = {
  /**
   * The neutral stage → its visible label and gloss. The three keys are the
   * permanent domain contract; the values are the swappable skin. The stage
   * MARK (○ ◐ ●) is drawn from the neutral value's ordinal position, not from
   * these words, so it survives a metaphor change untouched.
   */
  stages: {
    exploratory: { label: 'idea', gloss: 'exploring the idea' },
    developing: { label: 'draft', gloss: 'developing and thinking' },
    established: { label: 'developed', gloss: 'finished thinking' },
  } satisfies Record<Stage, StageLabel>,

  /** The two date labels on the article meta line (domain: created / updated). */
  dateLabels: {
    created: 'First draft',
    updated: 'Last updated',
  },

  /** The masthead subtitle, rendered as `{byline} {author}`. */
  byline: 'by',

  /** The changelog section heading on an article (domain: revisions). */
  revisionsHeading: 'What each pass changed',

  /** The 404 headline. */
  notFoundTitle: 'Nothing here',

  /** The colophon line in the footer. */
  colophon: 'morning club',

  /** The index lede — the one paragraph of metaphor prose on the front page. */
  lede:
    'My thoughts, interests and ideas. Everything is a work in progress.',
} as const;

/** The visible label for a stored stage value. */
export const stageLabel = (stage: Stage): string => LEXICON.stages[stage].label;
