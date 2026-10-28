// Tests for src/utils/ics.js: node --test 'scripts/test-*.mjs'
// Feeds are built here in worlds-cal's build.py format (CRLF, folded at 75
// octets, en-dash scores, " · " before the stage) so no fixture files drift.

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { describe, test } from 'node:test'
import { createSSRApp } from 'vue'
import { compileScript, parse } from 'vue/compiler-sfc'
import { renderToString } from 'vue/server-renderer'
import {
  begun, compareTournaments, fromSnapshot, isComplete, parseIcs, parseScore,
  parseUtc, pickFeed, toSnapshot, unescapeText, unfold, view,
} from '../src/utils/ics.js'
import { decide } from './worlds-snapshot.mjs'

// The card's dates are checked as text; pin the zone they're shown in.
process.env.TZ = 'America/Chicago'

const esc = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

function fold (line) {
  const out = []
  while (line.length > 75) {
    const cut = out.length ? 74 : 75
    out.push(line.slice(0, cut))
    line = line.slice(cut)
  }
  out.push(line)
  return out.join('\r\n ')
}

const SLOT = { 1: 1, 3: 3, 5: 4.5 }

// matches: [{ id, start: ISO, title, stage, bo }]
function feed (matches, { name = 'LoL Worlds 2026', built = '2026-10-28T15:45:45Z' } = {}) {
  const st = stamp(new Date(built))
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `X-WR-CALNAME:${esc(name)}`]
  for (const m of matches) {
    const start = new Date(m.start)
    const end = new Date(start.getTime() + SLOT[m.bo ?? 3] * 3600e3)
    lines.push(
      'BEGIN:VEVENT',
      `UID:lolesports-${m.id}@worlds-cal`,
      `DTSTAMP:${st}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(`${m.title} · ${m.stage}`)}`,
      `DESCRIPTION:${esc(`${m.stage}, best of ${m.bo ?? 3}\nWatch: https://lolesports.com/live/worlds`)}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(l => fold(l) + '\r\n').join('')
}

// The 2026 knockouts, with or without scores.
function knockouts (scored) {
  return [
    { id: 'q1', start: '2026-10-31T19:00:00Z', stage: 'Quarterfinals', bo: 5, title: scored ? 'T1 3–1 BLG' : 'TBD vs TBD' },
    { id: 'q2', start: '2026-11-01T19:00:00Z', stage: 'Quarterfinals', bo: 5, title: scored ? 'GEN 3–0 G2' : 'TBD vs TBD' },
    { id: 's1', start: '2026-11-07T19:00:00Z', stage: 'Semifinals', bo: 5, title: scored ? 'T1 3–2 HLE' : 'TBD vs TBD' },
    { id: 's2', start: '2026-11-08T19:00:00Z', stage: 'Semifinals', bo: 5, title: scored ? 'GEN 3–1 TES' : 'TBD vs TBD' },
    { id: 'f', start: '2026-11-14T19:00:00Z', stage: 'Finals', bo: 5, title: scored ? 'GEN 1–3 T1' : 'TBD vs TBD' },
  ]
}
const swiss = [
  { id: 'w1', start: '2026-10-25T20:00:00Z', stage: 'Swiss', bo: 1, title: 'DK 1–0 G2' },
  { id: 'w2', start: '2026-10-28T20:00:00Z', stage: 'Swiss', bo: 3, title: 'MKOI vs T1' },
]

describe('parsing', () => {
  test('unfolds continuation lines', () => {
    assert.equal(unfold('SUMMARY:ab\r\n c\r\n\td'), 'SUMMARY:abcd')
  })

  test('unescapes RFC 5545 TEXT in one pass', () => {
    assert.equal(unescapeText('a\\, b\\; c\\nd\\\\e'), 'a, b; c\nd\\e')
    // An escaped backslash followed by "n" is not a newline.
    assert.equal(unescapeText('C:\\\\new'), 'C:\\new')
  })

  test('reads calendar name, stamp, times, match and stage', () => {
    const f = parseIcs(feed([{ id: 1, start: '2026-11-14T19:00:00Z', title: 'TBD vs TBD', stage: 'Finals', bo: 5 }]))
    assert.equal(f.calendar, 'LoL Worlds 2026')
    assert.equal(f.feedStamp.toISOString(), '2026-10-28T15:45:45.000Z')
    const [e] = f.events
    assert.equal(e.uid, 'lolesports-1@worlds-cal')
    assert.equal(e.start.toISOString(), '2026-11-14T19:00:00.000Z')
    assert.equal(e.end.toISOString(), '2026-11-14T23:30:00.000Z')
    assert.equal(e.match, 'TBD vs TBD')
    assert.equal(e.stage, 'Finals')
    assert.equal(e.score, null)
  })

  test('unescapes summaries that went through build.py esc()', () => {
    const f = parseIcs(feed([{ id: 1, start: '2026-11-01T19:00:00Z', title: 'A\\B vs C;D', stage: 'Swiss, Day 2' }]))
    assert.equal(f.events[0].match, 'A\\B vs C;D')
    assert.equal(f.events[0].stage, 'Swiss, Day 2')
  })

  test('reads a long folded summary with non-ASCII team names', () => {
    const long = `${'X'.repeat(60)} vs Ünïcødé`
    const f = parseIcs(feed([{ id: 1, start: '2026-11-01T19:00:00Z', title: long, stage: 'Swiss' }]))
    assert.equal(f.events[0].match, long)
  })
})

describe('time zones', () => {
  test('UTC times ending in Z are read as UTC', () => {
    assert.equal(parseUtc('20261114T190000Z').toISOString(), '2026-11-14T19:00:00.000Z')
  })

  test('TZID, floating and DATE values are never assumed to be UTC', () => {
    assert.equal(parseUtc('20261101T190000', { TZID: 'America/New_York' }), null)
    assert.equal(parseUtc('20261101T190000'), null)
    assert.equal(parseUtc('20261101', { VALUE: 'DATE' }), null)
    assert.equal(parseUtc('20261340T190000Z'), null)
  })

  test('an event whose DTSTART has a TZID is skipped, not shifted', () => {
    const ics = feed([{ id: 1, start: '2026-11-01T19:00:00Z', title: 'A vs B', stage: 'Swiss' }])
      .replace(/DTSTART:(\d{8}T\d{6})Z/, 'DTSTART;TZID=America/New_York:$1')
    assert.equal(parseIcs(ics).events.length, 0)
  })

  test('a missing or local DTEND falls back to the series length', () => {
    const ics = feed([{ id: 1, start: '2026-11-14T19:00:00Z', title: 'TBD vs TBD', stage: 'Finals', bo: 5 }])
      .replace(/DTEND:.*\r\n/, '')
    assert.equal(parseIcs(ics).events[0].end.toISOString(), '2026-11-14T23:30:00.000Z')
  })
})

describe('scores', () => {
  test('reads build.py scores, team codes with digits included', () => {
    assert.deepEqual(parseScore('T1 3–1 G2'), { teams: ['T1', 'G2'], wins: [3, 1] })
    assert.deepEqual(parseScore('100 2–1 T1'), { teams: ['100', 'T1'], wins: [2, 1] })
    assert.deepEqual(parseScore('KC 0–1 LYON'), { teams: ['KC', 'LYON'], wins: [0, 1] })
  })

  test('digits in team names are not a score', () => {
    for (const title of ['T1 vs G2', '100 vs T1', 'G2 vs 100T', 'TBD vs TBD', 'T1 3-1 G2', 'LOS 2 T1', 'T1 1–1 G2']) {
      assert.equal(parseScore(title), null, title)
    }
  })

  test('the parsed feed marks scored matches only', () => {
    const f = parseIcs(feed([...swiss, ...knockouts(false)]))
    assert.deepEqual(f.events.map(e => !!e.score), [true, false, false, false, false, false, false])
  })
})

// Swiss days around the real feed's last build (Oct 28, 15:45Z): three
// scored, then nine that ended unscored by Oct 31, then the knockouts.
const frozenSwiss = [
  ['G2 2–1 TSW', '2026-10-28T06:00:00Z'], ['TES 2–0 LOS', '2026-10-28T09:00:00Z'],
  ['HLE 1–2 CFO', '2026-10-28T12:00:00Z'], ['MKOI vs T1', '2026-10-28T20:00:00Z'],
  ['TLAW vs LOS', '2026-10-29T17:00:00Z'], ['BLG vs TES', '2026-10-29T20:00:00Z'],
  ['CFO vs KC', '2026-10-29T23:00:00Z'], ['AL vs G2', '2026-10-30T14:00:00Z'],
  ['DK vs IG', '2026-10-30T17:00:00Z'], ['KC vs LYON', '2026-10-30T19:00:00Z'],
  ['HLE vs BLG', '2026-10-30T20:00:00Z'], ['T1 vs GEN', '2026-10-30T20:30:00Z'],
].map(([title, start], i) => ({ id: `z${i}`, start, title, stage: 'Swiss', bo: 3 }))
const frozen = parseIcs(feed([...frozenSwiss, ...knockouts(false)]))

describe('mode', () => {
  const full = parseIcs(feed([...swiss.map(m => ({ ...m, title: m.title.replace(' vs ', ' 2–1 ') })), ...knockouts(true)]))
  const partial = parseIcs(feed([...swiss, ...knockouts(false)]))

  test('a fully scored feed after the Finals is concluded, with the right champion', () => {
    assert.ok(isComplete(full.events))
    const v = view(full.events, new Date('2026-11-20T12:00:00Z'))
    assert.equal(v.mode, 'concluded')
    assert.equal(v.final.winner, 'T1')
    assert.equal(v.final.loser, 'GEN')
    assert.equal(v.final.score, '3–1')
    assert.deepEqual(v.knockouts.map(g => [g.stage, g.events.length]), [['Finals', 1], ['Semifinals', 2], ['Quarterfinals', 2]])
  })

  test('an unscored Final in progress is Live', () => {
    const v = view(partial.events, new Date('2026-11-14T22:30:00Z'))
    assert.equal(v.mode, 'live')
    assert.equal(v.upcoming[0].stage, 'Finals')
    assert.equal(v.upcoming[0].status, 'live')
  })

  test('a match before its start is upcoming, not Live', () => {
    const v = view(partial.events, new Date('2026-10-28T19:59:00Z'))
    assert.equal(v.mode, 'live')
    assert.equal(v.upcoming[0].match, 'MKOI vs T1')
    assert.equal(v.upcoming[0].status, 'upcoming')
  })

  test('a feed frozen for ~10 h lists a finished match as pending, not vanished', () => {
    // MKOI vs T1 ran 20:00-23:00Z; the feed hasn't been rebuilt since 15:45Z.
    const v = view(partial.events, new Date('2026-10-29T06:00:00Z'))
    assert.equal(v.mode, 'live')
    assert.deepEqual(v.pending.map(e => [e.match, e.status]), [['MKOI vs T1', 'pending']])
    assert.ok(!v.upcoming.some(e => e.match === 'MKOI vs T1'))
  })

  test('live results are scored matches only, however long the feed has been frozen', () => {
    const v = view(frozen.events, new Date('2026-10-31T00:00:00Z'))
    assert.equal(v.mode, 'live')
    assert.ok(v.results.length > 0 && v.results.every(e => e.status === 'final'))
    assert.deepEqual(v.results.map(e => e.match), ['HLE 1–2 CFO', 'TES 2–0 LOS', 'G2 2–1 TSW'])
    assert.equal(v.pending.length, 9)
    assert.ok(v.pending.every(e => e.status === 'pending'))
  })

  test('nothing upcoming and results missing is stale, listing both', () => {
    const v = view(partial.events, new Date('2026-11-20T12:00:00Z'))
    assert.equal(v.mode, 'stale')
    assert.deepEqual(v.pending.map(e => e.stage), ['Finals', 'Semifinals', 'Semifinals', 'Quarterfinals', 'Quarterfinals', 'Swiss'])
    assert.ok(v.pending.every(e => e.status === 'pending'))
    assert.deepEqual(v.results.map(e => e.match), ['DK 1–0 G2'])
  })

  test('a scored Final with an earlier result missing is complete and concluded', () => {
    const f = parseIcs(feed([...swiss, ...knockouts(true)]))
    assert.ok(isComplete(f.events))
    const v = view(f.events, new Date('2026-11-20T12:00:00Z'))
    assert.equal(v.mode, 'concluded')
    assert.equal(v.final.winner, 'T1')
  })
})

describe('snapshot and feed choice', () => {
  const t2026 = parseIcs(feed([...swiss, ...knockouts(true)], { built: '2026-11-15T01:00:00Z' }))
  const t2027 = parseIcs(feed([{ id: 'n', start: '2027-10-14T18:00:00Z', title: 'TBD vs TBD', stage: 'Play-Ins', bo: 5 }],
    { name: 'LoL Worlds 2027', built: '2027-08-01T00:00:00Z' }))

  test('a snapshot round-trips through JSON', () => {
    const snap = JSON.parse(JSON.stringify(toSnapshot(t2026, new Date('2026-11-15T09:00:00Z'))))
    assert.equal(snap.fetchedAt, '2026-11-15T09:00:00.000Z')
    assert.equal(snap.feedStamp, '2026-11-15T01:00:00.000Z')
    assert.equal(snap.events[0].score.teams[0], 'DK')
    assert.equal('score' in snap.events[1], false)
    const back = fromSnapshot(snap)
    assert.deepEqual(back.events.map(e => e.start.getTime()), t2026.events.map(e => e.start.getTime()))
  })

  test('tournaments compare by the year in the calendar name', () => {
    assert.equal(compareTournaments(t2026, t2026), 0)
    assert.ok(compareTournaments(t2027, t2026) > 0)
    assert.ok(compareTournaments(t2026, t2027) < 0)
  })

  test('the live feed wins when it is the same tournament or newer, the snapshot otherwise', () => {
    const older = { ...t2026, feedStamp: new Date('2026-11-01T00:00:00Z') }
    assert.equal(pickFeed(t2026, t2026), 'live')
    assert.equal(pickFeed(t2026, t2027, new Date('2027-10-14T19:00:00Z')), 'live')
    assert.equal(pickFeed(t2027, t2026), 'snapshot')
    assert.equal(pickFeed(t2026, older), 'snapshot')
    assert.equal(pickFeed(t2026, null), 'snapshot')
    assert.equal(pickFeed(t2026, { ...t2026, events: [] }), 'snapshot')
  })

  test('next year\'s feed waits until a day before its first match while the snapshot is finished', () => {
    assert.ok(isComplete(t2026.events))
    assert.equal(pickFeed(t2026, t2027, new Date('2027-08-01T12:00:00Z')), 'snapshot')
    assert.equal(pickFeed(t2026, t2027, new Date('2027-10-13T12:00:00Z')), 'snapshot')
    assert.equal(pickFeed(t2026, t2027, new Date('2027-10-13T19:00:00Z')), 'live')
    assert.ok(!begun(t2027, new Date('2027-10-13T17:59:00Z')))
    assert.ok(begun(t2027, new Date('2027-10-13T18:00:00Z')))
  })

  test('next year\'s feed shows at once if it has a score, or if the snapshot never finished', () => {
    const scored = { ...t2027, events: [{ ...t2027.events[0], score: { teams: ['A', 'B'], wins: [1, 0] } }] }
    assert.equal(pickFeed(t2026, scored, new Date('2027-08-01T12:00:00Z')), 'live')
    const unfinished = parseIcs(feed([...swiss, ...knockouts(false)]))
    assert.equal(pickFeed(unfinished, t2027, new Date('2027-08-01T12:00:00Z')), 'live')
  })
})

describe('snapshot script', () => {
  const snap = (matches, opts) => JSON.parse(JSON.stringify(toSnapshot(parseIcs(feed(matches, opts)))))
  const running = snap([...swiss, ...knockouts(false)])
  const y2027 = snap([{ id: 'n', start: '2027-10-14T18:00:00Z', title: 'TBD vs TBD', stage: 'Play-Ins', bo: 5 }],
    { name: 'LoL Worlds 2027', built: '2027-08-01T00:00:00Z' })

  test('a scored Final counts as complete even with a stray unscored match', () => {
    const won = snap([...swiss, ...knockouts(true)])
    assert.equal(won.complete, true)
    assert.equal(decide(won, y2027)[0], false)
    // A file written before this rule says complete: false; the matches decide.
    assert.equal(decide({ ...won, complete: false }, y2027)[0], false)
    assert.equal(decide(running, y2027)[0], true)
  })

  test('a truncated feed of the same tournament is refused', () => {
    const [write, why] = decide(running, snap(swiss))
    assert.equal(write, false)
    assert.match(why, /truncated: 2 matches in the feed, 7 in the snapshot/)
  })

  test('a feed with fewer scores, or a score gone, is refused', () => {
    const fewer = snap([{ ...swiss[0], title: 'DK vs G2' }, swiss[1], ...knockouts(false)])
    assert.match(decide(running, fewer)[1], /0\/7 scored in the feed, 1\/7 scored in the snapshot/)
    // Same count, but the score moved from one match to another.
    const moved = snap([{ ...swiss[0], title: 'DK vs G2' }, { ...swiss[1], title: 'MKOI 0–2 T1' }, ...knockouts(false)])
    const [write, why] = decide(running, moved)
    assert.equal(write, false)
    assert.match(why, /DK 1–0 G2 lost its score/)
  })

  test('a feed with more matches or more scores is written, an unchanged one is not', () => {
    const more = snap([swiss[0], { ...swiss[1], title: 'MKOI 0–2 T1' }, ...knockouts(false)])
    assert.deepEqual(decide(running, more), [true, 'matches or scores changed'])
    assert.deepEqual(decide(running, snap([...swiss, ...knockouts(false)])), [false, 'no change in the matches or scores'])
    assert.deepEqual(decide(running, snap([...swiss, ...knockouts(true)])), [true, 'tournament finished'])
  })
})

// Renders CalendarPreview.vue on the server with a given snapshot, live feed
// and clock, and returns its HTML and text. The SFC is compiled the way Vite
// does it, with its '@/' imports pointed at the real files and Vuetify's
// components stubbed. `live` is seeded, since the fetch in onMounted never
// runs on the server.
let renders = 0
async function renderCard ({ snapshot, live = null, now }) {
  const src = await readFile(new URL('../src/components/CalendarPreview.vue', import.meta.url), 'utf8')
  let code = compileScript(parse(src).descriptor, { id: 'cal', inlineTemplate: true }).content
  const swap = (from, to) => {
    assert.match(code, from, `CalendarPreview no longer matches ${from}`)
    code = code.replace(from, to)
  }
  const url = spec => JSON.stringify(import.meta.resolve(spec))
  swap(/from ['"]vue['"]/g, `from ${url('vue')}`)
  swap(/from ['"]@mdi\/js['"]/, `from ${url('@mdi/js')}`)
  swap(/from ['"]@\/utils\/ics['"]/, `from ${JSON.stringify(new URL('../src/utils/ics.js', import.meta.url).href)}`)
  swap(/import snapshotJson from ['"]@\/data\/worlds-snapshot\.json['"]/, 'const snapshotJson = globalThis.__card.snapshot')
  swap(/shallowRef\(null\)/, 'shallowRef(globalThis.__card.live)')
  swap(/ref\('loading'\)/, `ref(${live ? "'ok'" : "'loading'"})`)

  // The snapshot is read when the module loads, and modules are cached by URL,
  // so each render gets a URL of its own.
  globalThis.__card = { snapshot: JSON.parse(JSON.stringify(toSnapshot(snapshot))), live }
  const { default: Card } = await import(`data:text/javascript,${encodeURIComponent(`${code}\n// ${++renders}`)}`)
  const app = createSSRApp(Card, { feed: 'https://example.test/worlds.ics', subscribe: 'webcal://example.test/worlds.ics' })
  for (const name of ['VIcon', 'VBtn', 'VSnackbar']) app.component(name, { render: () => null })

  const realNow = Date.now
  Date.now = () => +new Date(now)
  try {
    const html = await renderToString(app)
    return { html, text: textOf(html) }
  } finally {
    Date.now = realNow
  }
}

function textOf (html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '')
    .replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

describe('card', () => {
  const t2026 = parseIcs(feed([...swiss, ...knockouts(true)], { built: '2026-11-15T01:00:00Z' }))
  const t2027 = parseIcs(feed([
    { id: 'n1', start: '2027-10-14T18:00:00Z', title: 'TBD vs TBD', stage: 'Play-Ins', bo: 5 },
    { id: 'n2', start: '2027-10-14T23:00:00Z', title: 'TBD vs TBD', stage: 'Play-Ins', bo: 5 },
  ], { name: 'LoL Worlds 2027', built: '2027-08-01T00:00:00Z' }))

  test('knockout rows have real spaces between date, winner, score and loser', async () => {
    const { html } = await renderCard({ snapshot: t2026, now: '2026-11-20T12:00:00Z' })
    const rows = [...html.matchAll(/<li class="event round">([\s\S]*?)<\/li>/g)].map(m => textOf(m[1]))
    assert.ok(rows.length >= 5)
    assert.equal(rows.find(r => r.includes('Nov 14')), 'Sat, Nov 14 T1 3–1 GEN')
    assert.ok(rows.every(r => / \d–\d /.test(r)), rows.join(' | '))
  })

  test('before next year starts, the champion stays up and the card says when it begins', async () => {
    const { text } = await renderCard({ snapshot: t2026, live: t2027, now: '2027-08-01T12:00:00Z' })
    assert.match(text, /Worlds 2026 is over/)
    assert.match(text, /Worlds 2027 starts Thu, Oct 14\./)
    assert.doesNotMatch(text, /TBD/)
    // Nov 14 is more than six months back by now, and in another year.
    assert.match(text, /in the Finals\s+on Saturday, November 14, 2026\./)
  })

  test('a day out, next year\'s schedule takes over with its name in the heading', async () => {
    const { text } = await renderCard({ snapshot: t2026, live: t2027, now: '2027-10-13T19:00:00Z' })
    assert.match(text, /Worlds 2027 · Coming up/)
    assert.match(text, /Thu, Oct 14, 1:00 PM CDT TBD vs TBD +Play-Ins/)
    assert.doesNotMatch(text, /is over/)
  })

  test('a feed frozen for two days keeps its real results and sums up the rest', async () => {
    const { text } = await renderCard({ snapshot: frozen, live: frozen, now: '2026-10-31T00:00:00Z' })
    assert.doesNotMatch(text, /Result pending/)
    assert.match(text, /TES 2–0 LOS/)
    assert.match(text, /Awaiting results: T1 vs GEN, HLE vs BLG, and 7 more/)
    assert.match(text, /Live feed · updated 2 days ago, and some results aren't in/)
  })

  test('a feed frozen for ~10 h names the one match without a result', async () => {
    const { text } = await renderCard({ snapshot: frozen, live: frozen, now: '2026-10-29T02:00:00Z' })
    assert.match(text, /Awaiting results: MKOI vs T1(?!,)/)
    assert.match(text, /G2 2–1 TSW/)
    assert.match(text, /updated 10 hours ago, and some results aren't in/)
  })

  test('the heading says Live now while a match is on', async () => {
    const partial = parseIcs(feed([...swiss, ...knockouts(false)]))
    const { text } = await renderCard({ snapshot: partial, live: partial, now: '2026-11-14T21:00:00Z' })
    assert.match(text, /Live now/)
    assert.doesNotMatch(text, /Coming up/)
  })

  test('a stale card counts the overflow without blaming the feed', async () => {
    const { text } = await renderCard({ snapshot: frozen, now: '2026-11-20T12:00:00Z' })
    assert.match(text, /and \d+ more matches with no result yet/)
  })
})
