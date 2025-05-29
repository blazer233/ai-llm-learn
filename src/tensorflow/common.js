export const FILE_PATH = 'file://./output/model';
export const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
export function charToOneHot(charToIndex, char) {
  const arr = new Array(chars.length).fill(0);
  const idx = charToIndex[char];
  if (idx === undefined) throw new Error(`未知字符: ${char}`);
  arr[idx] = 1;
  return arr;
}
