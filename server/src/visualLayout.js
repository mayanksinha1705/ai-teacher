// Turns a plain { nodes: [{id,label}], edges: [{source,target,label?}] }
// description into positioned React Flow nodes/edges.
//
// Asking an LLM to also invent x/y pixel coordinates is a common source of
// broken-looking diagrams (overlapping nodes, edges crossing everywhere).
// Instead we only ask it for structure (which nodes exist, how they
// connect) and compute a simple top-to-bottom leveled layout ourselves —
// same idea as a topological/BFS layering algorithm. Cycles (e.g. an
// algorithm's "repeat" edge looping back to an earlier node) are handled by
// just keeping each node's first-seen level; the edge itself still renders
// fine as a curve.

const GAP_X = 220;
const GAP_Y = 110;

export function autoLayoutTree(rawNodes = [], rawEdges = []) {
  const nodes = rawNodes.filter((n) => n && n.id);
  const ids = new Set(nodes.map((n) => String(n.id)));

  const edges = (rawEdges || [])
    .filter((e) => e && ids.has(String(e.source)) && ids.has(String(e.target)))
    .map((e) => ({
      source: String(e.source),
      target: String(e.target),
      label: e.label ? String(e.label).slice(0, 24) : undefined,
    }));

  const incoming = new Map([...ids].map((id) => [id, 0]));
  const childrenOf = new Map([...ids].map((id) => [id, []]));
  edges.forEach((e) => {
    incoming.set(e.target, (incoming.get(e.target) || 0) + 1);
    childrenOf.get(e.source)?.push(e.target);
  });

  const roots = [...ids].filter((id) => incoming.get(id) === 0);
  const startIds = roots.length ? roots : [...ids].slice(0, 1);

  const level = new Map();
  const queue = startIds.map((id) => ({ id, lvl: 0 }));
  while (queue.length) {
    const { id, lvl } = queue.shift();
    if (level.has(id)) continue;
    level.set(id, lvl);
    (childrenOf.get(id) || []).forEach((childId) => {
      if (!level.has(childId)) queue.push({ id: childId, lvl: lvl + 1 });
    });
  }

  // Anything unreachable from a root (shouldn't normally happen) gets
  // appended as its own trailing row rather than being dropped.
  let overflowLevel = Math.max(0, ...[...level.values()]) + 1;
  ids.forEach((id) => {
    if (!level.has(id)) level.set(id, overflowLevel++);
  });

  const byLevel = new Map();
  ids.forEach((id) => {
    const lvl = level.get(id);
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl).push(id);
  });

  const position = new Map();
  [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([lvl, idsAtLevel]) => {
      const rowWidth = (idsAtLevel.length - 1) * GAP_X;
      idsAtLevel.forEach((id, i) => {
        position.set(id, { x: i * GAP_X - rowWidth / 2, y: lvl * GAP_Y });
      });
    });

  const labelOf = new Map(nodes.map((n) => [String(n.id), String(n.label || n.id).slice(0, 60)]));

  return {
    nodes: [...ids].map((id) => ({
      id,
      data: { label: labelOf.get(id) },
      position: position.get(id) || { x: 0, y: 0 },
    })),
    edges: edges.map((e, i) => ({
      id: `e${i}`,
      source: e.source,
      target: e.target,
      ...(e.label ? { label: e.label } : {}),
    })),
  };
}
