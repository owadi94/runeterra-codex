# Lore notes for building Runeterra Codex

Working notes in our own words. Not copied from Riot or the book. Last checked: 12 Nov 2026.

## Sources and rules
- **Official lore:** Riot's Universe site, https://universe.leagueoflegends.com. It wins over older material.
- **The book "Realms of Runeterra":** a private reference only. Never put its text or art on the site.
  It's useful for ideas about places, armies and objects that we then describe and draw ourselves.
- **Fan art:** original designs only (see higgsfield-prompts.md). No champions, no copied art.
- Every new fact is checked against the champion's official biography before it goes on the site.

## Live data the site reads (no API key needed, browsers allowed)
| What | Where |
|---|---|
| Patch version | `https://ddragon.leagueoflegends.com/api/versions.json` |
| Champions, titles, roles | `https://ddragon.leagueoflegends.com/cdn/<ver>/data/en_US/champion.json` |
| One champion: abilities, skins, stats | `.../cdn/<ver>/data/en_US/champion/<Id>.json` |
| Champion art | `.../cdn/img/champion/splash|loading/<Id>_0.jpg`, icons `.../cdn/<ver>/img/champion/<Id>.png` |
| Region of every champion, release date | `https://universe-meeps.leagueoflegends.com/v1/en_us/search/index.json` |
| One champion: quote, short and full bio, races, roles, stories, related | `.../v1/en_us/champions/<slug>/index.json` |
| One region: overview, champion list | `.../v1/en_us/factions/<slug>/index.json` |
| Riot's links between champions | saved in `relations.json` (174 champions, 395 links) |

Region slugs: demacia, noxus, freljord, ionia, piltover, zaun, shurima, mount-targon, ixtal, void,
bilgewater, shadow-isles, bandle-city, and "unaffiliated" (we call them Wanderers).

## Regions as of Nov 2026 (champion counts from Riot's data)
Ionia 23 · Wanderers 21 · Noxus 17 · Demacia 15 · Freljord 15 · Zaun 14 · Shurima 11 · Shadow Isles 10 ·
The Void 9 · Bandle City 8 · Ixtal 8 · Piltover 8 · Bilgewater 8 · Targon 7. Total 174.
Riot's search index and the region page can differ by one (Demacia shows 16 on its region page).
Wanderers include Ryze, Bard, Aurelion Sol, Jax, Kindred, Zilean, Lucian, Senna and Aatrox.

## Map facts (where things sit)
- Valoran is the main continent: Freljord across the north, Demacia in the west, Noxus in the east,
  Piltover on the coast with Zaun in the canyon beneath it.
- Targon lies far to the west and south. Shurima is the great southern desert, with Ixtal's jungle to its east.
- Icathia, where the Void broke through, is east of Shurima.
- Ionia is the island chain to the east, across the Conqueror's Sea. Bilgewater is in the Serpent Isles to
  the south-east. The Shadow Isles lie far out to the south-east.
- The Guardian's Sea separates Valoran from Shurima. Bandle City has no fixed place; it's reached
  through the spirit realm.
- Places used on our map: Great City of Demacia, Immortal Bastion (Noxus), Howling Abyss (Freljord),
  Mount Targon, the Sun Disc (Shurima), Ixaocan (Ixtal), Icathia (Void), Placidium of Navori (Ionia),
  Slaughter Docks (Bilgewater), Helia (Shadow Isles).

## Verified details worth building on (from official biographies)
- Darius and Draven are orphans from Basilich. Darius later stood with Swain's coup because his oath is to Noxus, not a ruler.
- Yasuo and Yone are half-brothers.
- Kayle and Morgana are twins born beneath Mount Targon during the Rune Wars; Kayle is the elder by moments.
- Katarina and Cassiopeia are sisters; Talon serves their father, General Du Couteau, and only him.
- Senna was apprenticed to Lucian's father before marrying Lucian. Thresh took her soul when she shielded Lucian.
- Ashe and Sejuani were childhood friends before their families fell out. Ashe married Tryndamere to unite two peoples.
- Lux (as a volunteer called Luxanna) visited Sylas in prison; he used her to escape.
- Jarvan IV and Garen became friends in training; Garen leads the Dauntless Vanguard. Shyvana saved Jarvan's life.
- Azir named Xerath ("one who shares"), and Xerath once saved Azir from an assassin, before betraying him.
- Renekton wrestled Xerath into the Tomb of the Emperors and had Nasus seal it.
- Kalista was the king's niece and general; the assassin's blade she deflected poisoned Queen Isolde.
- Aatrox killed the Aspect of War; its host Atreus survived and became Pantheon.
- Kha'Zix tore out one of Rengar's eyes.
- Twisted Fate's real name is Tobias. Graves was captured after a job went wrong, while Tobias escaped.
- LeBlanc manipulated Swain when he was young and helped disgrace him; he then seized Noxus on his own.

## Not confirmed yet (keep off the site until checked)
- Viego and Thresh working together. Ashe and Lissandra as direct enemies. Garen and Katarina's rumored romance.
- Akshan and Lucian as partners. (Akshan's mentor Shadya was a Sentinel of Light.)

## Ideas queued
- Notable places per region as clickable points on the map, each with its own short entry.
- Armies, weapons and artifacts pages, illustrated with our fan art.
- Shareable links for a focused champion in the Web.
