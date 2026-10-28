// Saves the worlds-cal feed as src/data/worlds-snapshot.json, which the
// worlds-cal project page renders first and falls back to when the live feed
// is unreachable. Run by .github/workflows/worlds-snapshot.yml every day.
//
// A finished tournament is the snapshot worth keeping, so a complete one (its
// Finals scored) is only ever replaced by another complete one: never by a
// partial copy of the same event, and never by next year's schedule until that
// is finished too. While a tournament is running, a feed that has fewer
// matches or fewer scores than the snapshot is taken for a truncated build and
// skipped; the next good one catches up.
//
//   node scripts/worlds-snapshot.mjs [feed-url-or-file]

import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { compareTournaments, fromSnapshot, isComplete, parseIcs, toSnapshot } from '../src/utils/ics.js'

const FEED = 'https://rinneso.github.io/worlds-cal/worlds.ics'
const OUT = fileURLToPath(new URL('../src/data/worlds-snapshot.json', import.meta.url))

async function load (source) {
  if (!/^https?:/.test(source)) return readFile(source, 'utf8')
  const res = await fetch(source, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`${source}: HTTP ${res.status}`)
  return res.text()
}

async function current () {
  try {
    return JSON.parse(await readFile(OUT, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

// What a snapshot says, minus when it was fetched, so an unchanged feed
// doesn't produce a commit every day.
const content = s => JSON.stringify({ calendar: s.calendar, complete: s.complete, events: s.events })

// One match per line, so a commit's diff reads as the scores that changed.
function format (s) {
  const { events, ...head } = s
  const top = JSON.stringify(head, null, 2).slice(0, -2)
  return `${top},\n  "events": [\n${events.map(e => `    ${JSON.stringify(e)}`).join(',\n')}\n  ]\n}\n`
}

function scored (s) {
  return `${s.events.filter(e => e.score).length}/${s.events.length} scored`
}

// Judged from the matches rather than the stored flag, so a snapshot written
// under an older rule is read the same way the page reads it.
const done = s => isComplete(fromSnapshot(s).events)

// Why `next` looks like a step back from `old` for the same tournament, or
// null: fewer matches, fewer scores, or a match that had a score and lost it.
function regression (old, next) {
  if (next.events.length < old.events.length) {
    return `${next.events.length} matches in the feed, ${old.events.length} in the snapshot`
  }
  const count = s => s.events.filter(e => e.score).length
  if (count(next) < count(old)) return `${scored(next)} in the feed, ${scored(old)} in the snapshot`
  const now = new Map(next.events.map(e => [e.uid, e]))
  const lost = old.events.filter(e => e.score && !now.get(e.uid)?.score)
  if (lost.length) return `${lost.map(e => e.match).join(', ')} lost ${lost.length === 1 ? 'its score' : 'their scores'}`
  return null
}

// Returns [write?, reason].
export function decide (old, next) {
  if (!old) return [true, 'no snapshot yet']
  const cmp = compareTournaments(fromSnapshot(next), fromSnapshot(old))
  const oldDone = done(old)
  const nextDone = done(next)
  if (cmp < 0) return [false, `feed is an older tournament (${next.calendar}) than the snapshot (${old.calendar})`]
  if (cmp > 0) {
    if (oldDone && !nextDone) {
      return [false, `${next.calendar} isn't finished (${scored(next)}); keeping the final results of ${old.calendar}`]
    }
    return [true, `new tournament: ${old.calendar} -> ${next.calendar}`]
  }
  if (oldDone && !nextDone) {
    return [false, `the snapshot is complete and the feed isn't (${scored(next)})`]
  }
  if (!oldDone && !nextDone) {
    const why = regression(old, next)
    if (why) return [false, `the feed looks truncated: ${why}`]
  }
  if (content(old) === content(next)) return [false, 'no change in the matches or scores']
  return [true, nextDone && !oldDone ? 'tournament finished' : 'matches or scores changed']
}

async function main () {
  const source = process.argv[2] || FEED
  const feed = parseIcs(await load(source))
  if (!feed.events.length) {
    console.error(`${source}: no events parsed; leaving the snapshot alone`)
    process.exit(1)
  }

  const next = toSnapshot(feed)
  const old = await current()
  const [write, reason] = decide(old, next)

  if (write) {
    await writeFile(OUT, format(next))
    console.log(`wrote ${next.calendar}: ${scored(next)}, complete: ${next.complete} (${reason})`)
  } else {
    console.log(`kept ${old.calendar}: ${scored(old)}, complete: ${done(old)} (${reason})`)
  }
}

// Run as a script; imported by the tests for decide() alone.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) await main()
