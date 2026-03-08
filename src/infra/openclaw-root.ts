import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isSeaRuntime, getInstallRoot } from "./is-sea.js";

const CORE_PACKAGE_NAMES = new Set(["openclaw"]);

async function readPackageName(dir: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(path.join(dir, "package.json"), "utf-8");
    const parsed = JSON.parse(raw) as { name?: unknown };
    return typeof parsed.name === "string" ? parsed.name : null;
  } catch {
    return null;
  }
}

function readPackageNameSync(dir: string): string | null {
  try {
    const raw = fsSync.readFileSync(path.join(dir, "package.json"), "utf-8");
    const parsed = JSON.parse(raw) as { name?: unknown };
    return typeof parsed.name === "string" ? parsed.name : null;
  } catch {
    return null;
  }
}

async function findPackageRoot(startDir: string, maxDepth = 12): Promise<string | null> {
  for (const current of iterAncestorDirs(startDir, maxDepth)) {
    const name = await readPackageName(current);
    if (name && CORE_PACKAGE_NAMES.has(name)) {
      return current;
    }
  }
  return null;
}

function findPackageRootSync(startDir: string, maxDepth = 12): string | null {
  for (const current of iterAncestorDirs(startDir, maxDepth)) {
    const name = readPackageNameSync(current);
    if (name && CORE_PACKAGE_NAMES.has(name)) {
      return current;
    }
  }
  return null;
}

function* iterAncestorDirs(startDir: string, maxDepth: number): Generator<string> {
  let current = path.resolve(startDir);
  for (let i = 0; i < maxDepth; i += 1) {
    yield current;
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
}

function candidateDirsFromArgv1(argv1: string): string[] {
  const normalized = path.resolve(argv1);
  const candidates = [path.dirname(normalized)];

  // Resolve symlinks for version managers (nvm, fnm, n, Homebrew/Linuxbrew)
  // that create symlinks in bin/ pointing to the real package location.
  try {
    const resolved = fsSync.realpathSync(normalized);
    if (resolved !== normalized) {
      candidates.push(path.dirname(resolved));
    }
  } catch {
    // realpathSync throws if path doesn't exist; keep original candidates
  }

  const parts = normalized.split(path.sep);
  const binIndex = parts.lastIndexOf(".bin");
  if (binIndex > 0 && parts[binIndex - 1] === "node_modules") {
    const binName = path.basename(normalized);
    const nodeModulesDir = parts.slice(0, binIndex).join(path.sep);
    candidates.push(path.join(nodeModulesDir, binName));
  }
  return candidates;
}

/**
 * Get candidate directories for finding OpenClaw package root in SEA mode.
 * In SEA mode, the executable is standalone, so we look for resources nearby.
 */
function candidateDirsForSea(): string[] {
  const candidates: string[] = [];
  
  // In SEA mode, getInstallRoot() returns the directory containing the executable
  const installRoot = getInstallRoot();
  candidates.push(installRoot);
  
  // Also check parent directory (might have resources bundled alongside)
  candidates.push(path.dirname(installRoot));
  
  // Check for resources directory if it exists
  const resourcesPath = path.join(installRoot, "resources");
  if (fsSync.existsSync(resourcesPath)) {
    candidates.push(resourcesPath);
  }
  
  return candidates;
}

export async function resolveOpenClawPackageRoot(opts: {
  cwd?: string;
  argv1?: string;
  moduleUrl?: string;
}): Promise<string | null> {
  for (const candidate of buildCandidates(opts)) {
    const found = await findPackageRoot(candidate);
    if (found) {
      return found;
    }
  }

  return null;
}

export function resolveOpenClawPackageRootSync(opts: {
  cwd?: string;
  argv1?: string;
  moduleUrl?: string;
}): string | null {
  for (const candidate of buildCandidates(opts)) {
    const found = findPackageRootSync(candidate);
    if (found) {
      return found;
    }
  }

  return null;
}

function buildCandidates(opts: { cwd?: string; argv1?: string; moduleUrl?: string }): string[] {
  const candidates: string[] = [];

  // In SEA mode, prioritize SEA-specific path resolution
  if (isSeaRuntime()) {
    candidates.push(...candidateDirsForSea());
  }
  
  // Also check module URL if provided (works in both modes)
  if (opts.moduleUrl) {
    candidates.push(path.dirname(fileURLToPath(opts.moduleUrl)));
  }
  
  // In normal mode, use argv1-based resolution
  // In SEA mode, this provides a fallback if SEA-specific resolution fails
  if (opts.argv1 && !isSeaRuntime()) {
    candidates.push(...candidateDirsFromArgv1(opts.argv1));
  }
  
  // Always check cwd as a fallback
  if (opts.cwd) {
    candidates.push(opts.cwd);
  }

  return candidates;
}
