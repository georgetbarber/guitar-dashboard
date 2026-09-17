import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
let fixture: string;
let work: string;
let older: string;
let newer: string;
function git(...args: string[]) {
  return execFileSync("git", args, { cwd: work, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function check(sha: string, ref = "refs/heads/main") {
  return spawnSync("bash", [`${root}scripts/check-release-head.sh`], {
    cwd: work, env: { ...process.env, GITHUB_SHA: sha, GITHUB_REF: ref }, encoding: "utf8",
  });
}

beforeAll(() => {
  mkdirSync(`${root}.local-recovery`, { recursive: true });
  fixture = mkdtempSync(`${root}.local-recovery/release-test-`);
  work = `${fixture}/work`;
  mkdirSync(work);
  git("init", "--initial-branch=main");
  git("-c", "user.name=Release test", "-c", "user.email=release@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-m", "Older release");
  older = git("rev-parse", "HEAD");
  git("clone", "--bare", ".", `${fixture}/remote.git`);
  git("remote", "add", "origin", `${fixture}/remote.git`);
  git("-c", "user.name=Release test", "-c", "user.email=release@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-m", "Newer release");
  newer = git("rev-parse", "HEAD");
  // This is a disposable local remote; no GitHub or network is involved.
  git("push", "origin", "main");
});
afterAll(() => { if (fixture) rmSync(fixture, { recursive: true, force: true }); });

describe("only the current main checkout can release", () => {
  it("accepts the current main head", () => { expect(check(newer).status).toBe(0); });
  it("rejects an older rerun even when its checkout matches its event", () => {
    git("checkout", "--detach", older);
    try { expect(check(older).status).toBe(1); }
    finally { git("checkout", "main"); }
  });
  it("rejects a mismatched event SHA", () => { expect(check(older).status).toBe(1); });
  it("rejects manual publication from a branch", () => { expect(check(newer, "refs/heads/experiment").status).toBe(1); });
  it("fails closed when the remote cannot be read", () => {
    git("remote", "set-url", "origin", `${fixture}/missing.git`);
    try { expect(check(newer).status).not.toBe(0); }
    finally { git("remote", "set-url", "origin", `${fixture}/remote.git`); }
  });
});
