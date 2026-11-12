# Runeterra Codex

Fan-made League of Legends site: nine games, every champion's profile, a region map and the Web of Runeterra.

Live site: https://owadi94.github.io/runeterra-codex/

## Run it locally
```
npm start        # http://localhost:5173
npm test         # plays every game and checks every page in headless Edge or Chrome
```
The site uses JavaScript modules, so open it through `npm start` rather than double-clicking `index.html`.
There is no install step and there are no dependencies.

## Addresses
| Page | Address |
|---|---|
| Home | `#/` |
| Games list, one game | `#/games`, `#/games/<id>` (daily, splash, ability, titles, origins, trial, kinship, threads, blitz) |
| Champions, one champion | `#/champions`, `#/champions/<slug>` |
| Regions map, one region | `#/regions`, `#/regions/<id>` |
| The Web, focused on a champion | `#/web`, `#/web/<slug>` |
| Support, About | `#/support`, `#/about` |

Old addresses such as `#champ-ahri` or `#splash` redirect automatically.

## Code layout
```
index.html            page shell and the markup for each view
css/app.css           design system (tokens at the top), then components
js/main.js            routes and start-up
js/router.js          hash router and the `to` link helpers
js/riot.js            Riot data: Data Dragon (champions, art) and Universe (regions, biographies)
js/state.js           the player's progress, saved in the browser
js/ui.js              small helpers;  js/components.js  shared pieces (champion tiles, search box)
js/graph.js           connections between champions, shortest paths
js/data/              our lore (lore.js), game list, map shapes, Riot's champion links
js/views/             one file per page
js/games/engine.js    shared game engine;  js/games/<id>.js  one file per game
tools/                local server, site test, rebuild of Riot's champion links (npm run relations)
LORE-NOTES.md         verified lore facts and data sources, for adding content
```

## Adding things
- **A game:** create `js/games/<id>.js` that calls `register({ id, init, render })`, import it in `js/main.js`,
  and add its card to `js/data/games.js`.
- **A bond story:** add a line to `STORIES` in `js/data/lore.js` after checking it against the official biographies.
- **Fan art:** save the image in `art/` and add a line to `FANART` in `js/data/lore.js`.
- **Support links:** fill in `js/config.js`.

## Legal
Runeterra Codex was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games.
Riot Games does not endorse or sponsor this project. Champion art and biographies load from Riot's own servers.
