const KEY = "guitar-academy-cloud-session";

/** A loading hint, never proof of identity. Firebase still verifies the session. */
export function readCloudSessionHint(): "account" | "guest" | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "account" || value === "guest" ? value : null;
  } catch {
    // Without a reliable hint, load Firebase to avoid hiding a retained login.
    return "account";
  }
}

export function writeCloudSessionHint(value: "account" | "guest"): void {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* Startup remains safe without this optimisation. */
  }
}
