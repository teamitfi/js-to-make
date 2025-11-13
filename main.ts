#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * js-to-make
 * ------------------------------------------------------------
 * A Deno CLI tool that reads your package.json and generates a Makefile
 * with:
 *   - `help`   : shows all available make targets mapped from npm scripts
 *   - `install`: runs the right package manager install (npm i / pnpm i / yarn / bun)
 *   - one make target per script in package.json (colons in script names are converted to dashes)
 *   - convenience aliases: `s`→start, `d`→dev, `b`→build, `t`→test, `l`→lint, `i`→install
 *   - `ci` target: runs install + (lint?) + (build?) + (test?) if those scripts exist
 *
 * Usage:
 *   deno run --allow-read --allow-write main.ts [--force]
 *   or with deno task:
 *   deno task js-to-make [--force]
 *
 * Notes:
 *   - If a Makefile already exists and you don't pass --force, the script aborts.
 *   - Targets are created for scripts that don't start with "pre"/"post".
 */

import { parseArgs } from "jsr:@std/cli@1/parse-args";
import { join } from "jsr:@std/path@1/join";
import { exists } from "jsr:@std/fs@1/exists";

export interface PackageManager {
  pm: "npm" | "pnpm" | "yarn" | "bun";
  installCmd: string;
  runCmd: string;
}

/** Map packageManager to install/run commands */
async function detectPackageManager(
  projectRoot: string
): Promise<PackageManager> {
  // 1) Respect package.json "packageManager" field when present
  try {
    const pkgPath = join(projectRoot, "package.json");
    const pkgRaw = await Deno.readTextFile(pkgPath);
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
    // Ignore errors
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
    if (await exists(join(projectRoot, lock))) return normalizePM(pm);
  }

  // 3) Fallback
  return normalizePM("npm");
}

export function normalizePM(pm: "npm" | "pnpm" | "yarn" | "bun"): PackageManager {
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
async function readScripts(
  projectRoot: string
): Promise<Record<string, string>> {
  const pkgPath = join(projectRoot, "package.json");
  if (!(await exists(pkgPath))) {
    throw new Error("package.json not found in current directory");
  }
  const pkgRaw = await Deno.readTextFile(pkgPath);
  const pkg = JSON.parse(pkgRaw);
  return (pkg.scripts ?? {}) as Record<string, string>;
}

/** Convert an npm script name to a safe Make target (':' -> '-') */
function toMakeTarget(scriptName: string): string {
  return scriptName.replace(/:/g, "-");
}

/** Generate the Makefile text */
export function generateMakefile(
  pmInfo: PackageManager,
  scripts: Record<string, string>
): string {
  const now = new Date().toISOString();

  const entries: string[] = [];

  // Create targets for each script (skip pre*/post* lifecycle helpers)
  const scriptEntries = Object.entries(scripts)
    .filter(([name]) => !/^pre|^post/.test(name))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [name, cmd] of scriptEntries) {
    const target = toMakeTarget(name);
    entries.push(
      `# ${name} — ${cmd}\n${target}:\n\t${pmInfo.runCmd} ${name}\n`
    );
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
      entries.push(
        `# alias: ${alias} -> ${script}\n${alias}: ${toMakeTarget(script)}\n`
      );
    }
  }
  // alias for install
  entries.push(`# alias: i -> install\ni: install\n`);

  // Build help text lines
  const helpLines: string[] = [
    `\t@echo "Project Makefile (package manager: ${pmInfo.pm})"`,
    `\t@echo ""`,
    `\t@echo "Usage: make <target>"`,
    `\t@echo ""`,
    `\t@echo "Core targets:"`,
    `\t@echo "  install        Install dependencies (${pmInfo.installCmd})"`,
    `\t@echo "  ci             Install + (lint?) + (build?) + (test?)"`,
  ];

  if (scriptEntries.length) {
    helpLines.push(`\t@echo ""`);
    helpLines.push(`\t@echo "Script targets (from package.json):"`);
    for (const [name] of scriptEntries) {
      const target = toMakeTarget(name);
      helpLines.push(`\t@printf '  %-15s %s\\n' '${target}' '${name}'`);
    }
  } else {
    helpLines.push(`\t@echo "(no scripts found)"`);
  }

  helpLines.push(`\t@echo ""`);
  helpLines.push(`\t@echo "Convenience aliases:"`);
  helpLines.push(
    `\t@echo "  s->start  d->dev  b->build  t->test  l->lint  i->install"`
  );

  const phonyScripts = scriptEntries.map(([n]) => toMakeTarget(n)).join(" ");

  const ciSteps = [`\t@echo "Running CI steps..."`, `\t${pmInfo.installCmd}`];
  if (scripts["lint"]) ciSteps.push(`\t${pmInfo.runCmd} lint`);
  if (scripts["build"]) ciSteps.push(`\t${pmInfo.runCmd} build`);
  if (scripts["test"]) ciSteps.push(`\t${pmInfo.runCmd} test`);

  const header = [
    `# Auto-generated Makefile — DO NOT EDIT`,
    `# Generated by js-to-make at ${now}`,
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
    `\t${pmInfo.installCmd}`,
    ``,
    `# CI runs only the steps available in package.json (order: install -> lint? -> build? -> test?)`,
    `ci:`,
    ...ciSteps,
    ``,
  ].join("\n");

  return [header, ...entries].join("\n");
}

async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ["force", "help"],
    alias: { h: "help", f: "force" },
  });

  if (args.help) {
    console.log(`
js-to-make - Generate a Makefile from package.json

Usage:
  deno run --allow-read --allow-write main.ts [options]

Options:
  --force, -f    Overwrite existing Makefile
  --help, -h     Show this help message

The tool will:
  1. Read your package.json scripts
  2. Detect your package manager (npm, pnpm, yarn, or bun)
  3. Generate a Makefile with targets for all scripts
  4. Add convenience aliases (s->start, d->dev, etc.)
  5. Create an install and ci target
`);
    Deno.exit(0);
  }

  const cwd = Deno.cwd();
  const force = args.force;
  const outPath = join(cwd, "Makefile");

  try {
    const pm = await detectPackageManager(cwd);
    const scripts = await readScripts(cwd);
    const makefile = generateMakefile(pm, scripts);

    if ((await exists(outPath)) && !force) {
      console.error("❌ Makefile already exists. Use --force to overwrite.");
      Deno.exit(2);
    }

    await Deno.writeTextFile(outPath, makefile);
    console.log(`✅ Makefile written (${outPath}). Try: make help`);
  } catch (err) {
    console.error("❌ Error:", (err as Error).message);
    Deno.exit(1);
  }
}

// Entry point for Deno
if (import.meta.main) {
  main();
}
