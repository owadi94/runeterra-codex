// Explorable cities. Lore cards use facts checked in LORE-NOTES.md, in our own words.
// kind: 'lore' = from the official lore, 'scene' = our own imagining of daily life.

export const CITIES = [
  {
    id: 'demacia-capital', region: 'demacia', name: 'The Great City of Demacia', ready: true,
    blurb: 'Cross the river bridge, pass the winged guardians at the gate and walk the white streets of the kingdom that outlawed magic.',
    landmarks: [
      { id: 'bridge', name: 'The river crossing', kind: 'scene', x: 0, z: 128, text: 'Barges carry grain and wool from the river farms into the city. Everyone who comes to the capital from the south crosses here.' },
      { id: 'gate', name: 'The great gate', kind: 'lore', x: 0, z: 92, text: 'Demacia was founded by refugees fleeing the Rune Wars, people who wanted a haven from sorcery. The gate is the first thing every visitor sees: pale stone, gold trim, and winged guardians watching the road.' },
      { id: 'walls', name: 'The petricite walls', kind: 'lore', x: 58, z: 62, text: 'The walls are built of petricite, a white stone that dulls magic. It is what makes Demacia a refuge from sorcery, and part of why mages are distrusted here.' },
      { id: 'plaza', name: 'The royal plaza', kind: 'lore', x: 0, z: 8, text: 'The heart of the city. Demacia crowned its first king in 292 AN, and the kingdom still prizes justice, honor and duty above all.' },
      { id: 'palace', name: 'The royal palace', kind: 'lore', x: 0, z: -46, text: 'Seat of the Lightshield kings. Their heir, Prince Jarvan IV, trained beside Garen Crownguard and counts him as his closest friend.' },
      { id: 'barracks', name: 'Barracks of the Dauntless Vanguard', kind: 'lore', x: 46, z: 18, text: "The kingdom's elite soldiers train here. Their Sword-Captain is Garen Crownguard, the prince's friend since their days as rival recruits." },
      { id: 'mageseekers', name: 'The Mageseeker watchtower', kind: 'lore', x: -48, z: 26, text: 'Magic is outlawed in Demacia. The Mageseekers hunt down those born with it. One of their prisoners, the mage Sylas, spent fifteen years in a cell before he escaped.' },
      { id: 'illuminators', name: 'House of the Illuminators', kind: 'lore', x: -34, z: -30, text: "The Illuminators are volunteers who bring aid and comfort, even to prisoners. A young volunteer named Luxanna once visited Sylas in his cell, and he used what he learned from her to break free." },
    ],
    people: [
      { role: 'Gate guard', line: "Welcome to the capital. Keep your blade sheathed, and if you were born with magic, you'd best keep that to yourself too." },
      { role: 'Baker', line: 'Bread from the river farms, baked this morning! Best loaf in the kingdom, ask anyone.' },
      { role: 'Young squire', line: "One day I'll stand in the Dauntless Vanguard. I practise every evening by the barracks wall." },
      { role: 'Old stonemason', line: "Forty years I've cut this pale stone. Folk say it hums when a mage walks past. I've never heard it." },
      { role: 'River merchant', line: 'The barges came in at dawn. Grain, wool, a crate of apples, and not much news from the borders.' },
      { role: 'Pilgrim', line: 'I walked a month to see the winged guardians at the gate. They are taller than the stories.' },
      { role: 'Washerwoman', line: 'White walls are lovely until you have to keep white linen clean beside them.' },
      { role: 'Street musician', line: 'A song of the first king, friend? A copper for a verse, two for the chorus.' },
    ],
  },
  { id: 'noxus-bastion', region: 'noxus', name: 'Noxus and the Immortal Bastion', ready: false, blurb: 'Black iron, red banners and an empire where anyone can rise.' },
  { id: 'piltover-zaun', region: 'piltover', name: 'Piltover and the undercity', ready: false, blurb: 'Brass towers on the cliffs above, chemical haze in the canyon below.' },
  { id: 'bilgewater-docks', region: 'bilge', name: 'The Slaughter Docks', ready: false, blurb: 'A pirate harbor built on stilts and the bones of sea monsters.' },
  { id: 'ionia-placidium', region: 'ionia', name: 'The Placidium of Navori', ready: false, blurb: 'Blossom groves, spirit lights and shrines that float above the water.' },
  { id: 'freljord-tundra', region: 'freljord', name: 'A Freljord longhall', ready: false, blurb: 'Fire, furs and stories under the aurora.' },
  { id: 'shurima-sun-disc', region: 'shurima', name: 'Beneath the Sun Disc', ready: false, blurb: 'A golden capital risen from the sand.' },
];
