let needsAwait = false;
const awaiting: (() => void)[] = [];
let running = false;
const run = async () => {
  if (running) {
    return;
  }
  running = true;
  while (awaiting.length) {
    requestAnimationFrame(() => (needsAwait = true));
    while (!needsAwait) {
      const fn = awaiting.shift();
      if (!fn) {
        break;
      }
      await new Promise<void>((r) => setTimeout(() => (fn(), r())));
    }
    needsAwait = false;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  running = false;
};
export default () => {
  return new Promise<void>((r) => (awaiting.push(r), run()));
};
