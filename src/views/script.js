const { desktopCapturer, remote } = require("electron");
const { dialog } = remote;
const fs = require("fs");

let sources;
let sourceIsSet = false;
let mediaRecorder;
let recordedChunks = [];

const recordButtonEl = document.querySelector("#record-button");
const stopButtonEl = document.querySelector("#stop-button");
const videoEl = document.querySelector("video");
const sourceOptionsEl = document.querySelector("#source-options");

const createStream = async (source) => {
  sourceIsSet = true;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
        minWidth: 1280,
        maxWidth: 1280,
        minHeight: 720,
        maxHeight: 720,
      },
    },
  });

  videoEl.srcObject = stream;
  videoEl.onloadedmetadata = (e) => videoEl.play();
  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);
  mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
  mediaRecorder.onstop = handleStop;
};

const handleDataAvailable = (e) => {
  recordedChunks.push(e.data);
};

const handleStop = async (e) => {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });
  const buffer = Buffer.from(await blob.arrayBuffer());
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath: `vid-${Date.now()}.webm`,
  });
  if (!filePath) {
    return;
  }
  fs.writeFile(filePath, buffer, () => alert(`Video Saved to ${filePath}.`));
};

sourceOptionsEl.addEventListener("change", (e) => {
  const sourceId = e.target.value;
  const source = sources.filter((s) => s.id == sourceId)[0];
  createStream(source);
});

recordButtonEl.addEventListener("click", (e) => {
  if (!sourceIsSet) {
    return alert("Please select video source before recording");
  }
  recordButtonEl.classList.add("hide");
  stopButtonEl.classList.remove("hide");
  mediaRecorder.start();
  sourceOptionsEl.setAttribute("disabled", true);
  console.log("Recording...");
});

stopButtonEl.addEventListener("click", (e) => {
  recordButtonEl.classList.remove("hide");
  stopButtonEl.classList.add("hide");
  mediaRecorder.stop();
  sourceOptionsEl.removeAttribute("disabled");
  console.log("Stopping Recording...");
});

desktopCapturer
  .getSources({ types: ["window", "screen"] })
  .then(async (s) => {
    sources = s;
    const sourceList = document.querySelector("#source-options");
    for (let i = 0; i < sources.length; i++) {
      var el = document.createElement("option");
      el.setAttribute("value", sources[i].id);
      el.innerText = sources[i].name;
      sourceList.appendChild(el);
    }
  })
  .catch((e) => {
    console.log(e);
  });
