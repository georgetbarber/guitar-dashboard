export interface MicrophoneSession {
  stream: MediaStream;
  audioContext: AudioContext;
  analyser: AnalyserNode;
  samples: Float32Array<ArrayBuffer>;
  close: () => void;
}

export async function openMicrophone(): Promise<MicrophoneSession> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not expose microphone input.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    }
  });
  let audioContext: AudioContext | null = null;
  try {
    audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.15;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    return {
      stream,
      audioContext,
      analyser,
      samples,
      close: () => {
        stream.getTracks().forEach((track) => track.stop());
        void audioContext?.close();
      }
    };
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    if (audioContext) void audioContext.close();
    throw error;
  }
}

export interface TakeRecorder {
  stop: () => Promise<Blob>;
}

export function startTakeRecording(stream: MediaStream): TakeRecorder {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Audio recording is not supported by this browser.");
  }
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream);
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  recorder.start();
  return {
    stop: () => new Promise((resolve) => {
      recorder.addEventListener("stop", () => {
        resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      }, { once: true });
      recorder.stop();
    })
  };
}
