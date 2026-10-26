/**
 * data/soloref-haptics.js
 *
 * Copied from SoloRef's PatternTable (SoloRefCore/Sources/SoloRefCore/Haptics.swift):
 * each cue is a list of [pulse, offset ms], and each pulse type has an assumed
 * length on the Watch's motor. Update this if the app's patterns change.
 */

export const durations = {
  click: 100, start: 200, stop: 200, success: 200, directionUp: 200,
  directionDown: 200, retry: 500, failure: 500, notification: 700,
}

// Only these pulse types are used for critical cues, so they feel distinct.
export const critical = new Set(['failure', 'directionUp', 'retry'])

export const cues = [
  { id: 'shot-warn', name: 'Shot clock, 6 seconds', when: 'Whistle up, count the last five aloud', steps: [['failure', 0], ['failure', 600]] },
  { id: 'shot-end', name: 'Shot clock, zero', when: 'Call the violation if the ball is still in hand', steps: [['directionUp', 0], ['directionUp', 300], ['directionUp', 600], ['directionUp', 900]] },
  { id: 'game-warn', name: 'Game clock, 6 seconds', when: 'The period is about to end', steps: [['failure', 0], ['failure', 600], ['failure', 1200]] },
  { id: 'period-end', name: 'Period end', when: 'There is no horn, so this is the horn', steps: [['directionUp', 0], ['directionUp', 300], ['directionUp', 600], ['directionUp', 900], ['retry', 1200]] },
  { id: 'game-mark', name: '1:30 left', when: 'A different feel from the critical cues', steps: [['success', 0], ['success', 450], ['success', 900]] },
  { id: 'shot-nag', name: 'Shot clock not started', when: '15 s after a basket, then every 5 s', steps: [['directionDown', 0], ['directionDown', 300], ['directionDown', 600]] },
]

export const spanMs = 1800
