let activeStop: (() => void) | null = null;

/** Only one music transport may own this tab's audio output at a time. */
export function replaceTransport(stop: () => void): void {
  activeStop?.();
  activeStop = stop;
}

export function stopTransport(): void {
  activeStop?.();
  activeStop = null;
}

export function releaseTransport(stop: () => void): void {
  if (activeStop === stop) activeStop = null;
}
