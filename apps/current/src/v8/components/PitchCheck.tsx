import { useEffect, useRef, useState } from "react";
import { playMidi, stopAudio } from "../../audio/engine";
import { openMicrophone } from "../../audio/microphone";
import type { MicrophoneSession } from "../../audio/microphone";
import { assessNoteSequence } from "../../audio/noteSequenceAssessment";
import type { NoteSequenceEstimate } from "../../audio/noteSequenceAssessment";
import { assessSustainedPitch } from "../../audio/pitchAssessment";
import type { PitchEstimate, TimedAudioFrame } from "../../audio/pitchAssessment";
import { noteName } from "../../core/music/theory";
import { STANDARD_TUNING_MIDI } from "../structuredMusic";
import { useUpdateHold } from "./UpdateNotice";

const TARGET_MIDI = STANDARD_TUNING_MIDI[5]; // first, high-E string in standard tuning
type SignalKind = "sustained" | "two-plucks" | "three-note";
type SignalResult = { kind: "sustained"; estimate: PitchEstimate }
  | { kind: "two-plucks" | "three-note"; estimate: NoteSequenceEstimate };
const TARGETS: Record<SignalKind, readonly number[]> = {
  sustained: [TARGET_MIDI],
  "two-plucks": [TARGET_MIDI, TARGET_MIDI],
  "three-note": [TARGET_MIDI, TARGET_MIDI + 3, TARGET_MIDI],
};
const DURATIONS: Record<SignalKind, number> = { sustained: 2_400, "two-plucks": 4_200, "three-note": 5_700 };
const REASONS: Record<Extract<NoteSequenceEstimate, { status: "uncertain" }>["reason"], string> = {
  quiet: "Too little sound reached the microphone. Move closer and play the shown note or notes clearly.",
  clipped: "The input overloaded. Lower your guitar or microphone gain and try again.",
  unclear: "The input did not contain one clear repeating pitch. Try one string away from background sound.",
  unstable: "The pitch changed during the check. Let one note settle and ring before trying again.",
  interrupted: "The audio window was interrupted or delayed. Keep this page open and try again.",
  "not-separated": "The check did not find the requested number of clear notes with quiet gaps. Pluck, stop the string, then pluck the next note; try again if you want.",
};

function noteLabel(midi: number): string {
  return `${noteName(midi % 12)}${Math.floor(midi / 12) - 1}`;
}

function sustainedResultText(result: PitchEstimate): string {
  if (result.status === "uncertain") return REASONS[result.reason];
  const estimate = `Estimated fundamental near ${noteLabel(result.midi)} (${result.frequencyHz.toFixed(1)} Hz).`;
  return Math.abs(result.centsFromTarget) <= 40
    ? `${estimate} It is near the open high E reference. This says nothing about your timing, release or tone.`
    : `${estimate} That is different from the open high E reference. Check which string rang and try again.`;
}

function sequenceResultText(result: NoteSequenceEstimate, targets: readonly number[]): string {
  if (result.status === "uncertain") return REASONS[result.reason];
  const heard = result.notes.map((note) => noteLabel(note.midi)).join(" → ");
  const expected = targets.map(noteLabel).join(" → ");
  const near = result.notes.every((note) => Math.abs(note.centsFromTarget) <= 40);
  return `Estimated pitch order: ${heard}. Shown pattern: ${expected}. ${near
    ? "The estimated pitches were near the shown notes."
    : "One or more estimated pitches differed from the shown notes."} The signal had quiet gaps between these estimates; this does not judge your rhythm, release quality, touch or musical performance.`;
}

export function PitchCheck() {
  const [kind, setKind] = useState<SignalKind>("sustained");
  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<SignalResult | null>(null);
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
    setCapturing(false);
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
  const chooseKind = (next: SignalKind) => {
    if (listening) return;
    stopAudio();
    setKind(next);
    setResult(null);
    setError("");
  };
  const hearPattern = () => {
    if (listening) return;
    try {
      stopAudio();
      TARGETS[kind].forEach((midi, index) => playMidi(midi, index * 0.85, 0.5));
      setError("");
    } catch {
      setError("The example could not play on this device. The written pattern is still available.");
    }
  };
  const start = async () => {
    if (listening) return;
    const generation = ++generationRef.current;
    setListening(true);
    setCapturing(false);
    setResult(null);
    setError("");
    stopAudio();
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
      setCapturing(true);
      timerRef.current = window.setInterval(() => {
        if (generation !== generationRef.current) return;
        if (document.hidden) {
          release();
          setListening(false);
          setResult({ kind, estimate: { status: "uncertain", reason: "interrupted" } });
          return;
        }
        try {
          const now = performance.now();
          const elapsed = now - startedAt;
          if (elapsed >= 300) {
            microphone.analyser.getFloatTimeDomainData(microphone.samples);
            frames.push({ atMs: now, samples: new Float32Array(microphone.samples) });
          }
          if (elapsed < DURATIONS[kind]) return;
          release();
          setListening(false);
          setResult(kind === "sustained"
            ? { kind, estimate: assessSustainedPitch(frames, microphone.audioContext.sampleRate, TARGET_MIDI) }
            : { kind, estimate: assessNoteSequence(frames, microphone.audioContext.sampleRate, TARGETS[kind]) });
        } catch {
          release();
          setListening(false);
          setResult({ kind, estimate: { status: "uncertain", reason: "interrupted" } });
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
    <details className="pitch-check card" onToggle={(event) => { if (!event.currentTarget.open && listening) stop(); }}>
      <summary>
        <span className="eyebrow">Optional signal check</span>
        <strong>Is one note near open high E?</strong>
      </summary>
      <div className="pitch-check-body">
        <p>
          Check one note first, then two separated plucks or a short three-note shape if you want. These are pitch-only
          signal estimates, not guitar grades. They cannot judge whether your playing sounds good, whether you stopped
          cleanly, or whether you kept time.
        </p>
        <p>The microphone turns on only when you ask. No recording or pitch result is saved or uploaded.</p>
        <small>The two-pluck and three-note checks are experimental until tried with real guitar input on a phone.</small>
        <div className="pitch-check-modes" role="group" aria-label="Choose a microphone check">
          <button aria-pressed={kind === "sustained"} disabled={listening} onClick={() => chooseKind("sustained")}>One held note</button>
          <button aria-pressed={kind === "two-plucks"} disabled={listening} onClick={() => chooseKind("two-plucks")}>Two separate plucks</button>
          <button aria-pressed={kind === "three-note"} disabled={listening} onClick={() => chooseKind("three-note")}>Three-note shape</button>
        </div>
        <p>{kind === "sustained"
          ? "Let the thinnest open E string ring for about two seconds."
          : kind === "two-plucks"
            ? "Pluck the thinnest open E string twice, stopping it briefly between plucks. Start after the microphone is ready; you have about four seconds."
            : "On the thinnest string, play open E → G at fret 3 → open E, with a short silence between notes. G is a minor third above E. Start after the microphone is ready; you have about six seconds."}</p>
        <button className="text-action" disabled={listening} onClick={hearPattern}>Hear the synthesised pitch pattern</button>
        <div className="action-row">
          {listening ? (
            <button className="secondary-action" onClick={stop}>
              Stop check
            </button>
          ) : (
            <button className="primary-action" onClick={() => void start()}>
              {kind === "sustained" ? "Use microphone for one note" : kind === "two-plucks" ? "Use microphone for two plucks" : "Use microphone for three notes"}
            </button>
          )}
        </div>
        {listening && <p role="status">{capturing ? "Listening… play the shown pattern and keep this page visible." : "Opening microphone… begin when listening starts."}</p>}
        {error && <p role="alert">{error}</p>}
        {result && (
          <div className="pitch-check-result" role="status">
            <strong>{result.estimate.status === "uncertain" ? "No reliable pitch estimate" : "Pitch-only estimate"}</strong>
            <p>{result.kind === "sustained" ? sustainedResultText(result.estimate) : sequenceResultText(result.estimate, TARGETS[result.kind])}</p>
            {result.estimate.status === "uncertain" && (
              <small>Uncertain is not a failed attempt. You can try again or leave this check aside.</small>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
