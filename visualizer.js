const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const audio = document.getElementById("audio");
const fileInput = document.getElementById("file");
const playPauseBtn = document.getElementById("playPause");
const seekSlider = document.getElementById("seek");

let audioBuffer;
let animationId;
let audioCtx, sourceNode, analyser;
let freqData;

fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const url = URL.createObjectURL(file);
  audio.src = url;
  audio.load();

  // Decode buffer
  const arrayBuffer = await file.arrayBuffer();
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  setupAnalyzer();
};

function setupAnalyzer() {
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 32768; // Higher = better frequency resolution (~1Hz)
  freqData = new Uint8Array(analyser.frequencyBinCount);

  sourceNode = audioCtx.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function draw() {
  analyser.getByteFrequencyData(freqData);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let x = 1; x < 20000 && x < freqData.length; x++) {
    const value = freqData[x];
    const height = value;
    ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
    ctx.fillRect(x, canvas.height - height, 1, height);
  }

  seekSlider.value = (audio.currentTime / audio.duration) * 1000 || 0;
  animationId = requestAnimationFrame(draw);
}

// Controls
playPauseBtn.onclick = () => {
  if (!audioCtx) return;
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = "⏸ Pause";
    draw();
  } else {
    audio.pause();
    playPauseBtn.textContent = "▶️ Play";
    cancelAnimationFrame(animationId);
  }
};

seekSlider.oninput = () => {
  if (!audio.duration) return;
  const time = (seekSlider.value / 1000) * audio.duration;
  audio.currentTime = time;
};
