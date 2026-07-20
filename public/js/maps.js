// Map registry — single source of truth for selectable arenas.
import { buildWorld } from './map.js';
import { buildPoolDay } from './map_pool_day.js';

export const MAPS = {
  awp_map:     { name: 'AWP Arena (Plaza)',   build: buildWorld },
  fy_pool_day: { name: 'The Pool',            build: buildPoolDay },
};
export const MAP_IDS = Object.keys(MAPS);
export const DEFAULT_MAP = 'awp_map';

export function resolveMapId(id) {
  return MAPS[id] ? id : DEFAULT_MAP;
}
