<template>
  <div id="upload-area" class="w-full h-screen bg-gray-100 flex justify-center items-center">
    <div class="flex flex-col">
      <div v-if="data.fileUrl" id="preview-area" class="w-96 h-48 border mb-4">
        <img :src="data.fileUrl" class="w-auto h-auto max-h-full" alt="" />
      </div>
      <div class="flex flex-col">
        <div id="upload-button">
          <n-upload
            ref="uploadRef"
            :default-upload="false"
            accept="image/*"
            :max="1"
            @change="handleUploadChange"
          >
            <n-button size="large" secondary>
              <template #icon>
                <Icon><ArrowUpload24Filled /></Icon>
              </template>
              选择图片
            </n-button>
          </n-upload>
        </div>
        <div v-show="data.fileUrl" id="upload-confirm">
          <n-button type="primary" size="large" @click="confirmUpload">确认</n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDataStore } from "@/stores/data";
import { ref } from "vue";
import { ArrowUpload24Filled } from "@vicons/fluent";
import { Icon } from "@vicons/utils";

const data = useDataStore();
const uploadRef = ref(null);

function handleUploadChange(file) {
  const uploadedFile = file.file;
  data.uploadFile = uploadedFile;
  // console.log("uploadedFile", uploadedFile);
  const url = createObjectURL(uploadedFile.file);
  // console.log("url", url);
  data.fileUrl = url;
}

function confirmUpload() {
  data.isUploadFile = true;
}

// 根据上传的文件生成url
function createObjectURL(object) {
  return (window.URL || window.webkitURL).createObjectURL(object);
}
</script>

<style scoped></style>
