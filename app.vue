<template lang="pug">
button.border(v-if="!loaded", @click="load") LOAD
.w-screen.h-actual-screen(v-show="loaded", ref="divRef")
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { run, stringify } from "./utils/runtime/runtime";
import { fromDirectoryHandle } from "./utils/runtime/file";

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

const loaded = ref(false);
const load = async () => {
  loaded.value = true;
  const picker = await showDirectoryPicker();
  const file = await fromDirectoryHandle(picker);
  await file.write(
    "entry",
    stringify({
      program: "",
      load: "",
    }),
  );
  const runtime = await run(divRef.value!, [file]);
  console.log(runtime);
};
</script>

<style>
.h-actual-screen {
  height: v-bind(heightPx);
}
</style>
