#!/usr/bin/env node
// Runs one of Cade's scripts on your deployment.
//
//   npm run setup                 first-time setup (asks which version of Cade)
//   npm run deploy                deploy the version you chose
//   npm run upgrade [-- v1.2.0]   choose another version, or the latest (main)
//   npm run version               show the version you chose
//   npm run group -- --name acme  any other Cade script, with its arguments
//
// Cade's code is not kept in this repo. It is checked out, at the version in
// .cade/version.json, into .cade-src/, installed and built there, and the
// script runs from it. What belongs to your deployment (cade.config.json, the
// .cade/ folder, google/Secret.gs) stays here, which Cade finds through
// CADE_DEPLOY_DIR, so a change of version never touches it.
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

export const DEPLOY_DIR = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = `${DEPLOY_DIR}.cade-src`;
const VERSION_FILE = `${DEPLOY_DIR}.cade/version.json`;
const CLOUDFLARE_FILE = `${DEPLOY_DIR}.cade/cloudflare.json`;
export const DEFAULT_REPO = "https://github.com/XTECLK/Cade.git";
export const LATEST = "main";

// Scripts that change what is deployed. For the latest (main), they bring in
// its newest changes first; the others work on the code as it already is.
const REFRESHING = new Set(["setup", "deploy", "upgrade", "slack:update", "google:update", "db:migrate"]);

// The release tags (v1.2.3 or 1.2.3) in `git ls-remote --tags` output, newest first.
export function releasesIn(output) {
  const tags = [...output.matchAll(/refs\/tags\/(v?\d+\.\d+\.\d+)$/gm)].map((match) => match[1]);
  const key = (tag) => tag.replace(/^v/, "").split(".").map(Number);
  return [...new Set(tags)].sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    return y[0] - x[0] || y[1] - x[1] || y[2] - x[2];
  });
}

// Whether `ref` is the latest development version rather than a release.
export const isLatest = (ref) => ref === LATEST;

// A name git would accept as a tag or branch here, and no option or path trick.
export function checkRef(ref) {
  if (!/^[\w][\w./-]{0,100}$/.test(ref) || ref.includes("..")) throw new Error(`"${ref}" isn't a version: use a release such as v1.2.0, or ${LATEST}.`);
  return ref;
}

// wrangler.toml with the Worker named `name` (kept in .cade/cloudflare.json,
// so a change of version doesn't lose it).
export function withWorkerName(toml, name) {
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) throw new Error("A Worker name is lowercase letters, digits and -, such as cade.");
  return toml.replace(/^name = ".*"$/m, `name = "${name}"`);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

// Runs a command, showing its output unless `capture`; resolves { code, output }.
function run(command, args, { cwd = DEPLOY_DIR, env = process.env, capture = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit" });
    let output = "";
    if (capture) for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => (output += chunk));
    child.on("error", (error) => resolve({ code: 1, output: String(error) }));
    child.on("exit", (code) => resolve({ code: code ?? 1, output }));
  });
}

async function mustRun(command, args, options) {
  const result = await run(command, args, options);
  if (result.code !== 0) throw new Error(`${command} ${args.join(" ")} failed.${result.output ? `\n${result.output.trim()}` : ""}`);
  return result.output;
}

const git = (args, options) => mustRun("git", args, { cwd: SRC_DIR, capture: true, ...options });

// The version in .cade/version.json: { "version": "v1.2.0" | "main", "repo"?: url }.
export function chosen() {
  const { version, repo } = readJson(VERSION_FILE);
  return { version: process.env.CADE_VERSION || version, repo: process.env.CADE_REPO || repo || DEFAULT_REPO };
}

async function releases(repo) {
  const result = await run("git", ["ls-remote", "--tags", "--refs", repo], { capture: true });
  if (result.code !== 0) throw new Error(`Couldn't reach ${repo}.\n${result.output.trim()}`);
  return releasesIn(result.output);
}

// Asks which version, from a list; or takes `wanted` (from the command line).
async function pickVersion(repo, wanted) {
  const tags = await releases(repo);
  if (wanted) {
    if (!isLatest(wanted) && tags.length && !tags.includes(wanted)) throw new Error(`${wanted} isn't a release of ${repo}. Releases: ${tags.slice(0, 8).join(", ")}.`);
    return checkRef(wanted);
  }
  const options = [
    ...(tags.length ? [{ ref: tags[0], label: `${tags[0]}  the latest release (recommended)` }] : []),
    ...tags.slice(1, 6).map((tag) => ({ ref: tag, label: tag })),
    { ref: LATEST, label: `${LATEST}  the latest development version, with changes not yet released` },
  ];
  if (!process.stdin.isTTY) {
    throw new Error(`Choose a version: ${options.map((option) => option.ref).join(", ")}. Run npm run upgrade -- <version> (or set CADE_VERSION).`);
  }
  console.log("\nWhich version of Cade do you want to deploy?");
  options.forEach((option, index) => console.log(`  ${index + 1}. ${option.label}`));
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (;;) {
      const answer = (await readline.question(`Number, or a release name [1]: `)).trim() || "1";
      const option = options[Number(answer) - 1];
      if (option) return option.ref;
      if (tags.includes(answer) || isLatest(answer)) return answer;
      console.log("Pick one from the list.");
    }
  } finally {
    readline.close();
  }
}

// Makes .cade-src the code at `ref`, installed and built. Returns the commit.
export async function prepare({ version, repo }, { refresh }) {
  if (!existsSync(`${SRC_DIR}/.git`)) {
    console.log(`Getting Cade from ${repo}…`);
    await mustRun("git", ["clone", "--quiet", repo, SRC_DIR], { capture: true });
  } else {
    await git(["remote", "set-url", "origin", repo]);
  }
  const local = await run("git", ["rev-parse", "--verify", "--quiet", `${isLatest(version) ? "origin/" : "refs/tags/"}${version}^{commit}`], { cwd: SRC_DIR, capture: true });
  if (refresh || local.code !== 0) {
    console.log("Fetching Cade's changes…");
    await git(["fetch", "--quiet", "--tags", "--force", "origin"]);
  }
  // A deploy can leave wrangler.toml changed, which would block the checkout.
  await git(["reset", "--quiet", "--hard"]);
  const target = isLatest(version) ? `origin/${version}` : `refs/tags/${version}`;
  const found = await run("git", ["rev-parse", "--verify", "--quiet", `${target}^{commit}`], { cwd: SRC_DIR, capture: true });
  if (found.code !== 0) throw new Error(`${version} isn't in ${repo}. Run npm run upgrade to choose a version.`);
  const commit = found.output.trim();
  await git(["checkout", "--quiet", "--force", "--detach", commit]);

  // Install and build once per commit.
  const stamp = `${SRC_DIR}/node_modules/.cade-built`;
  if (!existsSync(stamp) || readFileSync(stamp, "utf8").trim() !== commit) {
    console.log(`Installing Cade ${version} (${commit.slice(0, 7)})…`);
    await mustRun("npm", [existsSync(`${SRC_DIR}/package-lock.json`) ? "ci" : "install", "--no-audit", "--no-fund"], { cwd: SRC_DIR });
    await mustRun("npm", ["run", "build", "--if-present"], { cwd: SRC_DIR });
    writeFileSync(stamp, `${commit}\n`);
  }

  // The Worker's name is your deployment's, not the code's.
  const { workerName } = readJson(CLOUDFLARE_FILE);
  if (workerName) {
    const file = `${SRC_DIR}/wrangler.toml`;
    writeFileSync(file, withWorkerName(readFileSync(file, "utf8"), workerName));
  }
  return commit;
}

export async function main(argv) {
  const [command, ...args] = argv;
  if (!command) throw new Error("Usage: npm run <setup|deploy|upgrade|version|config|group|…>");
  let { version, repo } = chosen();

  if (command === "version") {
    console.log(version ? `Cade ${version} (${repo})` : "No version chosen yet: run npm run setup, or npm run upgrade.");
    return 0;
  }

  const asked = command === "upgrade" ? args.find((arg) => !arg.startsWith("-")) : undefined;
  if (command === "upgrade" || !version) {
    if (command !== "upgrade" && !version) console.log("This deployment has no Cade version yet.");
    version = await pickVersion(repo, asked ?? process.env.CADE_VERSION);
    writeJson(VERSION_FILE, { ...readJson(VERSION_FILE), version });
    console.log(`Using Cade ${version}; saved in .cade/version.json, so commit it.`);
  }

  const commit = await prepare({ version, repo }, { refresh: isLatest(version) && REFRESHING.has(command) });
  if (command === "upgrade") {
    // Upgrading is the version change plus the deploy of it, which setup also does itself.
    console.log(`\nCade ${version} (${commit.slice(0, 7)}) is ready. Deploy it with npm run deploy;`);
    console.log("run npm run slack:update and npm run google:update too if its release notes say the Slack app or the Google script changed.");
    return 0;
  }
  const script = command;
  const passed = args.length ? ["--", ...args] : [];
  const env = { ...process.env, CADE_DEPLOY_DIR: DEPLOY_DIR };
  return (await run("npm", ["run", script, ...passed], { cwd: SRC_DIR, env })).code;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(error.message);
      process.exit(1);
    },
  );
}
