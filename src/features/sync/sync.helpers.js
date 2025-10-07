export function mergeSorgusuOlustur(uniqKeys){
  const cols = uniqKeys.map(k => `[${k}]`).join(', ');
  const srcCols = uniqKeys.map(k => `@${k} AS [${k}]`).join(', ');
  const setCols = uniqKeys.filter(k => k !== 'Id').map(k => `t.[${k}] = s.[${k}]`).join(', ');
  const valuesCols = uniqKeys.map(k => `s.[${k}]`).join(', ');
  return { cols, srcCols, setCols, valuesCols };
}

export function paramBagla(reqMerge, uniqKeys, rawRow, sql){
  for (const k of uniqKeys) {
    const v = rawRow[k];
    if (typeof v === 'boolean') {
      reqMerge.input(k, sql.Bit, v);
    } else {
      reqMerge.input(k, sql.NVarChar(sql.MAX), v == null ? null : String(v));
    }
  }
}
