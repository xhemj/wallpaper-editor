<template>
  <div id="editor-area">
    <div
      ref="canvasContainer"
      id="editor-container"
      class="w-full h-screen flex justify-center items-center"
    >
      <canvas ref="canvasDom" id="editor-canvas" width="0" height="0">
        您的浏览器不支持canvas，请更换浏览器后再试。
      </canvas>
    </div>
  </div>
  <DraggableCard :initialValue="{ top: 10, left: 15 }" class="z-100" v-slot="{ onRef }">
    <EditBar
      :_ref="onRef"
      @addText="addText"
      @deleteSelecting="deleteSelecting"
      @undo="undo"
      @redo="redo"
    />
  </DraggableCard>
  <DraggableCard :initialValue="{ bottom: 10, right: 15 }" class="z-100" v-slot="{ onRef }">
    <span :ref="onRef">
      <n-button round block type="primary" @click="previewImage">
        <template #icon>
          <Icon><ArrowRight24Filled /></Icon>
        </template>
        生成图片
      </n-button>
    </span>
  </DraggableCard>
  <n-modal v-model:show="isShowImagePreview" :mask-closable="false" preset="card">
    <template #header>
      <h3 class="font-bold text-xl">图片预览</h3>
    </template>
    <div class="p-6">
      <img :src="imageDataUrl" class="mx-auto shadow-md hover:shadow-xl" alt="" />
      <p class="text-gray-400 text-sm mt-2">
        图片尺寸：{{ imageWidth }} x {{ imageHeight }}，文件大小：{{
          getReadableFileSizeString(imageFileSize)
        }}
      </p>
      <div class="mt-8">
        <n-button type="primary" block @click="downloadImage"> 下载图片 </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { nextTick, onMounted, ref } from "vue";
import { useDataStore } from "@/stores/data";
import { useEditorStore } from "@/stores/editor";
import { fabric } from "fabric";
import DraggableCard from "../components/DraggableCard.vue";
import EditBar from "../components/EditBar.vue";
import { ArrowRight24Filled } from "@vicons/fluent";
import { Icon } from "@vicons/utils";
import { getReadableFileSizeString, dataURLtoBlob } from "../utils";

let canvas;
const data = useDataStore();
const editor = useEditorStore();

const imageUrl = data.fileUrl;

const canvasDom = ref(null);
const canvasContainer = ref(null);
const canvasWidth = ref(0);
const canvasHeight = ref(0);
const imageWidth = ref(0);
const imageHeight = ref(0);
const aspectRatio = ref("16 / 9");

const imageDataUrl = ref("");
const imageFileSize = ref(0);
const isShowImagePreview = ref(false);

function initCanvas() {
  if (!canvasDom.value || !canvasContainer.value) return;
  // console.log("initCanvas");
  const image = new Image();
  image.src = imageUrl;
  image.onload = () => {
    imageWidth.value = image.width;
    imageHeight.value = image.height;
    aspectRatio.value = `${(image.height / image.width) * 100}%`;
    nextTick(() => {
      const { width, height } = canvasContainer.value.getBoundingClientRect();
      canvasDom.value.width = width;
      canvasDom.value.height = height;
      canvasWidth.value = width;
      canvasHeight.value = height;

      initFabricCanvas();
    });
  };
}

function initFabricCanvas() {
  canvas = new fabric.Canvas(canvasDom.value);
  // canvas.setWidth(canvasWidth.value);
  // canvas.setHeight(canvasHeight.value);

  // 背景图片
  const img = new Image();
  img.setAttribute("crossOrigin", "anonymous");
  img.src = imageUrl;
  img.onload = () => {
    const fabricImage = new fabric.Image(img, {
      crossOrigin: "anonymous"
    });

    const scaleX = canvasWidth.value / img.width;
    const scaleY = canvasHeight.value / img.height;
    const scale = Math.min(scaleX, scaleY);

    // 设置canvas大小匹配图片大小
    if (imageWidth.value / imageHeight.value > canvasWidth.value / canvasHeight.value) {
      // 如果图片宽高比大于canvas宽高比
      canvas.setWidth(canvasWidth.value);
      canvas.setHeight(canvasWidth.value * (imageHeight.value / imageWidth.value));
    } else {
      canvas.setWidth(canvasHeight.value * (imageWidth.value / imageHeight.value));
      canvas.setHeight(canvasHeight.value);
    }

    canvas.setBackgroundImage(fabricImage, canvas.renderAll.bind(canvas), {
      scaleX: scale,
      scaleY: scale
    });
  };

  // 当在canvas上选择元素时
  canvas.on("selection:created", () => {
    editor.isSelectingText = true;
    window.selectingElement = canvas.getActiveObject();
  });
  // 当取消选择时
  canvas.on("selection:cleared", () => {
    editor.isSelectingText = false;
  });

  editor.canvas = canvas;

  initCanvasHistory();
}

const allTexts = ref([]);

function addText() {
  const instance = {
    fabricText: null,
    get value() {
      return this.fabricText?.text;
    },
    set value(val) {
      if (this.fabricText) {
        this.fabricText.text = val;
        this.fabricText.set("text", val);
        canvas.renderAll();
      }
    },
    get textColor() {
      return this.fabricText?.fill;
    },
    set textColor(val) {
      if (this.fabricText) {
        this.fabricText.set("fill", val);
        canvas.renderAll();
      }
    },
    init() {
      this.fabricText =
        this.fabricText ||
        new fabric.IText("双击编辑文字", {
          left: 20,
          top: 20,
          fontSize: 20,
          fill: "#000000",
          fontFamily: "Microsoft YaHei"
        });
      // 当选择时
      this.fabricText.on("selected", () => {
        editor.selectedElement = this;
        editor.isSelectingText = true;
      });
      // 当取消选择时
      this.fabricText.on("deselected", () => {
        editor.selectedElement = null;
        editor.isSelectingText = false;
      });
      allTexts.value.push(this);
      if (canvas) {
        canvas.add(this.fabricText);
      }
    }
  };
  instance.init();
  recordCanvasHistory();
}

function deleteSelecting() {
  if (editor.isSelectingText) {
    canvas.remove(canvas.getActiveObject());
    allTexts.value = allTexts.value.filter((item) => item !== editor.selectedElement);
    recordCanvasHistory();
  }
}

const canvasHistory = ref([]);
const canvasHistoryIndex = ref(0);

function initCanvasHistory() {
  canvas.on("object:modified", () => {
    recordCanvasHistory();
  });
}

function recordCanvasHistory() {
  canvasHistory.value = canvasHistory.value.slice(0, canvasHistoryIndex.value + 1);
  canvasHistory.value.push(canvas.toJSON());
  canvasHistoryIndex.value = canvasHistory.value.length - 1;
  // console.log("canvasHistory", canvasHistory.value);
}

function undo() {
  if (canvasHistoryIndex.value > 0) {
    canvasHistoryIndex.value--;
    canvas.loadFromJSON(canvasHistory.value[canvasHistoryIndex.value]);
  }
}

function redo() {
  if (canvasHistoryIndex.value < canvasHistory.value.length - 1) {
    canvasHistoryIndex.value++;
    canvas.loadFromJSON(canvasHistory.value[canvasHistoryIndex.value]);
  }
}

function previewImage() {
  const originDataURL = canvas.toDataURL({
    format: "png",
    quality: 1
  });
  // 压缩/拉伸图片的宽高变成图片原本的宽高
  const img = new Image();
  img.src = originDataURL;
  img.onload = () => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    c.width = imageWidth.value;
    c.height = imageHeight.value;
    ctx.drawImage(img, 0, 0, imageWidth.value, imageHeight.value);
    const dataURL = c.toDataURL({
      format: "png",
      quality: 1
    });
    const blob = dataURLtoBlob(dataURL);
    const previewUrl = URL.createObjectURL(blob);
    imageDataUrl.value = previewUrl;
    imageFileSize.value = (dataURL.length * 3) / 4;
    isShowImagePreview.value = true;
  };
}

function downloadImage() {
  const link = document.createElement("a");
  link.download = `壁纸编辑器_${new Date().getTime()}.png`;
  link.href = imageDataUrl.value;
  link.click();
}

onMounted(() => {
  initCanvas();
});
</script>

<style scoped>
:global(body) {
  overflow: hidden !important;
}

:global(.n-modal-body-wrapper) {
  max-width: 75% !important;
  margin: 0 auto !important;
}
</style>
