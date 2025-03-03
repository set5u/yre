import type { File } from "./file";

export type Runtime = {
  str: Record<string, string>;
  files: Record<string, File>;
};

export const run = (el: HTMLDivElement, files: File[]) => {
  const runtime: Runtime = { str: {}, files: {} };
  for (const f of files) {
    runtime.files[f.name] = f;
  }
  (async () => {
    for (const f of files) {
      await init(runtime, f);
    }
  })();
  return runtime;
};

const init = async (runtime: Runtime, file: File) => {
  const entry = await file.read("entry");
  if (!entry) {
    return;
  }
};

export const parse = (buf: ArrayBuffer): Record<string, string> => {
  // Bufferは、4byte=length,length-byte=key,4byte=length,length-byte=valueの繰り返し
  const dataView = new DataView(buf);
  const result: Record<string, string> = {};
  let offset = 0;
  while (offset < buf.byteLength) {
    const keyLength = dataView.getUint32(offset, true);
    offset += 4;
    const key = new TextDecoder().decode(new DataView(buf, offset, keyLength));
    offset += keyLength;
    const valueLength = dataView.getUint32(offset, true);
    offset += 4;
    const value = new TextDecoder().decode(
      new DataView(buf, offset, valueLength),
    );
    offset += valueLength;
    result[key] = value;
  }
  return result;
};
export const stringify = (record: Record<string, string>): ArrayBuffer => {
  const keyLengths = Object.keys(record).map((key) => key.length);
  const valueLengths = Object.values(record).map((value) => value.length);
  const totalLength =
    keyLengths.reduce((a, b) => a + b, 0) +
    valueLengths.reduce((a, b) => a + b, 0) +
    Object.keys(record).length * 8;
  const buffer = new ArrayBuffer(totalLength);
  const dataView = new DataView(buffer);
  let offset = 0;
  for (const key in record) {
    const value = record[key];
    const keyLength = key.length;
    const valueLength = value.length;
    dataView.setUint32(offset, keyLength, true);
    offset += 4;
    new TextEncoder().encodeInto(key, new Uint8Array(buffer, offset));
    offset += keyLength;
    dataView.setUint32(offset, valueLength, true);
    offset += 4;
    new TextEncoder().encodeInto(value, new Uint8Array(buffer, offset));
    offset += valueLength;
  }
  return buffer;
};
