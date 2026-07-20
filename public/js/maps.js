// Map registry — single source of truth for selectable arenas.
import { buildWorld } from './map.js';
import { buildPoolDay } from './map_pool_day.js';
import { buildMidsommar } from './map_midsommar.js';
import { buildMidTbana } from './map_tunnelbana.js';
import { buildMidModerna } from './map_moderna.js';
import { buildMidDalahast } from './map_dalahast.js';
import { buildMidLada } from './map_lada.js';

export const MAPS = {
  awp_map:      { name: 'AWP Arena (Plaza)',   build: buildWorld },
  fy_pool_day:  { name: 'The Pool',            build: buildPoolDay },
  fy_midsommar: { name: 'Midsummer Meadow',    build: buildMidsommar },
  fy_tunnelbana:{ name: 'Tunnelbana (T-bana)', build: buildMidTbana },
  de_moderna:   { name: 'Moderna Museum',      build: buildMidModerna },
  de_dalahast:  { name: 'Dala Horse Square',   build: buildMidDalahast },
  fy_lada:      { name: 'The Barn (Lada)',     build: buildMidLada },
};
export const MAP_IDS = Object.keys(MAPS);
export const DEFAULT_MAP = 'awp_map';

export function resolveMapId(id) {
  return MAPS[id] ? id : DEFAULT_MAP;
}
