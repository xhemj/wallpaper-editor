<template>
  <UploadFile v-if="!data.isUploadFile" />
  <Editor v-else />
</template>

<script setup>
import { defineAsyncComponent } from "vue";
import { useDataStore } from "@/stores/data";
const data = useDataStore();

const UploadFile = defineAsyncComponent(() => import("./views/UploadFile.vue"));
const Editor = defineAsyncComponent(() => import("./views/Editor.vue"));
</script>

<style scoped></style>
