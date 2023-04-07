import React, { useRef, useState } from 'react';
import './App.css';
const App = () => {
  const [logS, setLog] = useState("")
  let recordingTimeMS = 10000;
  const preview = useRef()
  const downloadButton = useRef()
  const recording = useRef()
  navigator.getUserMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
);
  function log(msg) {
    setLog(logS + msg + "\n");
  }
  function wait(delayInMS) {
    return new Promise(resolve => setTimeout(resolve, delayInMS));
  }
  function startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = event => data.push(event.data);
    recorder.start();
    log(recorder.state + " for " + (lengthInMS / 1000) + " seconds...");

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = event => reject(event.name);
    });

    let recorded = wait(lengthInMS).then( 
      () => recorder.state === "recording" && recorder.stop()
    );

    return Promise.all([
      stopped,
      recorded
    ])
      .then(() => data);
  }
  function stop(stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  const startButton = () => {
    console.log(navigator);
    navigator.mediaDevices?.getDisplayMedia({
      video: true,
      audio: true
    }).then(stream => {
      preview.current.srcObject = stream;  
      downloadButton.current.href = stream;
      preview.current.captureStream = preview.current.captureStream || preview.current.mozCaptureStream;
      return new Promise(resolve => preview.current.onplaying = resolve);
    }).then(() => startRecording(preview.current.captureStream(), recordingTimeMS))
      .then(recordedChunks => {
        let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        recording.current.src = URL.createObjectURL(recordedBlob);
        downloadButton.current.href = recording.current.src;
        downloadButton.current.download = "RecordedVideo.webm";

        log("Successfully recorded " + recordedBlob.size + " bytes of " +
          recordedBlob.type + " media.");
      })
      .catch(log);
  }
  const stopButton = () => {
    stop(preview.current.srcObject);
  }

return (
  <div>
    <div className="left">
      <div onClick={startButton} className="button">
        Start
      </div>
      <h2>Preview</h2>
      <video ref={preview} width="300" height="200" autoPlay muted></video>
    </div>
    <div className="right">
      <div onClick={stopButton} className="button">
        Stop
      </div>
      <h2>Recording</h2>
      <video ref={recording} width="300" height="200" controls></video>
      <button ref={downloadButton} className="button">
        Download
      </button>
    </div>
    <div className="bottom">
      <pre id="log">{logS}</pre>
    </div>
  </div>
);
};

export default App;