export function cn(...classes: (string | undefined | null | false | Record<string, boolean>)[]) {
  const result: string[] = [];
  for (const c of classes) {
    if (!c) continue;
    if (typeof c === 'string') {
      result.push(c);
    } else if (typeof c === 'object') {
      for (const key of Object.keys(c)) {
        if (c[key]) result.push(key);
      }
    }
  }
  return result.join(' ');
}
