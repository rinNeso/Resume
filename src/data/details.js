/**
 * data/details.js
 *
 * The project pages (/projects/<id>), keyed by the `id` in resume.js.
 * Each has a `preview` (what the top of the page shows) and `sections`.
 *
 *   preview.type   'flow'      rows of [where it starts, ...steps]  (FlowDiagram)
 *                  'terminal'  real captured output                  (TerminalPreview)
 *                  'haptics'   SoloRef's haptic patterns             (HapticsPreview)
 *                  'calendar'  the live worlds-cal feed              (CalendarPreview)
 *   screenshots    optional [{ src, alt, caption, device: 'phone' | 'watch' }] in public/projects/
 *   shotsNote      optional line under the screenshots, e.g. where they came from
 *   sections       [{ title, paragraphs?, points?, table? { head, rows }, quote? }]
 */

export const details = {
  homelab: {
    preview: {
      type: 'flow',
      caption: 'How each kind of traffic reaches the server.',
      rows: [
        ['Remote viewers', 'Cloudflare Tunnel', 'Jellyfin, Mattermost, Jitsi'],
        ['Players and callers', 'UniFi port forwards', 'Counter-Strike 2, Minecraft, Jitsi audio and video'],
        ['Devices at home', 'Local DNS to Caddy, wildcard TLS', 'Jellyfin at full LAN speed'],
        
        ['Every night', 'ZFS snapshots', 'Separate backup pool'],
      ],
    },
    sections: [
      {
        title: 'Problems I solved',
        points: [
          '<strong>Drives that stall the whole box.</strong> The main pool turned out to be SMR drives, which handle small random writes terribly: the system froze while the pool sat nearly idle. I diagnosed it from the kernel\'s I/O pressure stats and wrote a scheduler that pauses the background jobs writing to that pool while someone streams from outside the house, telling home and remote viewers apart by the address the proxy reports.',
          '<strong>Home streams leaving the house.</strong> Streams at home used to go out through Cloudflare and back, capped by upload speed. A LAN-side Caddy proxy with a wildcard certificate and local DNS now serves home devices directly, while outside viewers still use the tunnel.',
          '<strong>A single-threaded game server.</strong> Counter-Strike 2 is bound by one core. I pinned it to one CPU socket at the performance governor, and a script keeps every other container off those cores, re-pinning any that an app update recreates.',
          '<strong>A VPN that died while reporting healthy.</strong> The provider rotated its servers and the tunnel failed for three days while the container\'s health check still passed. The VPN\'s own updater can\'t reach the internet through its kill switch, so a daily job on the host now refreshes the server list.',
        ],
      },
      {
        title: 'What runs on it',
        points: [
          'Jellyfin media server, transcoding on the GPU with NVENC',
          'A public Counter-Strike 2 server with 20 slots, and a modded Minecraft server',
          'Mattermost and Jitsi as a self-hosted alternative to Discord',
          'The <a href="/projects/discord-bot">Discord bot</a> and the <a href="/projects/disc-archiving">disc ripper</a>',
        ],
      },
    ],
  },

  soloref: {
    icon: '/projects/soloref.png',
    screenshots: [
      { src: '/projects/soloref-setup.webp', device: 'watch', caption: 'Setup', alt: 'SoloRef setup screen: New game, with the format set to 3v3, 15 minutes, first to 15.' },
      { src: '/projects/soloref-live.webp', device: 'watch', caption: 'Live play, 6 seconds on the shot clock', alt: 'Live play: shot clock at 6 in yellow, game clock 5:17 in the first half, score 2 to 3, scoring buttons along the top.' },
      { src: '/projects/soloref-dead-ball.webp', device: 'watch', caption: 'Dead ball: pick the shot-clock reset', alt: 'Dead ball screen: choose 24, 14 or keep the shot clock, then a large green GO button that restarts play at the touch.' },
      { src: '/projects/soloref-sudden-death.webp', device: 'watch', caption: 'Tied at time: next score wins', alt: 'Half-court sudden death: NEXT SCORE WINS in large yellow text, score tied 2 to 2.' },
    ],
    shotsNote: 'From the watchOS simulator, using the app\'s built-in demo states.',
    preview: {
      type: 'haptics',
      caption: 'The cues a referee feels, from the app\'s pattern table. Play one to see its timing; on Android it also vibrates.',
    },
    sections: [
      {
        title: 'The rule it\'s built around',
        quote: 'Never make the referee blow a whistle for something that did not happen.',
        paragraphs: [
          'The app is worth two signals felt with the wrist down: 6 seconds left on the shot clock, to get the whistle up and count the last five aloud, and zero, to call the violation if the ball is still in hand. Everything else exists to keep those two signals true.',
          'When errors have to be traded off, the order is fixed: an early or false cue is worse than a wrong number, which is worse than a missed cue, which is worse than an extra tap.',
        ],
      },
      {
        title: 'Controls made for not looking',
        points: [
          'Tap the big zone for a fresh 24, or the bottom zone for 14 after an offensive rebound.',
          'Hold anywhere for half a second, or double-tap, to stop the clock. The stop is timestamped when the finger lands, not when it lifts.',
          'No gesture is a toggle: a tap never stops a clock and a hold never resets one.',
          'A dead strip sits between the 24 and 14 zones, so a sliding finger can\'t hit the wrong one.',
        ],
      },
      {
        title: 'Built to survive a crash',
        paragraphs: [
          'Clocks are stored as start times rather than ticking counters, so a game restored after a crash shows true time. Cues that fell due while the app was down are logged as missed rather than played late, since a late zero would look like a beaten clock. A HealthKit workout session keeps the app alive with the wrist down so the haptics keep firing.',
        ],
      },
      {
        title: 'How it\'s put together',
        points: [
          'SoloRefCore is a dependency-free Swift package: a pure reducer for game state, FIBA\'s 2026 shot-clock switch-off rules, cue scheduling and haptic arbitration. Its 55 tests run on Linux.',
          'The watchOS app is only side effects: one timer, the haptic player, the workout session and saving to disk after every action.',
          'Supports the tournament\'s half-court 3v3 format (first to 15, next basket wins on a tie) and a full two-half game.',
          'Shipped through TestFlight and used to officiate at my unit\'s sports day.',
        ],
      },
    ],
  },

  'discord-bot': {
    preview: {
      type: 'flow',
      caption: 'Chat text never leaves the house. The only outside services involved are Discord itself, and Instagram for a link someone posted.',
      rows: [
        ['/summary in Discord', 'Bot on the home server', 'Qwen 3.8 27B on my desktop\'s GPU', 'Topic outline back to you'],
        ['Typing in a voice channel', 'Piper text-to-speech on the server', 'Spoken in the call'],
        ['An Instagram link', 'Fetched by the bot', 'Playable video in the chat'],
      ],
    },
    sections: [
      {
        title: 'Commands',
        table: {
          head: ['Command', 'Summarizes'],
          rows: [
            ['/summary', 'The last 3 hours'],
            ['/summary since:9am', 'Since a time today'],
            ['/summary hours:12 or days:3', 'A rolling window, up to 7 days'],
            ['/summary count:200', 'The last N messages, up to 5,000'],
            ['big:true', 'Uses the larger 122B model'],
            ['public:true', 'Posts to the channel instead of only to you'],
          ],
        },
      },
      {
        title: 'Details that make it usable',
        points: [
          'Summaries come back as a topic outline: a bold line naming the topic and who was in it, then short bullets. The bot reshapes whatever the model writes into that format.',
          'A window longer than a day gets one section per day, posted as each finishes. Private multi-day summaries go to DMs, which also gets around Discord\'s 15-minute reply limit.',
          'Text-to-speech is limited to an allowlist and one voice channel, after it was abused when anyone could use it.',
        ],
      },
      {
        title: 'Why run the model locally',
        paragraphs: [
          'Friends\' messages shouldn\'t be sent to a cloud AI. The model runs on my own desktop\'s integrated GPU, which only accepts requests from the server.',
        ],
      },
    ],
  },

  morsel: {
    icon: '/projects/morsel.png',
    screenshots: [
      { src: '/projects/morsel-resting.webp', device: 'phone', caption: 'Resting: food down', alt: 'Meal timer resting between bites: a ring counting down from 30 with 23 seconds left, 11 bites, 6:06 into the meal.' },
      { src: '/projects/morsel-take-a-bite.webp', device: 'phone', caption: 'Rest over: take a bite', alt: 'Meal timer ready: a full green ring reading Take a bite, then tap when it\'s down.' },
      { src: '/projects/morsel-history.webp', device: 'phone', caption: 'Meal history', alt: 'Meal history list: each meal with bites, average pace, fullness out of 10, calories and duration.' },
      { src: '/projects/morsel-calories.webp', device: 'phone', caption: 'Calories', alt: 'Calories screen: today\'s total against a goal, the 7-day average, and a daily intake chart with a 7-day average line.' },
      { src: '/projects/morsel-weight.webp', device: 'phone', caption: 'Weight trend', alt: 'Weight screen: smoothed trend weight, rate per week, predictions at 7 and 30 days and for the goal, and milestone progress.' },
    ],
    shotsNote: 'From the iOS simulator, filled with sample data rather than real meals or weights.',
    preview: {
      type: 'flow',
      caption: 'Everything stays on the phone. Weight comes in from Apple Health; nothing goes out.',
      rows: [
        ['Each bite', 'Meal timer (a pure reducer)', 'Paced to a target'],
        ['End of meal', 'One-tap fullness rating', 'Pace vs. fullness, per meal'],
        ['Apple Health', 'Body-weight import', 'Smoothed weight trend'],
        ['All of it', 'SQLite via GRDB', 'Local only'],
      ],
    },
    sections: [
      {
        title: 'Why it exists',
        paragraphs: [
          'Fullness takes a while to register, so a meal finished in 8 minutes is eaten blind. The bite timer is the intervention; everything else measures whether it\'s working.',
          'The evidence is checked rather than assumed. A 22-study meta-analysis (Robinson et al., 2014) found slower eating lowers how much people eat, but not how full they feel afterwards, so the app treats intake as the outcome that matters and fullness as a noisy signal.',
        ],
      },
      {
        title: 'What it does',
        points: [
          'A bite timer that paces a meal, the core of the app.',
          'A one-tap fullness rating at the end of each meal, stored beside the bite timings so pace can be compared against fullness for the same meal size.',
          'A meal journal and calorie log.',
          'Weight imported from Apple Health and shown as a smoothed trend, so one heavy morning doesn\'t read as a gain.',
        ],
      },
      {
        title: 'How it\'s put together',
        points: [
          'Native SwiftUI for iOS 26. The design goal: indistinguishable from Apple\'s own apps, with deeper customization underneath.',
          'MorselCore is a dependency-free Swift package (the meal-timer reducer and trend math) whose 84 tests run on Linux, no Xcode needed.',
          'MorselData stores everything in SQLite through GRDB. The Xcode project is generated from a spec, and builds go out through TestFlight.',
        ],
      },
    ],
  },

  'worlds-cal': {
    preview: {
      type: 'calendar',
      feed: 'https://rinneso.github.io/worlds-cal/worlds.ics',
      subscribe: 'webcal://rinneso.github.io/worlds-cal/worlds.ics',
      caption: 'Live from the published feed, in your time zone.',
    },
    sections: [
      {
        title: 'How it works',
        points: [
          'A Python script pulls the schedule from the lolesports API and writes an iCalendar file.',
          'GitHub Actions rebuilds it every 15 minutes and publishes it to GitHub Pages, so any calendar app can subscribe.',
          'Each match keeps a stable ID, so "TBD vs TBD" slots update in place when teams qualify, and finished matches show the score.',
          'It follows the newest tournament the API lists, so it rolls over to next year with no changes.',
        ],
      },
    ],
  },

  'hyperbox-hw': {
    preview: {
      type: 'terminal',
      title: 'check.sh',
      caption: 'Real output, captured Oct 26, 2026. The four DRIFT lines are files that no longer match the repo, which is exactly what the check is for.',
      text: `== kernel cmdline ==
  ok   amdgpu.runpm=0
  ok   snd_hda_intel.power_save=0
  ok   snd_hda_intel.power_save_controller=N
  ok   pcie_port_pm=off
== udev ==
  ok   81-egpu-no-runtime-pm.rules
  ok   82-egpu-pin-pm-trigger.rules
  ok   20-audio-pm.rules mask (0 bytes)
  ok   hda-egpu-pm.conf
== eGPU power pinning (live state) ==
  ok   0000:00:03.1 control=on d3cold=0
  ok   0000:c2:00.0 control=on d3cold=0
  ok   0000:c3:00.0 control=on d3cold=0
  ok   0000:c4:00.0 control=on d3cold=0
  ok   0000:c4:00.1 control=on d3cold=0
  ok   egpu-pin-pm.service active
== pacman watchlist ==
  DRIFT hw-watchlist-check -- differs from repo
  DRIFT hw-watchlist.conf -- differs from repo
  DRIFT 00-hw-watchlist.hook -- differs from repo
== local LLM stack ==
  DRIFT ollama override -- differs from repo
  ok   open-webui.service
  ok   ollama models are local-only
  ok   open-webui has no external connections
== package holds ==
  ok   ddcutil pinned via IgnorePkg (ddcutil 2.2.7-1.1)

18 ok, 4 drifted`,
    },
    sections: [
      {
        title: 'The problem',
        paragraphs: [
          'The graphics card lives in an external enclosure connected over OCuLink. It kept falling off the PCIe bus: black screen, and only a hard power-off brought it back. The logs showed the card\'s HDMI-audio function failing first every time. Linux put it to sleep after 10 seconds of silence, and waking it meant retraining the external link, which sometimes failed and took the whole card with it.',
        ],
      },
      {
        title: 'The fix, in layers',
        table: {
          head: ['Layer', 'What it does here'],
          rows: [
            ['Kernel boot parameters', 'Turn off power saving for the GPU driver, the audio driver and the PCIe ports'],
            ['Driver options', 'Tell the audio driver never to power down'],
            ['udev rules', 'When the GPU, its audio function, the switch ports above them or the OCuLink slot appear, set each to always on. This also covers reconnecting while running'],
            ['systemd service', 'Applies the same settings again at startup, in case anything reset them'],
          ],
        },
        paragraphs: ['Any one layer can be undone by an update, which is why there are several.'],
      },
      {
        title: 'Guardrails',
        points: [
          'A package-manager hook checks every update against a watchlist of packages known to break this machine. It blocks the dangerous ones and warns about the risky ones. A monitor-control library update once killed the GPU at login three times in a row; it stays pinned until the fixed version ships.',
          'check.sh compares the repo against the live system and reports drift, like the output above.',
          'Each failure has a written incident note: what happened and why the fix works.',
        ],
      },
    ],
  },

  'disc-archiving': {
    preview: {
      type: 'terminal',
      title: 'ripper log',
      caption: 'Real output from the ripper container. A film disc goes from inserted to ejected with no input.',
      text: `2026-08-22 12:56:50  DISC_1: new disc detected
2026-08-22 12:57:20  DISC_1: movie - 1 title(s) [0], main 126min/37737MB -> /output/movies/DISC_1
2026-08-22 12:57:20  DISC_1: title 0 starting
2026-08-22 13:31:20  DISC_1: done - 1/1 title(s), 33.9G
2026-08-22 13:31:24  tray ejected
2026-08-22 19:52:51  DISC_2: new disc detected
2026-08-22 19:53:16  DISC_2: movie - 1 title(s) [0], main 87min/55088MB -> /output/movies/DISC_2
2026-08-22 19:53:16  DISC_2: title 0 starting
2026-08-22 20:35:17  DISC_2: done - 1/1 title(s), 50.6G
2026-08-22 20:35:21  tray ejected`,
    },
    sections: [
      {
        title: 'Deciding what to rip',
        points: [
          'MakeMKV\'s built-in auto-ripper copies every title, which on these discs means two ~80 GB copies of the same film. The ripper replaces it with its own selection.',
          'Duplicates are dropped when two titles share a duration and their sizes are within 0.5%, which removes a film\'s twin but keeps every distinct episode on a TV disc.',
          'Film or TV is decided by size, not length: a feature dwarfs its extras, while episodes are all about the same size. A 108-minute film can sit beside an 80-minute making-of.',
          'A title that stops writing for 7 minutes is abandoned, and a failed disc gets one retry after a clean.',
        ],
      },
      {
        title: 'Deciding what to import',
        points: [
          'A rip is filed automatically only when its title matches at 0.90 or better with no close runner-up, and its runtime is within 8% of the movie database\'s.',
          'The runtime check stops one disc of a two-disc film importing as the whole movie. Extended editions go to a review queue, which is the right call.',
          'Rips are staged inside the library\'s own filesystem, so importing a 70 GB file is an instant rename rather than a copy.',
        ],
      },
      {
        title: 'Drive quirks worth knowing',
        points: [
          'The LG BP60NB10 needs no firmware flashing, but the container needs both its block device and its raw SCSI node.',
          'Ejecting takes two calls: the eject command reports success but does nothing while the door is latched, so it has to be unlocked first.',
        ],
      },
    ],
  },
}
