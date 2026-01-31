export function isOrthogonallyConnected(cells: Array<[number, number]>): boolean {
  if (cells.length === 0) return true;
  const set = new Set(cells.map(([x, y]) => `${x}:${y}`));
  const stack = [cells[0]];
  const visited = new Set<string>();

  while (stack.length) {
    const [x, y] = stack.pop()!;
    const key = `${x}:${y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const neighbors: Array<[number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      const nkey = `${nx}:${ny}`;
      if (set.has(nkey) && !visited.has(nkey)) stack.push([nx, ny]);
    }
  }

  return visited.size === set.size;
}
