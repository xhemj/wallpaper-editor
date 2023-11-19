import { ref } from "vue";
import { defineStore } from "pinia";

export const useDataStore = defineStore("data", () => {
  const isUploadFile = ref(false);

  const uploadFile = ref(null);
  const fileUrl = ref(null);

  const resetUploadFile = () => {
    uploadFile.value = null;
  };

  return {
    uploadFile,
    fileUrl,
    isUploadFile,
    resetUploadFile
  };
});
