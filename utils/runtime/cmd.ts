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
  bindF(rt, decoded);
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
    locOff: [
      (cmd[1] & 0b11000000000000000000000000000000) >> 30,
      (cmd[1] & 0b00111100000000000000000000000000) >> 26,
      (cmd[1] & 0b00000011000000000000000000000000) >> 24,
      (cmd[1] & 0b00000000111100000000000000000000) >> 20,
      (cmd[1] & 0b00000000000011000000000000000000) >> 18,
      (cmd[1] & 0b00000000000000111100000000000000) >> 14,
      (cmd[1] & 0b00000000000000000011000000000000) >> 12,
      (cmd[1] & 0b00000000000000000000111100000000) >> 8,
      (cmd[1] & 0b00000000000000000000000011000000) >> 6,
      (cmd[1] & 0b00000000000000000000000000111100) >> 2,
      (cmd[1] & 0b00000000000000000000000000000011) >> 0,
      (cmd[2] & 0b11110000000000000000000000000000) >> 28,
      (cmd[2] & 0b00001100000000000000000000000000) >> 26,
      (cmd[2] & 0b00000011110000000000000000000000) >> 22,
      (cmd[2] & 0b00000000001100000000000000000000) >> 20,
      (cmd[2] & 0b00000000000011110000000000000000) >> 16,
      (cmd[2] & 0b00000000000000001100000000000000) >> 14,
      (cmd[2] & 0b00000000000000000011110000000000) >> 10,
      (cmd[2] & 0b00000000000000000000001100000000) >> 8,
      (cmd[2] & 0b00000000000000000000000011110000) >> 4,
      (cmd[2] & 0b00000000000000000000000000001100) >> 2,
      ((cmd[2] & 0b00000000000000000000000000000011) >> -2) |
        ((cmd[3] & 0b11000000000000000000000000000000) >> 30),
      (cmd[3] & 0b00110000000000000000000000000000) >> 28,
      (cmd[3] & 0b00001111000000000000000000000000) >> 24,
      (cmd[3] & 0b00000000110000000000000000000000) >> 22,
      (cmd[3] & 0b00000000001111000000000000000000) >> 18,
      (cmd[3] & 0b00000000000000110000000000000000) >> 16,
      (cmd[3] & 0b00000000000000001111000000000000) >> 12,
      (cmd[3] & 0b00000000000000000000110000000000) >> 10,
      (cmd[3] & 0b00000000000000000000001111000000) >> 6,
      (cmd[3] & 0b00000000000000000000000000110000) >> 4,
      (cmd[3] & 0b00000000000000000000000000001111) >> 0,
    ],
    bufs: [
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
