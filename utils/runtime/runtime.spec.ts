//write vitest code to test parse function in runtime.ts
import { describe, expect, it } from "vitest";
import { parse } from "./runtime";

describe("parse", () => {
  it("should parse a buffer", () => {
    const key1 = "key1";
    const value1 = "value1";
    const key2 = "key2";
    const value2 = "value2";
    const key1Length = key1.length;
    const value1Length = value1.length;
    const key2Length = key2.length;
    const value2Length = value2.length;
    const buffer = new ArrayBuffer(
      4 + key1Length + 4 + value1Length + 4 + key2Length + 4 + value2Length,
    );
    const dataView = new DataView(buffer);
    let offset = 0;
    dataView.setUint32(offset, key1Length, true);
    offset += 4;
    new TextEncoder().encodeInto(key1, new Uint8Array(buffer, offset));
    offset += key1Length;
    dataView.setUint32(offset, value1Length, true);
    offset += 4;
    new TextEncoder().encodeInto(value1, new Uint8Array(buffer, offset));
    offset += value1Length;
    dataView.setUint32(offset, key2Length, true);
    offset += 4;
    new TextEncoder().encodeInto(key2, new Uint8Array(buffer, offset));
    offset += key2Length;
    dataView.setUint32(offset, value2Length, true);
    offset += 4;
    new TextEncoder().encodeInto(value2, new Uint8Array(buffer, offset));
    offset += value2Length;
    const result = parse(buffer);
    expect(result).toEqual({
      key1: "value1",
      key2: "value2",
    });
  });
  it("should parse an empty buffer", () => {
    const buffer = new ArrayBuffer(0);
    const result = parse(buffer);
    expect(result).toEqual({});
  });
});

import { stringify } from "./runtime";
describe("stringify", () => {
  it("should stringify a record", () => {
    const record = {
      key1: "value1",
      key2: "value2",
    };
    const buffer = stringify(record);
    const dataView = new DataView(buffer);
    let offset = 0;
    const key1Length = "key1".length;
    const value1Length = record.key1.length;
    const key2Length = "key2".length;
    const value2Length = record.key2.length;
    expect(dataView.getUint32(offset, true)).toBe(key1Length);
    offset += 4;
    expect(
      new TextDecoder().decode(new DataView(buffer, offset, key1Length)),
    ).toBe("key1");
    offset += key1Length;
    expect(dataView.getUint32(offset, true)).toBe(value1Length);
    offset += 4;
    expect(
      new TextDecoder().decode(new DataView(buffer, offset, value1Length)),
    ).toBe("value1");
    offset += value1Length;
    expect(dataView.getUint32(offset, true)).toBe(key2Length);
    offset += 4;
    expect(
      new TextDecoder().decode(new DataView(buffer, offset, key2Length)),
    ).toBe("key2");
    offset += key2Length;
    expect(dataView.getUint32(offset, true)).toBe(value2Length);
    offset += 4;
    expect(
      new TextDecoder().decode(new DataView(buffer, offset, value2Length)),
    ).toBe("value2");
    offset += value2Length;
  });
  it("should stringify an empty record", () => {
    const record = {};
    const buffer = stringify(record);
    expect(buffer.byteLength).toBe(0);
  });
});
