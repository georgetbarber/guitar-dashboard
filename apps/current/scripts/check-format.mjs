import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const app = fileURLToPath(new URL("../", import.meta.url));
const repository = fileURLToPath(new URL("../../../", import.meta.url));
const prefix = "apps/current/";
const adopted = [
  "eslint.config.mjs",
  "prettier.config.mjs",
  "scripts/check-format.mjs",
  "src/v8/identity.ts",
  "src/v8/updates.ts",
];

function git(...args) {
  return execFileSync("git", args, { cwd: repository, encoding: "buffer" })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function hasCommit(ref) {
  try {
    git("cat-file", "-e", `${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

let added;
const base = process.env.QUALITY_BASE_SHA;
if (base && hasCommit(base)) {
  added = git("diff", "--name-only", "--diff-filter=A", "-z", base, "HEAD");
} else if (process.env.GITHUB_ACTIONS === "true" && hasCommit("HEAD^")) {
  added = git("diff", "--name-only", "--diff-filter=A", "-z", "HEAD^", "HEAD");
} else {
  added = [
    ...git("diff", "--name-only", "--diff-filter=A", "-z", "HEAD"),
    ...git("ls-files", "--others", "--exclude-standard", "-z"),
  ];
}

const supported = /\.(?:css|js|json|jsx|md|mjs|ts|tsx)$/;
const files = [
  ...new Set([
    ...adopted,
    ...added.filter((path) => path.startsWith(prefix) && supported.test(path)).map((path) => path.slice(prefix.length)),
  ]),
];
const result = spawnSync(process.execPath, ["node_modules/prettier/bin/prettier.cjs", "--check", ...files], {
  cwd: app,
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
