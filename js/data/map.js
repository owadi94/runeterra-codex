// The world map: Riot's official map image, loaded from Riot's own map site, with our clickable region spots on top.
// Spot positions are in the image's own pixels (2048 x 2048): [x, y, radius].

export const MAP_IMAGE = 'https://map.leagueoflegends.com/assets/images/tiles/terrain_z1.jpg';
export const MAP_VIEW = { x: 0, y: 430, w: 2048, h: 1330 };   // the part of the image with land on it

export const SPOTS = {
  freljord: [660, 690, 150],
  demacia:  [600, 960, 120],
  noxus:    [1150, 930, 140],
  piltover: [1225, 1085, 55],
  zaun:     [1262, 1160, 50],
  targon:   [830, 1420, 75],
  shurima:  [1040, 1330, 160],
  ixtal:    [1345, 1300, 85],
  void:     [1320, 1570, 85],
  ionia:    [1545, 770, 130],
  bilge:    [1700, 1010, 70],
  shadow:   [1805, 1395, 85],
  bandle:   [330, 1110, 60],     // no fixed place: shown as a portal in the open sea
};
