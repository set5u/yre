import type { Handle } from "./file";

export type Runtime = {
  res: Record<string, string>;
  file: Record<string, Handle>;
  buf: WebGLBuffer[];
  str: string[];
  tex: WebGLTexture[];
  gl: WebGL2RenderingContext;
  prog: Record<string, [WebGLProgram, ...WebGLUniformLocation[]]>;
  sh: WebGLShader[];
  fb: WebGLFramebuffer;
  rb: WebGLRenderbuffer[];
  key: string[];
  stop: () => void;
  cpu: Uint8Array;
  num: Record<string, number>;
};

export type CMD = (rt: Runtime, cmd: Int32Array) => void | Promise<void>;

export const run = async (
  el: HTMLDivElement,
  file: Handle[],
  cmd: CMD,
  cb?: (fase: number, step: number, stepMax: number) => Promise<void>,
) => {
  const canvas = document.createElement("canvas");
  canvas.style = "position:absolute;width:100%;height:100%;";
  const onResize = () => {
    canvas.width = el.clientWidth;
    canvas.height = el.clientHeight;
  };
  const observer = new ResizeObserver(onResize);
  observer.observe(el);
  onResize();
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
    prog: {},
    sh: [],
    fb: gl.createFramebuffer(),
    rb: [],
    key: [],
    stop() {
      Object.values(this.prog).forEach((v) => gl.deleteProgram(v[0]));
      this.sh.forEach((v) => gl.deleteShader(v));
      this.buf.forEach((v) => gl.deleteBuffer(v));
      this.tex.forEach((v) => gl.deleteTexture(v));
      this.rb.forEach((v) => gl.deleteRenderbuffer(v));
      gl.deleteFramebuffer(this.fb);
      observer.disconnect();
    },
    cpu: new Uint8Array(2048 * 2048 * 4),
    num: {},
  };
  for (const f of file) {
    runtime.file[f.name] = f;
  }
  let step = 0;
  let stepMax = file.length;
  for (const f of file) {
    await init(runtime, f);
    await cb?.(0, step++, stepMax);
  }
  const res = runtime.res;

  res["space"] = file.map((v) => v.name).reduce((p, c) => `${p}${c},`, "");
  res["define"] = "";
  res["define"] = (runtime.key = Object.keys(res).concat(
    "program" in res
      ? res["program"]
          .replaceAll("\n", "")
          .split(",")
          .filter((v) => v)
      : [],
  )).reduce((p, c, i) => `${p}const int ${c} = ${~i};\n`, "");
  runtime.key.forEach((v, i) => (runtime.num[v] = i));
  await cb?.(1, 0, 1);

  if ("font" in res) {
    const font = res["font"]
      .replaceAll("\n", "")
      .split(",")
      .filter((v) => v);
    step = 0;
    stepMax = font.length;
    for (const f of font) {
      await cb?.(2, step++, stepMax);
      const fo = res[f]
        .replaceAll("\n", "")
        .split(",")
        .filter((v) => v);
      for (const foi of fo) {
        await new FontFace(f, `url(${foi})`).load();
      }
    }
  }
  if ("program" in res) {
    const program = res["program"]
      .replaceAll("\n", "")
      .split(",")
      .filter((v) => v);
    step = 0;
    stepMax = program.length;
    for (const p of program) {
      await cb?.(3, step++, stepMax);
      const base = res[p];
      if (!base) {
        continue;
      }
      const sep = base.replaceAll("\n", "").split(",");
      const vsh = replaceSh(res[sep[0]], res);
      const fsh = replaceSh(res[sep[1]], res);
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
      const vshI = gl.getShaderInfoLog(vshH);
      if (vshI) {
        console.log(vshI);
      }
      const fshH = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fshH) {
        return;
      }
      gl.shaderSource(fshH, fsh);
      gl.compileShader(fshH);
      const fshI = gl.getShaderInfoLog(fshH);
      if (fshI) {
        console.log(fshI);
      }
      runtime.sh.push(vshH, fshH);
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
      const progI = gl.getProgramInfoLog(prog);
      if (progI) {
        console.log(progI);
      }
      const r = (runtime.prog[p] = [prog]);
      let u: WebGLUniformLocation | null;
      let i = 0;
      while ((u = gl.getUniformLocation(prog, "tex" + i++))) {
        r.push(u);
      }
    }
  }
  const cpuTex = gl.createTexture();
  runtime.tex.push(cpuTex);
  gl.bindTexture(gl.TEXTURE_2D, cpuTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    2048,
    2048,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    runtime.cpu,
  );
  await cb?.(4, 0, 1);
  if ("load" in res) {
    const main = res["load"]
      .replace("\n", "")
      .split(",")
      .filter((v) => v);
    step = 0;
    stepMax = main.length;
    for (const m of main) {
      await cb?.(5, step++, stepMax);
      const ci = m.indexOf(":");
      const space = m.substring(0, ci);
      const path = m.substring(ci + 1);
      const buf = await runtime.file[space]?.read(path);
      if (!buf) {
        continue;
      }
      const cmdd = new Int32Array(buf);
      await cmd(runtime, cmdd);
    }
  }
  return runtime;
};

const replaceSh = (sh: string, res: Record<string, string>) => {
  while (sh.match(/%%(.*?)%%/g)) {
    sh = sh.replaceAll(/%%(.*?)%%/g, (_, a) => res[a]);
  }
  return sh;
};
const init = async (runtime: Runtime, file: Handle) => {
  const entry = await file.read("entry");
  if (!entry) {
    return;
  }
  const res = parse(entry);
  const extend = (
    "extend" in res ? res["extend"].replaceAll("\n", "").split(",") : []
  ).reduce((p, c) => (c && (p[c] = true), p), {} as Record<string, boolean>);
  for (const k in res) {
    runtime.res[k] = extend[k] ? runtime.res[k] + res[k] : res[k];
  }
};

export const parse = (buf: ArrayBuffer): Record<string, string> => {
  const dataView = new DataView(buf);
  const decoder = new TextDecoder();
  const result: Record<string, string> = {};
  let offset = 0;
  while (offset < buf.byteLength) {
    const keyLength = dataView.getUint32(offset, true);
    offset += 4;
    const key = decoder.decode(new DataView(buf, offset, keyLength));
    offset += keyLength;
    const valueLength = dataView.getUint32(offset, true);
    offset += 4;
    const value = decoder.decode(new DataView(buf, offset, valueLength));
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
  const encoder = new TextEncoder();
  let offset = 0;
  for (const key in record) {
    const value = record[key];
    const keyLength = key.length;
    const valueLength = value.length;
    dataView.setUint32(offset, keyLength, true);
    offset += 4;
    encoder.encodeInto(key, new Uint8Array(buffer, offset));
    offset += keyLength;
    dataView.setUint32(offset, valueLength, true);
    offset += 4;
    encoder.encodeInto(value, new Uint8Array(buffer, offset));
    offset += valueLength;
  }
  return buffer;
};
