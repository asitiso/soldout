// Original synthesized motifs; time is in real seconds, independent of game speed.
export const EFFECTS = {
  click: { notes: [660], duration: 0.07, volume: 0.18, wave: 'triangle' },
  test: { notes: [523.25, 659.25, 783.99, 1046.5], duration: 0.28, volume: 0.55, wave: 'triangle' },
  open: { notes: [523.25, 659.25, 783.99], duration: 0.35, volume: 0.4, wave: 'triangle' },
  sale: { notes: [1318.5, 1760], duration: 0.2, volume: 0.4, wave: 'sine' },
  order: { notes: [440, 554.37, 659.25], duration: 0.13, volume: 0.35, wave: 'triangle' },
  delivery: { notes: [392, 523.25, 659.25], duration: 0.24, volume: 0.4, wave: 'triangle' },
  restock: { notes: [392, 493.88], duration: 0.13, volume: 0.3, wave: 'triangle' },
  soldout: { notes: [440, 349.23, 293.66], duration: 0.24, volume: 0.35, wave: 'triangle' },
  phone: {
    notes: [880, 1174.66, 880, 1174.66, 880, 1174.66],
    duration: 0.12,
    volume: 0.3,
    wave: 'sine',
  },
  unhappy: { notes: [349.23, 293.66], duration: 0.24, volume: 0.25, wave: 'triangle' },
  news: { notes: [587.33, 783.99], duration: 0.24, volume: 0.3, wave: 'triangle' },
  summary: {
    notes: [523.25, 659.25, 783.99, 1046.5],
    duration: 0.4,
    volume: 0.35,
    wave: 'triangle',
  },
  expansion: {
    notes: [392, 523.25, 659.25, 783.99],
    duration: 0.27,
    volume: 0.4,
    wave: 'triangle',
  },
};
export const MELODY = [
  60, 64, 67, 72, 71, 67, 64, 62, 57, 60, 64, 69, 67, 64, 60, 59, 53, 57, 60, 65, 64, 60, 57, 55,
  55, 59, 62, 67, 65, 62, 59, 62,
];
export const BASS = [48, 45, 41, 43];
export const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
