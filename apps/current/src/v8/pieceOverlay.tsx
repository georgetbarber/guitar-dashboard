import { createContext, useContext } from "react";

/**
 * Opening a piece from anywhere (Play, the course map, Continue's favourites).
 * The piece player itself is lazily loaded with the lesson packs; this is
 * only the request, kept in the shell so any view can make it.
 */
export interface PieceRequest {
  pieceId: string;
  /** Start on this part. */
  partId?: string;
  /** Open as this stage's capstone. */
  capstoneStage?: number;
}

export const PieceOverlayContext = createContext<(request: PieceRequest) => void>(() => undefined);

export function useOpenPiece(): (request: PieceRequest) => void {
  return useContext(PieceOverlayContext);
}
