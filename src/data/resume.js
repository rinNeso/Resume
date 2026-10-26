/**
 * data/resume.js
 *
 * Everything the site says. Edit this file to update the resume; the
 * components only lay it out. `points` may contain inline <a> links.
 * The phone number is deliberately left off the public site.
 */

export const profile = {
  name: 'Nathan Heiland',
  location: 'San Antonio, TX',
  title: 'Software Developer',
  role: 'Team lead at <strong>Platform One</strong>, the Department of Defense\'s enterprise DevSecOps platform. Seven years building web apps, CI/CD pipelines and simulation tools.',
  credentials: [
    { text: 'Active TS/SCI clearance', key: true },
    { text: 'Staff Sergeant, USAF' },
    { text: 'AFSC 1D7 · Computer Systems Programmer' },
  ],
  email: 'nathan@heiland.email',
  github: 'rinNeso',
}

export const summary = 'I lead and mentor a small development team and act as its security and compliance reviewer for AI-assisted code. I\'ve used AI coding tools daily since 2022, now mainly Claude Code, with a strict human-in-the-loop standard for anything that ships. Outside work I run a self-hosted server and build small apps for myself and my friends.'

export const experience = [
  {
    title: 'Team Lead / Software Developer',
    org: 'U.S. Air Force, Platform One',
    grade: 'SSgt · 1D7',
    when: 'Feb 2024 – Present',
    where: 'San Antonio, TX',
    points: [
      'Promoted from front-end developer on a 10-person team to lead of a 4-person team, mentoring 3 junior developers.',
      'Co-built <a href="https://p1.dso.mil" target="_blank" rel="noopener">p1.dso.mil</a>, Platform One\'s public website, from scratch in two weeks with one other developer using Vue.js and Vuetify.',
      'Stood up new projects on Party Bus by adapting a standard self-hosted GitLab CI/CD pipeline to each project\'s build, test and deployment needs.',
      'Review AI-generated code from teammates for security and compliance before merge, combining hand review with AI-assisted analysis.',
      'Helped migrate several documentation sites to VitePress.',
      'Work in sprints with full Scrum ceremonies: planning, daily standups, reviews and retrospectives.',
    ],
  },
  {
    title: 'Software Developer',
    org: 'U.S. Air Force, LeMay Center Wargaming Institute',
    grade: '1D7',
    when: 'Mar 2020 – Feb 2024',
    where: 'Montgomery, AL',
    points: [
      'Built, maintained and deployed simulation tools supporting wargames for general officers and other senior military leaders.',
      'Supported dozens of joint wargames with partner nations including Japan, South Korea, Germany, France, the United Kingdom, New Zealand and Australia.',
      'Customized units and statistics in a commercial wargame engine with Lua scripting.',
      'Automated bulk updates to large Excel datasets with Visual Basic, replacing manual edits.',
      'Trusted by the IT department to deploy and administer a wargame on a Red Hat Enterprise Linux server, outside my assigned duties.',
    ],
  },
  {
    title: 'Junior Software Developer',
    org: 'Primerica',
    when: '2017 – 2018',
    where: 'Atlanta, GA',
    points: [
      'Upgraded a customer portal serving Primerica\'s ~5.5 million life insurance clients from Java 6 to Java 8.',
      'Resolved dependency and compatibility issues across 7 interconnected Maven projects using Spring, Tomcat, Oracle and Bouncy Castle.',
      'Maintained JUnit tests on a 3-developer team in a waterfall process.',
    ],
  },
]

/**
 * `repo` is "owner/name" for a public GitHub repo; projects without one
 * show `where` instead (e.g. "Self-hosted").
 */
export const projects = [
  {
    id: 'homelab',
    name: 'HeilandBay homelab',
    kind: 'Infrastructure',
    wide: true,
    lede: 'A TrueNAS SCALE storage and application server on a refurbished Dell Precision T7910, racked with a Ubiquiti router, switch and access point.',
    points: [
      'Hosts containerized services: a Jellyfin media server with GPU transcoding, a public Counter-Strike 2 server, a modded Minecraft server, and self-hosted Mattermost and Jitsi.',
      'Publishes services on subdomains of a custom domain through Cloudflare Tunnel, with a LAN-side reverse proxy and wildcard TLS so viewers at home stream directly.',
      
      'Snapshots every app\'s data nightly to a separate pool.',
    ],
    specs: [
      ['CPU', '2× Xeon E5-2690 v3, 48 threads'],
      ['Memory', '64 GB'],
      ['Storage', '29 TB ZFS RAIDZ1, plus NVMe and SSD pools'],
      ['GPU', 'GTX 1070 for NVENC transcoding'],
      ['Network', 'UniFi gateway, Cloudflare Tunnel, Caddy'],
      ['Runs', 'Docker Compose stacks and TrueNAS apps'],
    ],
    tags: ['TrueNAS SCALE', 'ZFS', 'Docker', 'Cloudflare', 'UniFi', 'Linux'],
    where: 'Self-hosted',
  },
  {
    id: 'soloref',
    name: 'SoloRef: referee shot clock',
    kind: 'watchOS',
    lede: 'An Apple Watch app that lets one referee run a basketball game alone: game clock, shot clock and score, with haptics doing the work during live play.',
    points: [
      'Distinct haptic cues at 6 seconds on the shot and game clocks, at shot-clock zero and at 1:30 left, so they read by feel with the wrist down.',
      'Implements FIBA\'s 2026 shot-clock switch-off rules and the tournament\'s half-court 3v3 format: first to 15, next basket wins on a tie.',
      'Runs inside a HealthKit workout session to keep haptics alive, and restores a game after a crash with the clocks still true.',
      'Pure Swift game logic with 55 tests that run on Linux. Shipped through TestFlight and used to officiate at my unit\'s sports day.',
    ],
    tags: ['Swift', 'SwiftUI', 'watchOS', 'HealthKit'],
    repo: 'rinNeso/soloref',
  },
  {
    id: 'discord-bot',
    name: 'Recap-a-Bara: AI Discord bot',
    kind: 'Python',
    lede: 'A Discord bot for a friend group that keeps all chat data on my own hardware.',
    points: [
      'Summarizes conversations with a self-hosted LLM (Qwen 3.8 27B) running on a separate machine on the LAN.',
      'Speaks typed messages in voice channels so members without microphones can take part.',
      'Reposts Instagram links as playable video in the chat.',
    ],
    tags: ['Python', 'Ollama', 'Piper TTS', 'Docker'],
    repo: 'rinNeso/discord-summary',
  },
  {
    id: 'morsel',
    name: 'Morsel: mindful-eating app',
    kind: 'iOS',
    lede: 'A native iPhone app that paces meals with a bite timer so fullness has time to register.',
    points: [
      'Tracks calories, a meal journal and weight trends, built in SwiftUI with a local SQLite store.',
      'Core logic lives in a dependency-free Swift package with 84 tests that run on Linux, no Xcode needed.',
      'Integrated Apple HealthKit and distributed builds through TestFlight.',
    ],
    tags: ['Swift', 'SwiftUI', 'HealthKit', 'GRDB'],
    repo: 'rinNeso/morsel',
  },
  {
    id: 'worlds-cal',
    name: 'worlds-cal',
    kind: 'Python',
    lede: 'A subscribable calendar of the League of Legends World Championship.',
    points: [
      'Pulls the schedule from the lolesports API and publishes an iCalendar feed to GitHub Pages every 15 minutes.',
      'Undecided matches update in place as teams qualify, and finished matches show the score.',
      'Follows the newest tournament automatically, so it rolls over each year with no changes.',
    ],
    tags: ['Python', 'GitHub Actions', 'iCalendar'],
    repo: 'rinNeso/worlds-cal',
  },
  {
    id: 'hyperbox-hw',
    name: 'hyperbox-hw',
    kind: 'Linux',
    lede: 'A restore point for my Linux workstation: an AMD Strix Halo desktop with an external RX 9070 XT over OCuLink.',
    points: [
      'Captures the kernel parameters, udev rules and services that took real debugging to find, with an install script and a health check.',
      'Includes a package-manager hook that warns before updating packages that have broken this hardware before, plus the write-up behind each fix.',
    ],
    tags: ['Shell', 'systemd', 'udev', 'Arch Linux'],
    repo: 'rinNeso/hyperbox-hw',
  },
  {
    id: 'disc-archiving',
    name: 'Disc archiving automation',
    kind: 'Automation',
    lede: 'Insert a disc and walk away: it is copied, ejected and filed into the media library.',
    points: [
      'Detects a new disc within about 10 seconds, copies it, then ejects the tray when done.',
      'Files a rip automatically only when its title and runtime both match the movie database; anything uncertain goes to a review queue.',
    ],
    tags: ['Python', 'Bash', 'MakeMKV', 'Docker'],
    where: 'Runs on the homelab',
  },
]

export const skills = [
  ['Languages', 'JavaScript, Java, Swift, Python, Lua, Visual Basic (VBA), SQL, HTML/CSS, Bash'],
  ['Frameworks', 'Vue.js, Vuetify, VitePress, Spring, SwiftUI, Apple HealthKit'],
  ['DevOps', 'Self-hosted GitLab CI/CD, Platform One Party Bus and Big Bang, Docker, GitHub Actions, Maven, Tomcat, TestFlight'],
  ['Systems', 'Red Hat Enterprise Linux, TrueNAS SCALE, ZFS, Cloudflare Tunnel, Ubiquiti networking'],
  ['AI tools', 'Claude Code, Ask Sage, OpenAI Codex, Gemini, self-hosted LLMs (Qwen)'],
  ['Practices', 'Scrum, secure code review, technical mentorship, Neovim (<a href="https://github.com/rinNeso/nvim" target="_blank" rel="noopener">my config</a>)'],
]

export const education = [
  { school: 'Georgia Southern University', detail: 'Coursework', when: '2015–2016, 2018–2019' },
  { school: 'Gwinnett Technical College', detail: 'Coursework', when: '2016–2017' },
]
