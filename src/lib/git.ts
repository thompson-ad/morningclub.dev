/**
 * Git-derived modification dates (NFR-5, "honest freshness").
 *
 * `updated` is never frontmatter and never build time — it is the date of the
 * last commit that touched the file. That makes a rebuild with no content
 * changes produce byte-identical dates everywhere, which is the whole point:
 * the freshness signal is only worth anything if it is true.
 *
 * This requires full git history at build time. GitHub Actions checks out with
 * `fetch-depth: 0` for exactly this reason — a shallow clone silently collapses
 * every article's date onto the clone date, so we detect and shout about it.
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

const cache = new Map<string, Date>();

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

let shallowChecked = false;

/** A shallow clone makes every date wrong. Fail loudly rather than lie quietly. */
function assertNotShallow(cwd: string): void {
  if (shallowChecked) return;
  shallowChecked = true;
  try {
    if (git(['rev-parse', '--is-shallow-repository'], cwd) === 'true') {
      const message =
        'Repository is a shallow clone — git-derived `updated` dates will be ' +
        'wrong for every article (NFR-5). Check out with `fetch-depth: 0`.';
      // In CI this is a correctness bug in the deploy, not a warning.
      if (process.env.CI) throw new Error(message);
      console.warn(`[garden] ${message}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Repository is')) {
      throw error;
    }
    // Not a git repo at all (e.g. a tarball export) — mtime fallback covers it.
  }
}

/**
 * Last commit date for a file, falling back to mtime for files that are not
 * committed yet (the normal case while drafting locally).
 */
export function gitUpdated(absPath: string): Date {
  const cached = cache.get(absPath);
  if (cached) return cached;

  const cwd = path.dirname(absPath);
  assertNotShallow(cwd);

  let date: Date | undefined;
  try {
    const out = git(['log', '-1', '--format=%cI', '--', absPath], cwd);
    if (out) date = new Date(out);
  } catch {
    // No git available; fall through to mtime.
  }

  if (!date || Number.isNaN(date.getTime())) {
    if (process.env.CI) {
      console.warn(
        `[garden] No commit found for ${path.basename(absPath)} — falling back ` +
          `to mtime. In CI this usually means the file is untracked.`,
      );
    }
    date = statSync(absPath).mtime;
  }

  cache.set(absPath, date);
  return date;
}
