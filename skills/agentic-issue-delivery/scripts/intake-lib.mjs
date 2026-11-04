/** Pure, side-effect-free decision function. No external credentials or runtime state. */
export function chooseIssue({ issues, boundary, author, active }) {
  if (active) return { kind: 'busy', reason: active.state || 'unreconciled-dispatch' };
  const eligible = (issues || [])
    .filter(x => x && Number.isSafeInteger(x.number) && x.number > boundary)
    .filter(x => x.state === 'OPEN' || x.state === 'open')
    .filter(x => x.author?.login === author)
    .filter(x => (x.labels || []).some(l => (typeof l === 'string' ? l : l.name) === 'paseo'))
    .sort((a, b) => a.number - b.number);
  const issue = eligible[0];
  return issue ? { kind: 'dispatch', issue: issue.number, url: issue.url } : { kind: 'idle' };
}

export function parseDuration(value) {
  const match = /^(\d+)(s|m|h)$/.exec(value || '');
  if (!match) throw new Error('Interval must be e.g. 30s, 10m, 1h');
  const ms = Number(match[1]) * { s: 1000, m: 60_000, h: 3_600_000 }[match[2]];
  if (!Number.isSafeInteger(ms) || ms < 10_000) throw new Error('Interval must be at least 10 seconds');
  return ms;
}

export function modeIsBroad(mode) { return /^(full-access|bypassPermissions|bypass|danger-full-access|yolo)$/i.test(mode || ''); }
