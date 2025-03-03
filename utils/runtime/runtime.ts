import type { Handle } from "./file";

export type Runtime = {
  res: Record<string, string>;
  file: Record<string, Handle>;
  buf: WebGLBuffer[];
  str: string[];
  tex: WebGLTexture[];
  gl: WebGL2RenderingContext;
  progs: Record<string, [WebGLProgram, ...WebGLUniformLocation[]]>;
};

export const run = async (
  el: HTMLDivElement,
  files: Handle[],
  cb?: (fase: number, step: number) => void,
) => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw "Webgl2 Not Supported";
  }
  el.appendChild(canvas);
  const runtime: Runtime = {
    res: {},
    file: {},
    buf: [],
    str: [],
    tex: [],
    gl,
    progs: {},
  };
  for (const f of files) {
    runtime.file[f.name] = f;
  }
  let step = 0;
  for (const f of files) {
    await init(runtime, f);
    cb?.(0, step++);
  }
  const res = runtime.res;

  if ("font" in res) {
    const font = res["font"].replaceAll("\n", "").split(",");
    for (const f of font) {
      if (!f) {
        continue;
      }
      const fo = res[f].replaceAll("\n", "").split(",");
      for (const foi of fo) {
        if (!foi) {
          continue;
        }
        await new FontFace(f, `url(${foi})`).load();
      }
    }
  }
  if ("program" in res) {
    const program = res["program"].replaceAll("\n", "").split(",");
    for (const p of program) {
      if (!p) {
        continue;
      }
      const base = res[p];
      if (!base) {
        continue;
      }
      const sep = base.replaceAll("\n", "").split(",");
      const vsh = res[sep[0]];
      const fsh = res[sep[1]];
      const transMode = sep[2];
      if (!(vsh && fsh)) {
        continue;
      }
      const trans = sep.slice(3);
      const vshH = gl.createShader(gl.VERTEX_SHADER);
      if (!vshH) {
        return;
      }
      gl.shaderSource(vshH, vsh);
      gl.compileShader(vshH);
      const fshH = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fshH) {
        return;
      }
      gl.shaderSource(fshH, fsh);
      gl.compileShader(fshH);
      const prog = gl.createProgram();
      gl.attachShader(prog, vshH);
      gl.attachShader(prog, fshH);
      if (trans.length) {
        gl.transformFeedbackVaryings(
          prog,
          trans,
          transMode === "sep" ? gl.SEPARATE_ATTRIBS : gl.INTERLEAVED_ATTRIBS,
        );
      }
      gl.linkProgram(program);
      const r = (runtime.progs[p] = [prog]);
      let u: WebGLUniformLocation | null;
      let i = 0;
      while ((u = gl.getUniformLocation(prog, "tex" + i++))) {
        r.push(u);
      }
    }
  }
  return runtime;
};

const init = async (runtime: Runtime, file: Handle) => {
  const entry = await file.read("entry");
  if (!entry) {
    return;
  }
  const res = parse(entry);
  const extend = (
    "extend" in res ? res["extend"].replaceAll("\n", "").split(",") : []
  ).reduce((p, c) => ((p[c] = true), p), {} as Record<string, boolean>);
  for (const k in res) {
    runtime.res[k] = extend[k] ? runtime.res[k] + res[k] : res[k];
  }
};

export const parse = (buf: ArrayBuffer): Record<string, string> => {
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
