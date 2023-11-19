<template>
  <div
    :ref="props._ref"
    class="min-w-20 w-auto bg-white border-solid border-1 border-gray-200 rounded-lg px-4 py-1 cursor-move"
  >
    <div class="flex flex-row space-x-2">
      <!-- 撤回 -->
      <n-button @click="$emit('undo')">
        <Icon><ArrowUndo24Filled /></Icon>
      </n-button>
      <!-- 恢复 -->
      <n-button @click="$emit('redo')">
        <Icon><ArrowRedo24Filled /></Icon>
      </n-button>
      <!-- 添加文字 -->
      <n-button @click="$emit('addText')">
        <Icon><TextT24Filled /></Icon>
      </n-button>
      <div v-if="editor.isSelectingText" class="w-[42px] h-[34px]">
        <n-color-picker v-model:value="colorInstance.value" :show-preview="true" :modes="['rgb']" />
      </div>
      <!-- 删除选中 -->
      <n-button v-if="editor.isSelecting" type="error" @click="$emit('deleteSelecting')">
        <Icon><Delete24Filled /></Icon>
      </n-button>
    </div>
  </div>
</template>

<script setup>
// import { useDataStore } from "@/stores/data";
import { useEditorStore } from "@/stores/editor";
import {
  TextT24Filled,
  Delete24Filled,
  ArrowUndo24Filled,
  ArrowRedo24Filled
} from "@vicons/fluent";
import { Icon } from "@vicons/utils";

// const data = useDataStore();
const editor = useEditorStore();

const $emit = defineEmits(["addText", "deleteSelecting", "undo", "redo"]);
const props = defineProps({
  _ref: {
    type: Object,
    required: true
  }
});

const colorInstance = {
  get value() {
    return editor.selectedElement.fabricText.fill;
  },
  set value(val) {
    if (editor.selectedElement.fabricText) {
      // editor.selectedElement.fabricText.text = val;
      editor.selectedElement.fabricText.set("fill", val);
      editor.canvas.renderAll();
    }
  }
};
</script>

<style scoped>
:deep(.n-color-picker-trigger__value) {
  display: none;
}

:deep(.n-color-picker-trigger__fill) {
  @apply border-solid border border-gray-200;
}
</style>
