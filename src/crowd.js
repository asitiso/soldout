export const MAX_CUSTOMERS = 50;
export const MAX_OUTSIDE = 32;
export const indoorCapacity = (level) => [8, 12, 18][level - 1];
export const isIndoor = (c) => !['outside', 'exit', 'gone'].includes(c.state);
export const outsideSpot = (index) => ({
  x: 4.8 - (index % 16) * 0.65,
  z: 4.65 + Math.floor(index / 16) * 0.95,
});
