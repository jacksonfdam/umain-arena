// player side: P > B = DESIGNER, B > P = DEVELOPER, tie = NEUTRAL
export function sideOf(mp: number, mb: number): [string, string] {
  if (mp > mb) return ['DESIGNER', '#e03232'];
  if (mb > mp) return ['DEVELOPER', '#1faa4d'];
  return ['NEUTRAL', '#ffd23f'];
}
