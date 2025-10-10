export function createMergeQuery(uniqKeys){
  const cols = uniqKeys.map(k => `[${k}]`).join(', ');
  const srcCols = uniqKeys.map(k => `@${k} AS [${k}]`).join(', ');
  const setCols = uniqKeys.filter(k => k !== 'Id').map(k => `t.[${k}] = s.[${k}]`).join(', ');
  const valuesCols = uniqKeys.map(k => `s.[${k}]`).join(', ');
  return { cols, srcCols, setCols, valuesCols };
}


