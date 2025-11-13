/**
 * generate-makefile.ts
 * ------------------------------------------------------------
 * A tiny helper that reads your package.json and generates a Makefile
 * with:
 *   - `help`   : shows all available make targets mapped from npm scripts
 *   - `install`: runs the right package manager install (npm i / pnpm i / yarn / bun)
 *   - one make target per script in package.json (colons in script names are converted to dashes)
 *   - convenience aliases: `s`→start, `d`→dev, `b`→build, `t`→test, `l`→lint, `i`→install
 *   - `ci` target: runs install + (lint?) + (build?) + (test?) if those scripts exist
 *
 * Usage
 *   1) npx tsx generate-makefile.ts               # or: npx ts-node generate-makefile.ts
 *      (adds/overwrites ./Makefile)
 *   2) make help
 *   3) make <target>
 *
 * Notes
 *   - If a Makefile already exists and you don't pass --force, the script aborts.
 *   - Targets are created for scripts that don't start with "pre"/"post".
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/** Map packageManager to install/run commands */
function detectPackageManager(projectRoot: string): {
  pm: "npm" | "pnpm" | "yarn" | "bun";
  installCmd: string;
  runCmd: string;
} {
  // 1) Respect package.json "packageManager" field when present
  try {
    const pkgRaw = fs.readFileSync(
      path.join(projectRoot, "package.json"),
      "utf8",
    );
    const pkg = JSON.parse(pkgRaw);
    if (typeof pkg.packageManager === "string") {
      const name = String(pkg.packageManager).split("@")[0] as
        | "npm"
        | "pnpm"
        | "yarn"
        | "bun";
      return normalizePM(name);
    }
  } catch {
    // Ignore and fall back to lockfile detection
  }

  // 2) Detect by lockfile
  const lockToPM: Array<[string, "npm" | "pnpm" | "yarn" | "bun"]> = [
    ["package-lock.json", "npm"],
    ["npm-shrinkwrap.json", "npm"],
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
  ];
  for (const [lock, pm] of lockToPM) {
    if (fs.existsSync(path.join(projectRoot, lock))) return normalizePM(pm);
  }

  // 3) Fallback
  return normalizePM("npm");
}

function normalizePM(pm: "npm" | "pnpm" | "yarn" | "bun") {
  switch (pm) {
    case "pnpm":
      return { pm, installCmd: "pnpm install", runCmd: "pnpm run" };
    case "yarn":
      // Yarn v1 uses `yarn` / `yarn run`. This works for modern Yarn via corepack too.
      return { pm, installCmd: "yarn", runCmd: "yarn run" };
    case "bun":
      return { pm, installCmd: "bun install", runCmd: "bun run" };
    case "npm":
    default:
      return { pm: "npm", installCmd: "npm i", runCmd: "npm run" };
  }
}

/** Read package.json scripts */
function readScripts(projectRoot: string): Record<string, string> {
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error("package.json not found in current directory");
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  return (pkg.scripts ?? {}) as Record<string, string>;
}

/** Convert an npm script name to a safe Make target (':' -> '-') */
function toMakeTarget(scriptName: string) {
  return scriptName.replace(/:/g, "-");
}

/** Generate the Makefile text */
function generateMakefile(
  pmInfo: { pm: string; installCmd: string; runCmd: string },
  scripts: Record<string, string>,
) {
  const now = new Date().toISOString();

  const entries: string[] = [];

  // Create targets for each script (skip pre*/post* lifecycle helpers)
  const scriptEntries = Object.entries(scripts)
    .filter(([name]) => !/^pre|^post/.test(name))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [name, cmd] of scriptEntries) {
    const target = toMakeTarget(name);
    entries.push([
      `# ${name} — ${cmd}`,
      `${target}:`,
      `	${pmInfo.runCmd} ${name}`,
      "",
    ].join("\n"));
  }

  // Convenience aliases (only emit if the underlying script exists)
  const aliasMap: Array<[string, string]> = [
    ["s", "start"],
    ["d", "dev"],
    ["b", "build"],
    ["t", "test"],
    ["l", "lint"],
  ];
  for (const [alias, script] of aliasMap) {
    if (scripts[script]) {
      entries.push([
        `# alias: ${alias} -> ${script}`,
        `${alias}: ${toMakeTarget(script)}`,
        "",
      ].join("\n"));
    }
  }
  // alias for install
  entries.push([
    `# alias: i -> install`,
    `i: install`,
    "",
  ].join("\n"));

  // Build help text lines
  const helpLines: string[] = [
    `@echo \"Project Makefile (package manager: ${pmInfo.pm})\"`,
    `@echo \"\"`,
    `@echo \"Usage: make <target>\"`,
    `@echo \"\"`,
    `@echo \"Core targets:\"`,
    `@echo \"  install        Install dependencies (${pmInfo.installCmd})\"`,
    `@echo \"  ci             Install + (lint?) + (build?) + (test?)\"`,
  ];
  if (scriptEntries.length) {
    helpLines.push(`@echo \"\"`);
    helpLines.push(`@echo \"Script targets (from package.json):\"`);
    for (const [name] of scriptEntries) {
      const target = toMakeTarget(name);
      helpLines.push(`@printf '%-15s %s\n' '${target}' '${name}'`);
    }
  } else {
    helpLines.push(`@echo \"(no scripts found)\"`);
  }
  helpLines.push(`@echo \"\"`);
  helpLines.push(`@echo \"Convenience aliases:\"`);
  helpLines.push(
    `@echo \"  s->start  d->dev  b->build  t->test  l->lint  i->install\"`,
  );

  const phonyScripts = scriptEntries.map(([n]) => toMakeTarget(n)).join(" ");
  const header = [
    `# Auto-generated Makefile — DO NOT EDIT`,
    `# Generated by generate-makefile.ts at ${now}`,
    `SHELL := /bin/bash`,
    `PKG_MANAGER := ${pmInfo.pm}`,
    `RUN := ${pmInfo.runCmd}`,
    `INSTALL := ${pmInfo.installCmd}`,
    ``,
    `.PHONY: help install ci i s d b t l ${phonyScripts}`,
    ``,
    `help:`,
    ...helpLines,
    ``,
    `install:`,
    `	${pmInfo.installCmd}`,
    ``,
    `# CI runs only the steps available in package.json (order: install -> lint? -> build? -> test?)`,
    `ci:`,
    `	@echo \"Running CI steps...\"`,
    `	${pmInfo.installCmd}`,
    scripts["lint"] ? `	${pmInfo.runCmd} lint` : "",
    scripts["build"] ? `	${pmInfo.runCmd} build` : "",
    scripts["test"] ? `	${pmInfo.runCmd} test` : "",
    ``,
  ].filter(Boolean).join("\n");

  return [header, ...entries].join("\n");
}

function main() {
  const cwd = process.cwd();
  const args = new Set(process.argv.slice(2));
  const force = args.has("--force");
  const outPath = path.join(cwd, "Makefile");

  const pm = detectPackageManager(cwd);
  const scripts = readScripts(cwd);
  const makefile = generateMakefile(pm, scripts);

  if (fs.existsSync(outPath) && !force) {
    console.error("Makefile already exists. Use --force to overwrite.");
    process.exit(2);
  }

  fs.writeFileSync(outPath, makefile, "utf8");
  console.log(`✅ Makefile written (${outPath}). Try: make help`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error("Error:", (err as Error).message);
    process.exit(1);
  }
}
