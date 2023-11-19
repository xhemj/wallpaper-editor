import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useEditorStore = defineStore("editor", () => {
  const isSelectingText = ref(false);

  const isSelecting = computed(() => {
    return isSelectingText.value;
  });

  // fabric canvas 元素
  const canvas = ref(null);

  // 当前选择的元素
  const selectedElement = ref(null);

  return {
    isSelectingText,
    isSelecting,
    canvas,
    selectedElement
  };
});
