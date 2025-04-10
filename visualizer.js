const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const playBtn = document.getElementById("play");
const pauseBtn = document.getElementById("pause");
const fileInput = document.getElementById("file");

let audioCtx, analyser, sourceNode;
let freqData;
let audioBuffer, audioElement;
let animationId;

const width = window.innerWidth;
const height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let yOffset = 0;

fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const arrayBuffer = await file.arrayBuffer();
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  if (audioElement) audioElement.remove();
  audioElement = new Audio(URL.createObjectURL(file));
  audioElement.crossOrigin = "anonymous";

  sourceNode = audioCtx.createMediaElementSource(audioElement);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  freqData = new Uint8Array(analyser.frequencyBinCount);

  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  yOffset = 0;
  ctx.clearRect(0, 0, width, height);
};

function draw() {
  analyser.getByteFrequencyData(freqData);

  const row = ctx.createImageData(width, 1);
  const binsPerPixel = freqData.length / width;

  for (let x = 0; x < width; x++) {
    const i = Math.floor(x * binsPerPixel);
    const val = freqData[i]; // 0-255
    const idx = x * 4;
    row.data[idx + 0] = val;
    row.data[idx + 1] = val;
    row.data[idx + 2] = val;
    row.data[idx + 3] = 255;
  }

  if (yOffset >= canvas.height) {
    // Scroll up when full
    const image = ctx.getImageData(0, 1, width, canvas.height - 1);
    ctx.putImageData(image, 0, 0);
    yOffset = canvas.height - 1;
  }

  ctx.putImageData(row, 0, yOffset);
  yOffset++;

  animationId = requestAnimationFrame(draw);
}

playBtn.onclick = () => {
  if (!audioElement) return;
  audioCtx.resume();
  audioElement.play();
  draw();
};

pauseBtn.onclick = () => {
  if (!audioElement) return;
  audioElement.pause();
  cancelAnimationFrame(animationId);
};
