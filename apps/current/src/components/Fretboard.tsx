import { useId, useState, type KeyboardEvent } from "react";
import { buildFretboard, coordinate, STANDARD_GUITAR } from "../core/instrument/guitar";
import type { FretPosition, GuitarShape } from "../core/instrument/guitar";
import {
  chordToneDisplayLabel,
  displayRelationshipLabel,
  intervalLabel,
  noteName,
  normalize,
  pitchWithOctave
} from "../core/music/theory";
import type { Chord, PitchClass, ScaleTone } from "../core/music/types";

interface FretboardProps {
  scale: readonly ScaleTone[];
  chord?: Chord;
  shape?: GuitarShape | null;
  selectedPitch?: PitchClass;
  selectedPosition?: { string: number; fret: number } | null;
  relationshipRoot?: PitchClass;
  targetInterval?: number;
  labelMode?: "relationships" | "notes";
  visible?: "scale" | "chord" | "all" | "targets";
  fretStart?: number;
  fretEnd?: number;
  onPosition?: (position: FretPosition) => void;
}

const MARKERS = new Set([3, 5, 7, 9, 12, 15]);

export function Fretboard({
  scale,
  chord,
  shape,
  selectedPitch,
  selectedPosition,
  relationshipRoot,
  targetInterval,
  labelMode = "relationships",
  visible = "scale",
  fretStart = 0,
  fretEnd = STANDARD_GUITAR.fretCount,
  onPosition
}: FretboardProps) {
  const scaleMap = new Map(scale.map((tone) => [tone.pitchClass, tone]));
  const chordMap = new Map(chord?.tones.map((tone) => [tone.pitchClass, tone]) ?? []);
  const shapeSet = new Set(shape?.positions.map(coordinate) ?? []);
  const frets = Array.from({ length: fretEnd - fretStart + 1 }, (_, index) => fretStart + index);
  const helpId = useId();
  const [focus, setFocus] = useState(selectedPosition ?? { string: 0, fret: fretStart });
  const focusFret = Math.max(fretStart, Math.min(fretEnd, focus.fret));
  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, position: FretPosition) => {
    let string = position.string;
    let fret = position.fret;
    switch (event.key) {
      case "ArrowRight": fret++; break;
      case "ArrowLeft": fret--; break;
      case "ArrowDown": string++; break;
      case "ArrowUp": string--; break;
      case "Home": fret = fretStart; if (event.ctrlKey || event.metaKey) string = 0; break;
      case "End": fret = fretEnd; if (event.ctrlKey || event.metaKey) string = STANDARD_GUITAR.openMidi.length - 1; break;
      default: return;
    }
    event.preventDefault();
    string = Math.max(0, Math.min(STANDARD_GUITAR.openMidi.length - 1, string));
    fret = Math.max(fretStart, Math.min(fretEnd, fret));
    setFocus({ string, fret });
    event.currentTarget.closest('[role="grid"]')?.querySelector<HTMLButtonElement>(`[data-string="${string}"][data-fret="${fret}"]`)?.focus();
  };

  return (
    <div className="fretboard-scroll">
      <p className="fretboard-keyboard-help" id={helpId}>Arrow keys move between strings and frets; Home and End jump along the string.{onPosition ? " Enter or Space selects the focused position." : ""} Tab leaves the fretboard.</p>
      <div className="fretboard-key">
        {relationshipRoot !== undefined
          ? <span><b>Interval</b> measured from the selected physical root</span>
          : <>
              <span><b>Key</b> degree from the tonal centre</span>
              {chord && <span><b>Chord</b> tone measured from the chord root</span>}
            </>}
      </div>
      <div
        className="fretboard"
        role="grid"
        aria-label={`${STANDARD_GUITAR.name} fretboard`}
        aria-describedby={helpId}
        aria-multiselectable={selectedPitch !== undefined || undefined}
        style={{ "--fret-count": frets.length } as React.CSSProperties}
      >
        <div className="fretboard-row fretboard-header" role="row">
          <span role="columnheader" aria-label="String" />
          {frets.map((fret) => (
            <span role="columnheader" className={MARKERS.has(fret) ? "has-marker" : ""} key={fret}>{fret}</span>
          ))}
        </div>
        {STANDARD_GUITAR.openMidi.map((_, string) => (
          <div className="fretboard-row string-row" role="row" key={string}>
            <span className="string-label" role="rowheader"><b>{string + 1}</b>{STANDARD_GUITAR.stringLabels[string]}</span>
            {buildFretboard()
              .filter((position) =>
                position.string === string &&
                position.fret >= fretStart &&
                position.fret <= fretEnd
              )
              .map((position) => {
                const scaleTone = scaleMap.get(position.pitchClass);
                const chordTone = chordMap.get(position.pitchClass);
                const interval = relationshipRoot === undefined
                  ? null
                  : normalize(position.pitchClass - relationshipRoot);
                const isRoot = interval === 0 &&
                  selectedPosition?.string === string &&
                  selectedPosition?.fret === position.fret;
                const isTarget = targetInterval !== undefined && interval === normalize(targetInterval) && !isRoot;
                const inShape = shapeSet.has(coordinate(position));
                const isSelectedPosition = selectedPosition?.string === string && selectedPosition.fret === position.fret;
                const isSelectedPitch = selectedPitch === position.pitchClass;
                const shouldShow = visible === "all" ||
                  (visible === "chord" ? Boolean(chordTone) : visible === "scale" ? Boolean(scaleTone) : false) ||
                  inShape || isSelectedPitch || isRoot || isTarget;
                const absoluteName = scaleTone?.name ?? chordTone?.name ?? noteName(position.pitchClass);
                const labels = relationshipRoot !== undefined
                  ? [`Interval ${displayRelationshipLabel(intervalLabel(interval ?? 0))}`]
                  : labelMode === "notes"
                    ? [absoluteName]
                    : [
                        scaleTone ? `Key ${displayRelationshipLabel(scaleTone.degreeLabel)}` : null,
                        chordTone ? `Chord ${chordToneDisplayLabel(chordTone.intervalLabel)}` : null
                      ].filter((label): label is string => Boolean(label));
                if (!labels.length) labels.push(absoluteName);
                const primary = labels.join(" · ");
                return (
                  <button
                    type="button"
                    role="gridcell"
                    aria-selected={isSelectedPosition || isSelectedPitch}
                    aria-label={`String ${string + 1}, fret ${position.fret}, ${pitchWithOctave(absoluteName, position.midi)}, ${primary}`}
                    tabIndex={focus.string === string && focusFret === position.fret ? 0 : -1}
                    data-string={string}
                    data-fret={position.fret}
                    onFocus={() => setFocus({ string, fret: position.fret })}
                    onKeyDown={(event) => moveFocus(event, position)}
                    className={[
                      "fret",
                      shouldShow ? "is-visible" : "",
                      scaleTone ? "is-scale" : "",
                      chordTone ? "is-chord" : "",
                      inShape ? "is-shape" : "",
                      position.pitchClass === scale[0]?.pitchClass ? "is-tonic" : "",
                      isSelectedPitch ? "is-selected-pitch" : "",
                      isSelectedPosition ? "is-selected-position" : "",
                      isRoot ? "is-interval-root" : "",
                      isTarget ? "is-interval-target" : ""
                    ].filter(Boolean).join(" ")}
                    key={position.fret}
                    onClick={() => onPosition?.(position)}
                  >
                    {shouldShow && (
                      <span>
                        {labels.map((label) => <small key={label}>{label}</small>)}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
