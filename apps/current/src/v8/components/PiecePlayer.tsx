import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { startScorePlayback, stopScorePlayback, type ScorePlaybackProgress } from "../../audio/scorePlayer";
import { barAndCount } from "../../core/score/time";
import { totalTicks } from "../../core/score/validate";
import { createEvidence } from "../learning";
import { visibleTechniques } from "../lessons/validate";
import type { PieceRequest } from "../pieceOverlay";
import {
  capstoneActivityId,
  LAYER_NAMES,
  pieceFavouriteId,
  pieceScore,
  STYLE_NAMES,
  type Piece,
} from "../pieces/format";
import { PIECES } from "../pieces/library";
import { useV8Store } from "../store";
import type { EvidenceOutcome } from "../types";
import { ContentStatus } from "./ContentStatus";
import { RecordSaveStatus } from "./SaveStatus";
import { ScoreView } from "./score/ScoreView";
import { useUpdateHold } from "./UpdateNotice";

const LARGE_KEY = "interval.score.large";
const OUTCOME_LABELS: Record<EvidenceOutcome, string> = {
  retry: "Needs another go",
  partial: "Partly there",
  successful: "I played it",
};

function readLarge(): boolean {
  try {
    return localStorage.getItem(LARGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeLarge(value: boolean) {
  try {
    localStorage.setItem(LARGE_KEY, value ? "1" : "0");
  } catch {
    /* A private window keeps the choice for this view only. */
  }
}

interface Props {
  request: PieceRequest;
  onClose: () => void;
  requestCloseRef?: MutableRefObject<(() => void) | null>;
}

/** A piece from the repertoire: choose a part, hear everything, play along with the band, and (for a capstone) report how it went. */
export function PiecePlayer({ request, onClose, requestCloseRef }: Props) {
  const piece = PIECES.find((item) => item.id === request.pieceId);
  if (!piece)
    return (
      <section className="pilot-episode" aria-labelledby="activity-title">
        <header className="activity-header">
          <button className="icon-button" onClick={onClose} aria-label="Close piece" data-autofocus>
            ←
          </button>
          <div>
            <h1 id="activity-title">This piece isn't in this version of Interval</h1>
            <p className="pilot-notice" role="alert">
              Reload Interval to fetch the latest version, then try again.
            </p>
          </div>
        </header>
      </section>
    );
  return <PieceBody piece={piece} request={request} onClose={onClose} requestCloseRef={requestCloseRef} />;
}

function PieceBody({ piece, request, onClose, requestCloseRef }: Props & { piece: Piece }) {
  const { state, dispatch } = useV8Store();
  const capstone = piece.capstones.find((item) => item.stage === request.capstoneStage);
  const [partId, setPartId] = useState(request.partId ?? capstone?.partIds[0] ?? piece.parts[0].id);
  const part = piece.parts.find((item) => item.id === partId) ?? piece.parts[0];
  const lead = pieceScore(piece, part.scoreId);
  const backing = part.accompanimentIds.map((id) => pieceScore(piece, id));
  const [tempo, setTempo] = useState(lead.tempo.default);
  const [loop, setLoop] = useState(false);
  const [large, setLarge] = useState(readLarge);
  const [hideTab, setHideTab] = useState(false);
  const [progress, setProgress] = useState<ScorePlaybackProgress | null>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const [usedTab, setUsedTab] = useState(false);
  const [observation, setObservation] = useState("");
  const [notice, setNotice] = useState("");
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const stopRef = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  const clamped = Math.min(lead.tempo.maximum, Math.max(lead.tempo.minimum, tempo));
  const favourite = (state.favoriteActivityIds ?? []).includes(pieceFavouriteId(piece.id));
  const inCapstone = Boolean(capstone?.partIds.includes(part.id));
  const barTicks = totalTicks(lead) / lead.bars;
  /** Reading the tab during the attempt is support; only a hidden-tab attempt is unaided. */
  const assisted = usedTab || !hideTab;

  useEffect(
    () => () => {
      generation.current++;
      stopScorePlayback();
    },
    [],
  );
  useUpdateHold(playing || observation.trim().length > 0, "the piece you are playing or an unsaved observation");

  const stop = () => {
    generation.current++;
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
    setProgress(null);
  };
  const requestClose = () => {
    if (observation.trim()) {
      setNotice("Record or clear your observation before leaving this piece.");
      return;
    }
    stop();
    onClose();
  };
  useEffect(() => {
    if (!requestCloseRef) return;
    requestCloseRef.current = requestClose;
    return () => {
      requestCloseRef.current = null;
    };
  });

  const choosePart = (id: string) => {
    stop();
    setPartId(id);
    setPlayed(false);
    setUsedTab(false);
    setEvidenceIds([]);
    const next = pieceScore(piece, piece.parts.find((item) => item.id === id)!.scoreId);
    setTempo((current) => Math.min(next.tempo.maximum, Math.max(next.tempo.minimum, current)));
  };

  const play = async (alongside: boolean) => {
    stop();
    const mine = generation.current;
    setNotice("");
    if (!hideTab) setUsedTab(true);
    try {
      const stopPlayback = await startScorePlayback(
        lead,
        {
          tempo: clamped,
          fromTick: 0,
          toTick: totalTicks(lead),
          mode: alongside ? "count-only" : "reference",
          loop,
          countIn: true,
          click: true,
          accompaniment: backing,
        },
        setProgress,
        () => {
          if (mine !== generation.current) return;
          setPlaying(false);
          setProgress(null);
          if (alongside) setPlayed(true);
        },
        () => {
          if (mine !== generation.current) return;
          setPlaying(false);
          setProgress(null);
          setNotice("Playback stopped because other sound started or the tab went into the background.");
        },
      );
      if (mine !== generation.current) {
        stopPlayback();
        return;
      }
      stopRef.current = stopPlayback;
      setPlaying(true);
    } catch (failure) {
      setNotice(
        failure instanceof Error ? failure.message : "Sound could not start. You can still play from the score.",
      );
    }
  };

  const record = (outcome: EvidenceOutcome) => {
    if (!capstone || !inCapstone || !played || observation.trim().length < 8) return;
    const evidence = createEvidence(
      capstoneActivityId(capstone.stage),
      [capstone.capability.id],
      "performance",
      assisted ? "hint" : "none",
      outcome,
      { tempo: clamped },
    );
    dispatch({ type: "recordActivity", activityId: capstoneActivityId(capstone.stage), evidence });
    setEvidenceIds(evidence.map((item) => item.id));
    setObservation("");
    setPlayed(false);
    setUsedTab(false);
    setNotice(
      outcome === "successful"
        ? "Your report was added to this workspace. Nothing measured your playing."
        : "Your report was added. Slow the tempo or play one section, then try the whole part again.",
    );
  };

  const where = () => {
    if (progress?.tick === null || progress?.tick === undefined) return `${part.title} · ${clamped} BPM`;
    const { bar, count } = barAndCount(progress.tick, lead.metre);
    return `${part.title} · bar ${bar}, count ${count} · ${clamped} BPM`;
  };
  const section =
    progress?.tick !== null && progress?.tick !== undefined
      ? lead.sections.find((item) => progress.tick! >= item.from && progress.tick! < item.to)
      : undefined;
  const videoNeeded = visibleTechniques(lead);
  const layers = [1, 2, 3, 4] as const;

  return (
    <section className="pilot-episode piece-player" aria-labelledby="activity-title">
      <header className="activity-header">
        <button className="icon-button" onClick={requestClose} aria-label="Close piece" data-autofocus>
          ←
        </button>
        <div>
          <span>
            {capstone ? `Stage ${capstone.stage} capstone` : "Repertoire"} ·{" "}
            {piece.styles.map((style) => STYLE_NAMES[style]).join(", ")}
          </span>
          <h1 id="activity-title">{piece.title}</h1>
          <p>{piece.description}</p>
          <button
            className="text-action"
            aria-pressed={favourite}
            onClick={() => dispatch({ type: "toggleFavoriteActivity", activityId: pieceFavouriteId(piece.id) })}
          >
            {favourite ? "★ Saved as a familiar favourite" : "☆ Save as a familiar favourite"}
          </button>
          <ContentStatus
            provenance={{ contentId: piece.id, contentVersion: piece.version, ...piece.provenance }}
            target={() => ({
              contentId: piece.id,
              contentVersion: piece.version,
              contentTitle: piece.title,
              location: where(),
              showing: [
                hideTab ? "tab hidden" : "tab visible",
                playing ? "playing" : "not playing",
                large ? "music-stand view" : "",
              ]
                .filter(Boolean)
                .join("; "),
            })}
          />
        </div>
      </header>
      {notice && (
        <p className="pilot-notice" role="status">
          {notice}
        </p>
      )}
      <div className="pilot-layout">
        <article className="pilot-main card">
          <span className="eyebrow">{LAYER_NAMES[part.layer]}</span>
          <h2>{part.title}</h2>
          <p>{part.instruction}</p>
          {capstone && (
            <p className="piece-capstone-aim">
              <strong>Capstone:</strong> {capstone.capability.criterion}
            </p>
          )}
          {lead.sections.length > 1 && (
            <ol className="piece-form" aria-label="Form">
              {lead.sections.map((item) => (
                <li key={item.id} aria-current={section?.id === item.id ? "step" : undefined}>
                  <strong>{item.label}</strong>{" "}
                  <small>
                    bars {item.from / barTicks + 1}–{item.to / barTicks}
                  </small>
                </li>
              ))}
            </ol>
          )}
          {videoNeeded.length > 0 && (
            <p className="lesson-video-needed">
              <strong>Demonstration video still needed</strong> for {videoNeeded.join(", ")}. Until then, follow the
              written guidance in the units that teach this part and the synthesised sound.
            </p>
          )}
          <ScoreView
            score={lead}
            activeTick={hideTab ? null : (progress?.tick ?? null)}
            conceal={hideTab}
            large={large}
          />
          <div className="pilot-controls">
            <label className="lesson-tempo">
              Tempo · {clamped} BPM
              <input
                type="range"
                min={lead.tempo.minimum}
                max={lead.tempo.maximum}
                step={1}
                value={clamped}
                onChange={(event) => {
                  stop();
                  setTempo(Number(event.target.value));
                }}
              />
            </label>
            <label className="pilot-loop">
              <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} /> Loop
            </label>
            <label className="pilot-loop">
              <input
                type="checkbox"
                checked={hideTab}
                onChange={(event) => {
                  stop();
                  setHideTab(event.target.checked);
                }}
              />{" "}
              Hide the tab
            </label>
            <label className="pilot-loop">
              <input
                type="checkbox"
                checked={large}
                onChange={(event) => {
                  setLarge(event.target.checked);
                  writeLarge(event.target.checked);
                }}
              />{" "}
              Music-stand view
            </label>
          </div>
          <div className="pilot-play-actions">
            <button className="primary-action large" onClick={() => void play(true)}>
              {backing.length ? "Play along with the band" : "Count in and play"}
            </button>
            <button className="secondary-action" onClick={() => void play(false)}>
              {backing.length ? "Hear everything" : "Hear this part"}
            </button>
            <button className="secondary-action" disabled={!playing} onClick={stop}>
              Stop sound
            </button>
          </div>
          <p className="pilot-playing" role="status" aria-live="off">
            {progress
              ? progress.phase === "count-in"
                ? `Count in: ${progress.count}`
                : `${progress.phase === "your-turn" ? "Your part" : "Everything"} · bar ${barAndCount(progress.tick ?? 0, lead.metre).bar} of ${lead.bars}${section ? ` · ${section.label}` : ""}`
              : "Ready when you are."}
          </p>
          <small>
            The sound is synthesised guitar and a click, for timing and pitch, not a recording of real hands or a band.
            {backing.length ? " In “Play along”, your part is silent and the other guitar plays." : ""}
          </small>
          {capstone && inCapstone && (
            <div className="pilot-check">
              {!played && (
                <button className="text-action" onClick={() => setPlayed(true)}>
                  I played it without the app sound
                </button>
              )}
              <label>
                One concrete observation{" "}
                <textarea
                  maxLength={1000}
                  value={observation}
                  onChange={(event) => setObservation(event.target.value)}
                  placeholder="Where did you lose or keep your place? What did the band and you do together?"
                />
              </label>
              <small>
                {assisted
                  ? "The tab was showing, so this is recorded as played with a hint. Hide the tab to try it unaided."
                  : "With the tab hidden, this is recorded as unaided."}{" "}
                {capstone.criterion.replace(/^I /, "Report whether you ")} The result is your report, not a measurement.
              </small>
              <div className="pilot-outcomes">
                {(["retry", "partial", "successful"] as const).map((outcome) => (
                  <button
                    key={outcome}
                    disabled={!played || observation.trim().length < 8}
                    onClick={() => record(outcome)}
                  >
                    {OUTCOME_LABELS[outcome]}
                  </button>
                ))}
              </div>
              {evidenceIds.length > 0 && <RecordSaveStatus evidenceIds={evidenceIds} />}
            </div>
          )}
        </article>
        <aside className="pilot-side card">
          <h2>Parts</h2>
          {layers.map((layer) => {
            const parts = piece.parts.filter((item) => item.layer === layer);
            if (!parts.length) return null;
            return (
              <div key={layer} className="piece-layer">
                <span className="eyebrow">{LAYER_NAMES[layer]}</span>
                {parts.map((item) => (
                  <button
                    key={item.id}
                    className="secondary-action"
                    aria-pressed={item.id === part.id}
                    onClick={() => choosePart(item.id)}
                  >
                    {item.title}
                    {capstone?.partIds.includes(item.id) ? " · capstone" : ""}
                  </button>
                ))}
              </div>
            );
          })}
          <small>Later layers arrive as the course reaches them.</small>
        </aside>
      </div>
    </section>
  );
}
