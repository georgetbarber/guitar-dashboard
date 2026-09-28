import { buildChords, createContext } from "../core/music/theory";
import { generateShapes } from "../core/instrument/guitar";
import { assessFingering } from "../core/instrument/fingering";
import { newId } from "./identity";
import { newSketch } from "./repository";
import type { FreePlayPrompt } from "./freePlay";
import type { MelodyEvent, Sketch, V8State } from "./types";

function guitarNote(midi: number, beat: number, duration: number): MelodyEvent {
  const string = midi >= 64 ? 0 : 1;
  return { id: newId("melody"), string, fret: midi - (string === 0 ? 64 : 59), beat, duration };
}

/** Transfer the prompt's actual guide into a source-linked, editable sketch. */
export function sketchFromFreePlay(state: V8State, prompt: FreePlayPrompt): Sketch | null {
  const preview = prompt.preview;
  const sketch = newSketch(state.sketches.length, { key: state.settings.tonicName, mode: state.settings.mode });
  sketch.name = prompt.title;
  sketch.intention = prompt.variation;
  sketch.notes = `Free Play prompt: ${prompt.instruction}\nListen for: ${prompt.relationship}`;
  sketch.origin = {
    kind: "free-play",
    sourceId: prompt.id,
    label: prompt.title,
    referenceTempo: preview.kind === "notes" || preview.kind === "groove" ? preview.bpm : 72,
    createdAt: new Date().toISOString(),
    preview,
  };
  sketch.tempo = sketch.origin.referenceTempo;
  sketch.rhythmPattern =
    preview.kind === "groove"
      ? preview.accents.map((accented) => (accented ? "●" : "·")).join(" ")
      : prompt.displayTokens.join(" ");
  if (preview.kind === "notes") {
    sketch.melody = preview.pitches.flatMap((pitch, index) =>
      pitch < 0 ? [] : [guitarNote(60 + pitch, index * 0.5, 0.5)],
    );
  } else if (preview.kind === "degree") {
    sketch.melody = [preview.tonic, preview.target, preview.tonic].map((pitch, index) =>
      guitarNote(60 + pitch, index, 0.8),
    );
  } else if (preview.kind === "chords") {
    const available = buildChords(createContext(state.settings.tonicName, state.settings.mode));
    const events = preview.pitches.map((pitches) => {
      const tones = new Set(pitches);
      const chord = available.find(
        (candidate) =>
          candidate.tones.length === pitches.length && candidate.tones.every((tone) => tones.has(tone.pitchClass)),
      );
      if (!chord) return null;
      const shape = generateShapes(chord).find((candidate) => assessFingering(candidate).feasible);
      if (!shape) return null;
      return {
        id: newId("chord"),
        symbol: chord.symbol,
        beats: 4,
        voicing: Array.from(
          { length: 6 },
          (_, string) => shape.positions.find((position) => position.string === string)?.fret ?? null,
        ),
      };
    });
    if (events.some((event) => !event)) return null;
    sketch.chords = events as Sketch["chords"];
  }
  // Groove material is the structured accent grid retained in origin.preview.
  // A muted-string prompt is not silently converted into pitched melody notes.
  return sketch;
}
