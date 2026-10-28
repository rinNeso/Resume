/**
 * src/utils/ics.js
 *
 * Reads the iCalendar feed that rinNeso/worlds-cal publishes and decides what
 * the preview card should show. Pure functions with no DOM, so the snapshot
 * script and the tests import the same code the page runs.
 *
 * The parser covers what worlds-cal's build.py writes, done the RFC 5545 way:
 * folded lines, escaped TEXT, UTC date-times. Anything it can't place in time
 * honestly (a TZID or floating time, a DATE-only value) is skipped rather than
 * guessed at as UTC.
 */

// build.py's calendar block per series length (SLOT_HOURS), used only when an
// event has no usable DTEND.
const SLOT_HOURS = { 1: 1, 3: 3, 5: 4.5 }
const STAGE_HOURS = { 'Play-Ins': 4.5, 'Quarterfinals': 4.5, 'Semifinals': 4.5, 'Finals': 4.5 }
const DEFAULT_HOURS = 3

export const KNOCKOUTS = ['Finals', 'Semifinals', 'Quarterfinals']

// RFC 5545 3.1: a CRLF followed by one space or tab continues the line.
export function unfold (text) {
  return text.replace(/\r?\n[ \t]/g, '')
}

// RFC 5545 3.3.11 TEXT escapes, read in one pass so "\\n" stays a backslash
// followed by "n" instead of turning into a newline.
export function unescapeText (value) {
  return value.replace(/\\([\\;,nN])/g, (_, c) => (c === 'n' || c === 'N') ? '\n' : c)
}

// "NAME;PARAM=x:VALUE" -> { name, params, value }. The first colon outside a
// quoted parameter value ends the name.
function contentLine (line) {
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') quoted = !quoted
    else if (c === ':' && !quoted) {
      const [name, ...rest] = line.slice(0, i).split(';')
      const params = Object.fromEntries(rest.map(p => {
        const eq = p.indexOf('=')
        return [p.slice(0, eq).toUpperCase(), p.slice(eq + 1)]
      }))
      return { name: name.toUpperCase(), params, value: line.slice(i + 1) }
    }
  }
  return null
}

// A UTC DATE-TIME ("20261114T190000Z") as a Date. Returns null for anything
// else: a TZID or floating local time needs a zone database to place, and a
// DATE has no time of day, so neither is silently treated as UTC.
export function parseUtc (value, params = {}) {
  if (params.TZID || (params.VALUE && params.VALUE.toUpperCase() !== 'DATE-TIME')) return null
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value)
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m.map(Number)
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi, s))
  // Date.UTC rolls 20261340 over into next year; a real feed never says that.
  return date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null
}

// build.py titles a finished match "KC 3–2 C9": team code, wins, an en dash,
// wins, team code. Anchored on the whole title and on the en dash, so a code
// with digits in it (T1, G2, 100) can't pass for a score, and "T1 vs G2" is
// never read as one.
const SCORE = /^(\S+) (\d+)–(\d+) (\S+)$/

export function parseScore (match) {
  const m = SCORE.exec(match || '')
  if (!m) return null
  const wins = [Number(m[2]), Number(m[3])]
  // A tie isn't a result build.py ever writes; don't name a winner for it.
  if (wins[0] === wins[1]) return null
  return { teams: [m[1], m[4]], wins }
}

// The "best of N" build.py writes into DESCRIPTION, if present.
function bestOf (description) {
  const m = /best of (\d+)/i.exec(description || '')
  return m ? Number(m[1]) : null
}

function fallbackHours (stage, description) {
  return SLOT_HOURS[bestOf(description)] ?? STAGE_HOURS[stage] ?? DEFAULT_HOURS
}

/**
 * Parse a worlds-cal feed.
 * Returns { calendar, feedStamp, events: [{ uid, start, end, match, stage, score }] }
 * with Dates for times, events sorted by start, and score null until played.
 */
export function parseIcs (text) {
  const lines = unfold(String(text)).split(/\r?\n/)
  let calendar = null
  let feedStamp = null
  const events = []
  let cur = null

  for (const raw of lines) {
    const line = contentLine(raw)
    if (!line) continue
    const { name, params, value } = line
    if (name === 'BEGIN' && value.toUpperCase() === 'VEVENT') {
      cur = {}
    } else if (name === 'END' && value.toUpperCase() === 'VEVENT') {
      if (cur) events.push(cur)
      cur = null
    } else if (cur) {
      if (name === 'UID') cur.uid = value
      else if (name === 'SUMMARY') cur.summary = unescapeText(value)
      else if (name === 'DESCRIPTION') cur.description = unescapeText(value)
      else if (name === 'DTSTART') cur.start = parseUtc(value, params)
      else if (name === 'DTEND') cur.end = parseUtc(value, params)
      else if (name === 'DTSTAMP') cur.stamp = parseUtc(value, params)
    } else if (name === 'X-WR-CALNAME') {
      calendar = unescapeText(value)
    }
  }

  const out = []
  for (const e of events) {
    if (!e.start || !e.summary) continue
    // build.py joins the title and the stage with " · ".
    const cut = e.summary.lastIndexOf(' · ')
    const match = cut < 0 ? e.summary : e.summary.slice(0, cut)
    const stage = cut < 0 ? '' : e.summary.slice(cut + 3)
    const end = e.end && e.end > e.start
      ? e.end
      : new Date(e.start.getTime() + fallbackHours(stage, e.description) * 3600e3)
    if (e.stamp && (!feedStamp || e.stamp > feedStamp)) feedStamp = e.stamp
    out.push({
      uid: e.uid || `${e.start.toISOString()} ${e.summary}`,
      start: e.start,
      end,
      match,
      stage,
      score: parseScore(match),
    })
  }
  out.sort((a, b) => a.start - b.start)
  return { calendar, feedStamp, events: out }
}

// The last Finals match, by start.
function finalsOf (events) {
  return events.filter(e => e.stage === 'Finals').sort((a, b) => a.start - b.start).at(-1)
}

// A tournament is decided once its Finals is scored. A placeholder that never
// gets a score (a tiebreaker nobody needed) doesn't keep it open, so the page
// and the snapshot script agree on what "over" means.
export function isComplete (events) {
  return !!finalsOf(events)?.score
}

// Under way at `now`, or close enough (a day out) that its schedule is the news.
export function begun (feed, now, lead = 864e5) {
  return feed.events.some(e => e.score || e.start.getTime() - lead <= +now)
}

// Feed data <-> the JSON that src/data/worlds-snapshot.json holds.
export function toSnapshot (feed, fetchedAt = new Date()) {
  return {
    calendar: feed.calendar,
    fetchedAt: fetchedAt.toISOString(),
    feedStamp: feed.feedStamp ? feed.feedStamp.toISOString() : null,
    complete: isComplete(feed.events),
    events: feed.events.map(e => ({
      uid: e.uid,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      match: e.match,
      stage: e.stage,
      ...(e.score ? { score: e.score } : {}),
    })),
  }
}

export function fromSnapshot (snap) {
  const date = s => (s ? new Date(s) : null)
  return {
    calendar: snap.calendar,
    fetchedAt: date(snap.fetchedAt),
    feedStamp: date(snap.feedStamp),
    events: (snap.events || []).map(e => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
      score: e.score || null,
    })),
  }
}

// "LoL Worlds 2026" -> 2026, for telling tournaments apart.
function year (calendar) {
  const m = /\b(\d{4})\b/.exec(calendar || '')
  return m ? Number(m[1]) : null
}

/**
 * Compare two parsed feeds by tournament: 0 for the same one, > 0 when `a` is
 * the newer tournament, < 0 when older. The calendar name decides; the first
 * match's start breaks ties if the names carry no year.
 */
export function compareTournaments (a, b) {
  if (a.calendar && a.calendar === b.calendar) return 0
  const ya = year(a.calendar)
  const yb = year(b.calendar)
  if (ya && yb && ya !== yb) return ya - yb
  const first = f => f.events[0]?.start.getTime() ?? 0
  return Math.sign(first(a) - first(b)) || 0
}

// Which feed to show: the live one if it has events and is the same
// tournament (and no older a copy) or a newer one; otherwise the snapshot.
// Next year's schedule waits until it has begun: until then a finished
// snapshot's champion beats a list of TBDs.
export function pickFeed (snapshot, live, now = Date.now()) {
  if (!live?.events.length) return 'snapshot'
  if (!snapshot?.events.length) return 'live'
  const cmp = compareTournaments(live, snapshot)
  if (cmp > 0) return begun(live, now) || !isComplete(snapshot.events) ? 'live' : 'snapshot'
  if (cmp < 0) return 'snapshot'
  const stamp = f => f.feedStamp?.getTime() ?? 0
  return stamp(live) >= stamp(snapshot) ? 'live' : 'snapshot'
}

// The winner and the score from the winner's side, e.g. 3–1.
export function result (e) {
  if (!e.score) return null
  const [a, b] = e.score.teams
  const [wa, wb] = e.score.wins
  return wa > wb
    ? { winner: a, loser: b, score: `${wa}–${wb}` }
    : { winner: b, loser: a, score: `${wb}–${wa}` }
}

/**
 * Decide what the card shows at `now` (ms or Date).
 *   live       some unscored match hasn't reached its end yet
 *   concluded  nothing is left and the Finals is scored
 *   stale      nothing upcoming, but results are missing (a frozen feed)
 * live returns { upcoming, results, pending }, concluded { final, knockouts },
 * and stale { pending, results }. results are scored matches only; pending
 * holds the ones past their end with no score yet, newest first.
 * Rows carry `status`: 'live' while start <= now < end, 'upcoming' before
 * that, 'pending' for an unscored match past its end, 'final' once scored.
 */
export function view (events, now, { upcomingCount = 5, resultCount = 3 } = {}) {
  const t = +now
  const status = e => e.score
    ? 'final'
    : t >= e.end.getTime() ? 'pending' : t >= e.start.getTime() ? 'live' : 'upcoming'
  const rows = events.map(e => ({ ...e, status: status(e) }))
  const byStart = (a, b) => a.start - b.start
  const upcoming = rows.filter(e => e.status === 'live' || e.status === 'upcoming').sort(byStart)
  const past = rows.filter(e => e.status === 'final' || e.status === 'pending').sort((a, b) => b.start - a.start)
  // A frozen feed leaves finished matches unscored; they're listed apart so
  // they never push the real results off the card.
  const pending = past.filter(e => e.status === 'pending')
  const results = past.filter(e => e.status === 'final').slice(0, resultCount)

  if (upcoming.length) {
    return { mode: 'live', upcoming: upcoming.slice(0, upcomingCount), results, pending }
  }
  if (isComplete(rows)) {
    const finals = finalsOf(rows)
    return {
      mode: 'concluded',
      final: { ...finals, ...result(finals) },
      knockouts: KNOCKOUTS
        .map(stage => ({ stage, events: rows.filter(e => e.stage === stage).sort(byStart) }))
        .filter(g => g.events.length),
    }
  }
  // Stale: the matches still waiting on a score, then the last real results,
  // so a frozen feed reads as frozen instead of as finished.
  return { mode: 'stale', pending, results }
}
