import type { CMD, Runtime } from "./runtime";

const bindF = (rt: Runtime, decoded: ReturnType<typeof decode>) => {
  const gl = rt.gl;
  const rb = rt.rb[decoded.tex[15] - 1] || null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, rt.fb);
  gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    rt.rb,
  );
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  const tex0 = rt.tex[decoded.tex[11] - 1] || null;
  gl.bindTexture(gl.TEXTURE_2D, tex0);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0 + 0,
    gl.TEXTURE_2D,
    tex0,
    0,
  );
  const tex1 = rt.tex[decoded.tex[12] - 1] || null;
  gl.bindTexture(gl.TEXTURE_2D, tex1);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0 + 1,
    gl.TEXTURE_2D,
    tex1,
    0,
  );
  const tex2 = rt.tex[decoded.tex[13] - 1] || null;
  gl.bindTexture(gl.TEXTURE_2D, tex2);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0 + 2,
    gl.TEXTURE_2D,
    tex2,
    0,
  );
  const tex3 = rt.tex[decoded.tex[14] - 1] || null;
  gl.bindTexture(gl.TEXTURE_2D, tex3);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0 + 3,
    gl.TEXTURE_2D,
    tex3,
    0,
  );
  gl.drawBuffers([
    gl.COLOR_ATTACHMENT0 + 0,
    gl.COLOR_ATTACHMENT0 + 1,
    gl.COLOR_ATTACHMENT0 + 2,
    gl.COLOR_ATTACHMENT0 + 3,
  ]);
};

const draw = (
  rt: Runtime,
  cmd: Int32Array,
  method:
    | typeof WebGL2RenderingContext.TRIANGLES
    | typeof WebGL2RenderingContext.POINTS,
) => {
  const decoded = decode(cmd);

  const prog = rt.prog[rt.key[decoded.sh]];
  if (!prog) {
    return;
  }
  bindF(rt, decoded);
  const gl = rt.gl;
  gl.useProgram(prog[0]);
  let i = 0;
  for (const ti of decoded.tex.slice(0, 11)) {
    gl.bindTexture(gl.TEXTURE_2D, rt.tex[ti - 1] || null);
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.uniform1i(prog[i + 1], i);
    i++;
  }
  if (decoded.buf.sep) {
    let i = 0;
    for (const b of decoded.buf.buf) {
      gl.bindBuffer(gl.ARRAY_BUFFER, rt.buf[b - 1] || null);
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 0, 0);
      i++;
    }
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, rt.buf[decoded.buf.single] || null);
    const size = decoded.buf.buf.reduce((p, c) => Math.max(p, c), -4) + 4;
    for (let i = 0; i < 4; i++) {
      if (!decoded.buf.buf[i]) {
        continue;
      }
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(
        i,
        4,
        gl.FLOAT,
        false,
        size,
        decoded.buf.buf[i] - 1,
      );
    }
  }
  gl.drawArrays(method, 0, decoded.vert);
};

const ops: CMD[] = [
  async (rt, cmd) => {
    await utils[cmd[0]]?.(rt, cmd);
  },
  async (rt, cmd) => {
    const decoded = decode(cmd);
    const gl = rt.gl;
    bindF(rt, decoded);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  },
  async (rt, cmd) => {
    draw(rt, cmd, rt.gl.POINTS);
  },
  async (rt, cmd) => {
    draw(rt, cmd, rt.gl.TRIANGLES);
  },
  async (rt, cmd) => {},
  async (rt, cmd) => {},
  async (rt, cmd) => {},
  async (rt, cmd) => {},
];

const utils: CMD[] = [
  // NOP
  () => {},
];

export const cmd: CMD = async (rt, cmd) => {
  const l = cmd.length / 16;
  for (let i = 0; i < l; i++) {
    const op = cmd[l * 16 + 15] & 0x7;
    await ops[op](rt, cmd.slice(l * 16, l * 16 + 16));
  }
};

const decode = (cmd: Int32Array) => {
  const buf = {
    sep: cmd[0] === 0,
    single: cmd[0],
    buf: [
      (cmd[1] & 0xffffff00) >> 8,
      ((cmd[1] & 0x000000ff) >> -16) | ((cmd[2] & 0xffff0000) >> 8),
      ((cmd[2] & 0x0000ffff) >> -8) | ((cmd[3] & 0xff000000) >> 24),
      cmd[3] & 0x00ffffff,
    ],
  };
  const tr = cmd.slice(4, 8);
  const tex = [
    (cmd[8] & 0b11111111111111000000000000000000) >> 18,
    (cmd[8] & 0b00000000000000111111111111110000) >> 4,
    ((cmd[8] & 0b00000000000000000000000000001111) >> -10) |
      ((cmd[9] & 0b11111111110000000000000000000000) >> 22),
    (cmd[9] & 0b00000000001111111111111100000000) >> 8,
    ((cmd[9] & 0b00000000000000000000000011111111) >> -6) |
      ((cmd[10] & 0b11111100000000000000000000000000) >> 26),
    (cmd[10] & 0b00000011111111111111000000000000) >> 12,
    ((cmd[10] & 0b00000000000000000000111111111111) >> -2) |
      ((cmd[11] & 0b11000000000000000000000000000000) >> 30),
    (cmd[11] & 0b00111111111111110000000000000000) >> 16,
    (cmd[11] & 0b00000000000000001111111111111100) >> 2,
    ((cmd[11] & 0b00000000000000000000000000000011) >> -12) |
      ((cmd[12] & 0b11111111111100000000000000000000) >> 20),
    (cmd[12] & 0b00000000000011111111111111000000) >> 6,
    ((cmd[12] & 0b00000000000000000000000000111111) >> -8) |
      ((cmd[13] & 0b11111111000000000000000000000000) >> 24),
    (cmd[13] & 0b00000000111111111111110000000000) >> 10,
    ((cmd[13] & 0b00000000000000000000001111111111) >> -4) |
      ((cmd[14] & 0b11110000000000000000000000000000) >> 28),
    (cmd[14] & 0b00001111111111111100000000000000) >> 14,
    (cmd[14] & 0b00000000000000000011111111111111) >> 0,
  ];
  const vert = (cmd[15] & 0xffff0000) >> 16;
  const sh = (cmd[15] & 0b00000000000000001111111111111000) >> 3;
  const c = cmd[15] & 7;
  return { buf, tr, tex, vert, sh, c };
};
