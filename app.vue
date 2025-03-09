<template lang="pug">
button.border(v-if="!loaded", @click="load") LOAD
.w-screen.h-actual-screen(v-show="loaded", ref="divRef")
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { run, stringify } from "./utils/runtime/runtime";
import { fromDirectoryHandle } from "./utils/runtime/file";
import { cmd } from "./utils/runtime/cmd";

const height = ref(0);
const onResize = () => {
  height.value = window.innerHeight;
};
window.addEventListener("resize", onResize);
onResize();
onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});
const heightPx = computed(() => height.value + "px");

const divRef = ref<HTMLDivElement>();
const encode = (data: {
  buf: { single: number; buf?: number[]; sizeOff?: number[] };
  tr: number[];
  tex: number[];
  vert: number;
  sh: number;
  c: number;
}) => {
  const ret = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  ret[0] = data.buf.single;
  if (data.buf.buf) {
    const buf = data.buf.buf;
    ret[1] |= buf[0] << 8;
    ret[1] |= buf[1] << -16;
    ret[2] |= buf[1] << 16;
    ret[2] |= buf[2] << -8;
    ret[3] |= buf[2] << 24;
    ret[3] |= buf[3];
  } else {
    const buf = data.buf.sizeOff!;
    ret[1] |= buf[0] << 20;
    ret[1] |= buf[1] << 8;
    ret[1] |= buf[2] << -4;
    ret[2] |= buf[2] << 28;
    ret[2] |= buf[3] << 16;
    ret[2] |= buf[4] << 4;
    ret[2] |= buf[5] << -8;
    ret[3] |= buf[5] << 24;
    ret[3] |= buf[6] << 12;
    ret[3] |= buf[7];
  }
  ret[4] = data.tr[0];
  ret[5] = data.tr[1];
  ret[6] = data.tr[2];
  ret[7] = data.tr[3];
  const tex = data.tex;
  ret[8] |= tex[0] << 18;
  ret[8] |= tex[1] << 4;
  ret[8] |= tex[2] << -10;
  ret[9] |= tex[2] << 22;
  ret[9] |= tex[3] << 8;
  ret[9] |= tex[4] << -6;
  ret[10] |= tex[4] << 26;
  ret[10] |= tex[5] << 12;
  ret[10] |= tex[6] << -2;
  ret[11] |= tex[6] << 30;
  ret[11] |= tex[7] << 16;
  ret[11] |= tex[8] << 2;
  ret[11] |= tex[9] << -12;
  ret[12] |= tex[9] << 20;
  ret[12] |= tex[10] << 6;
  ret[12] |= tex[11] << -8;
  ret[13] |= tex[11] << 24;
  ret[13] |= tex[12] << 10;
  ret[13] |= tex[13] << -4;
  ret[14] |= tex[13] << 28;
  ret[14] |= tex[14] << 14;
  ret[14] |= tex[15];

  ret[15] |= data.vert << 16;
  ret[15] |= data.sh << 3;
  ret[15] |= data.c;

  return ret;
};
console.log(
  encode({
    buf: { single: 2, buf: [0, 0, 0, 0] },
    c: 2,
    sh: 0,
    tex: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    tr: [1, 0, 0, 0],
    vert: 1,
  }),
);
const loaded = ref(false);
const load = async () => {
  loaded.value = true;
  const picker = await showDirectoryPicker();
  const file = await fromDirectoryHandle(picker);
  await file.write(
    "entry",
    stringify({
      program: "main,",
      load: "test:main=main,",
      main: "mainv,mainf,,p0,p1,p2,p3",
      mainv: `#version 300 es
flat out ivec4 p0;
flat out ivec4 p1;
flat out ivec4 p2;
flat out ivec4 p3;
const int a[16] = int[](
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
);
void main(){
  int o = gl_VertexID*16;
  p0=ivec4(a[o+0],a[o+1],a[o+2],a[o+3]);
  p1=ivec4(a[o+4],a[o+5],a[o+6],a[o+7]);
  p2=ivec4(a[o+8],a[o+9],a[o+10],a[o+11]);
  p3=ivec4(a[o+12],a[o+13],a[o+14],a[o+15]);
  gl_Position=vec4(0.,0.,0.,1.);
}`,
      mainf: `#version 300 es
precision highp float;
out vec4 color;
void main(){
  color=vec4(1.,0.,0.,1.);
}`,
    }),
  );
  const buf = new ArrayBuffer(4 * 16 * 5);
  const ar = new Int32Array(buf);
  ar.set([1, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4], 0);
  ar.set([2, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4], 16);
  ar.set([1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6], 32);
  ar.set([2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 65538], 48);
  ar.set([1, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7], 64);
  await file.write("main", buf);
  const runtime = await run(divRef.value!, [file], cmd);
  console.log(runtime);
};
</script>

<style>
.h-actual-screen {
  height: v-bind(heightPx);
}
</style>
