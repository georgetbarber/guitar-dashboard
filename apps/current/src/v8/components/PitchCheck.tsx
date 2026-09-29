import { useEffect, useRef, useState } from "react";
import { openMicrophone } from "../../audio/microphone";
import type { MicrophoneSession } from "../../audio/microphone";
import { assessSustainedPitch } from "../../audio/pitchAssessment";
import type { PitchEstimate, TimedAudioFrame } from "../../audio/pitchAssessment";
import { noteName } from "../../core/music/theory";
import { STANDARD_TUNING_MIDI } from "../structuredMusic";
import { useUpdateHold } from "./UpdateNotice";

const TARGET_MIDI = STANDARD_TUNING_MIDI[5]; // first, high-E string in standard tuning
const REASONS: Record<Extract<PitchEstimate, { status: "uncertain" }>["reason"], string> = {
  quiet: "Too little sound reached the microphone. Move closer and let one string ring.",
  clipped: "The input overloaded. Lower your guitar or microphone gain and try again.",
  unclear: "The input did not contain one clear repeating pitch. Try one string away from background sound.",
  unstable: "The pitch changed during the check. Let one note settle and ring before trying again.",
  interrupted: "The audio window was interrupted or delayed. Keep this page open and try again.",
};

function resultText(result: PitchEstimate): string {
  if (result.status === "uncertain") return REASONS[result.reason];
  const note = `${noteName(result.midi % 12)}${Math.floor(result.midi / 12) - 1}`;
  const estimate = `Estimated fundamental near ${note} (${result.frequencyHz.toFixed(1)} Hz).`;
  return Math.abs(result.centsFromTarget) <= 40
    ? `${estimate} It is near the open high E reference. This says nothing about your timing, release or tone.`
    : `${estimate} That is different from the open high E reference. Check which string rang and try again.`;
}

export function PitchCheck() {
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<PitchEstimate | null>(null);
  const [error, setError] = useState("");
  const sessionRef = useRef<MicrophoneSession | null>(null);
  const timerRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  useUpdateHold(listening, "a microphone pitch check in progress");

  const release = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    sessionRef.current?.close();
    sessionRef.current = null;
  };
  useEffect(
    () => () => {
      generationRef.current += 1;
      release();
    },
    [],
  );

  const stop = () => {
    generationRef.current += 1;
    release();
    setListening(false);
    setResult(null);
    setError("Stopped. No pitch judgement was recorded.");
  };
  const start = async () => {
    if (listening) return;
    const generation = ++generationRef.current;
    setListening(true);
    setResult(null);
    setError("");
    try {
      const microphone = await openMicrophone();
      if (generation !== generationRef.current) {
        microphone.close();
        return;
      }
      sessionRef.current = microphone;
      if (microphone.audioContext.state === "suspended") await microphone.audioContext.resume();
      if (generation !== generationRef.current) {
        release();
        return;
      }
      const startedAt = performance.now();
      const frames: TimedAudioFrame[] = [];
      timerRef.current = window.setInterval(() => {
        if (generation !== generationRef.current) return;
        if (document.hidden) {
          release();
          setListening(false);
          setResult({ status: "uncertain", reason: "interrupted" });
          return;
        }
        try {
          const now = performance.now();
          const elapsed = now - startedAt;
          if (elapsed >= 300) {
            microphone.analyser.getFloatTimeDomainData(microphone.samples);
            frames.push({ atMs: now, samples: new Float32Array(microphone.samples) });
          }
          if (elapsed < 2_400) return;
          release();
          setListening(false);
          setResult(assessSustainedPitch(frames, microphone.audioContext.sampleRate, TARGET_MIDI));
        } catch {
          release();
          setListening(false);
          setResult({ status: "uncertain", reason: "interrupted" });
        }
      }, 90);
    } catch {
      if (generation !== generationRef.current) return;
      release();
      setListening(false);
      setError("The microphone was unavailable or permission was declined. You can still use every lesson without it.");
    }
  };

  return (
    <details className="pitch-check card">
      <summary>
        <span className="eyebrow">Optional signal check</span>
        <strong>Is one note near open high E?</strong>
      </summary>
      <div className="pitch-check-body">
        <p>
          On a standard tuned guitar, let the thinnest open string ring for about two seconds. This checks a sustained
          pitch estimate only. It cannot judge whether your playing sounds good, whether you stopped cleanly, or whether
          you kept time.
        </p>
        <p>The microphone turns on only when you ask. No recording or pitch result is saved or uploaded.</p>
        <div className="action-row">
          {listening ? (
            <button className="secondary-action" onClick={stop}>
              Stop check
            </button>
          ) : (
            <button className="primary-action" onClick={() => void start()}>
              Use microphone for one note
            </button>
          )}
        </div>
        {listening && <p role="status">Listening for a settled single note… keep this page visible.</p>}
        {error && <p role="alert">{error}</p>}
        {result && (
          <div className="pitch-check-result" role="status">
            <strong>{result.status === "uncertain" ? "No reliable pitch estimate" : "Pitch-only estimate"}</strong>
            <p>{resultText(result)}</p>
            {result.status === "uncertain" && (
              <small>Uncertain is not a failed attempt. You can try again or leave this check aside.</small>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
