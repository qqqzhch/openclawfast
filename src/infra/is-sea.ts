import path from "node:path";

/**
 * SEA (Single Executable Application) Runtime Detection and Path Resolution
 *
 * This module provides utilities for detecting whether the application is running
 * in SEA mode and provides unified path resolution that works in both SEA and
 * normal Node.js modes.
 *
 * @module is-sea
 */

/**
 * Detects whether the application is running in SEA (Single Executable Application) mode.
 *
 * In SEA mode, Node.js sets the NODE_SEA_BLOB environment variable.
 *
 * @returns {boolean} True if running in SEA mode, false otherwise
 *
 * @example
 * ```typescript
 * if (isSeaRuntime()) {
 *   console.log("Running as standalone executable");
 * } else {
 *   console.log("Running with Node.js");
 * }
 * ```
 */
export function isSeaRuntime(): boolean {
  return process.env.NODE_SEA_BLOB !== undefined;
}

/**
 * Gets the installation root directory.
 *
 * In SEA mode: Returns the directory containing the executable.
 * In normal mode: Returns the project root directory (parent of dist/).
 *
 * @returns {string} The installation root directory
 *
 * @example
 * ```typescript
 * const root = getInstallRoot();
 * console.log("Installation root:", root);
 * // SEA: "/usr/local/bin"
 * // Normal: "/path/to/openclaw"
 * ```
 */
export function getInstallRoot(): string {
  if (isSeaRuntime()) {
    // SEA: Executable directory is the installation root
    return path.dirname(process.execPath);
  }

  // Normal mode: Script directory's parent is project root
  const scriptPath = process.argv[1];
  if (!scriptPath) {
    // Fallback to current working directory if argv[1] is not available
    return process.cwd();
  }

  // Typically: node_modules/.bin/openclaw -> ../../ (project root)
  // Or: dist/cli.js -> .. (project root)
  const scriptDir = path.dirname(path.resolve(scriptPath));

  // Check if we're in node_modules/.bin (cross-platform check)
  const normalizedPath = scriptPath.replace(/\\/g, "/");
  if (normalizedPath.includes("node_modules/.bin")) {
    return path.resolve(scriptDir, "..", "..");
  }

  // Otherwise assume we're in dist/ or similar
  return path.resolve(scriptDir, "..");
}

/**
 * Gets the path to resources directory.
 *
 * In SEA mode: Returns the directory alongside the executable.
 * In normal mode: Returns the dist/ directory in the project root.
 *
 * @param {string} [resourceName] - Optional resource name to append to the path
 * @returns {string} The resources directory path
 *
 * @example
 * ```typescript
 * const resPath = getResourcesPath();
 * // SEA: "/usr/local/bin"
 * // Normal: "/path/to/openclaw/dist"
 *
 * const templatesPath = getResourcesPath("templates");
 * // SEA: "/usr/local/bin/templates"
 * // Normal: "/path/to/openclaw/dist/templates"
 * ```
 */
export function getResourcesPath(resourceName?: string): string {
  const base = isSeaRuntime()
    ? path.dirname(process.execPath)
    : path.join(getInstallRoot(), "dist");

  return resourceName ? path.join(base, resourceName) : base;
}

/**
 * Gets the configuration directory path.
 *
 * @returns {string} The configuration directory path
 *
 * @example
 * ```typescript
 * const configDir = getConfigPath();
 * // Returns: "<installRoot>/.openclaw"
 * ```
 */
export function getConfigPath(): string {
  return path.join(getInstallRoot(), ".openclaw");
}

/**
 * Gets the cache directory path.
 *
 * @returns {string} The cache directory path
 *
 * @example
 * ```typescript
 * const cacheDir = getCachePath();
 * // Returns: "<installRoot>/.cache"
 * ```
 */
export function getCachePath(): string {
  return path.join(getInstallRoot(), ".cache");
}

/**
 * Gets the logs directory path.
 *
 * @returns {string} The logs directory path
 *
 * @example
 * ```typescript
 * const logsDir = getLogPath();
 * // Returns: "<installRoot>/logs"
 * ```
 */
export function getLogPath(): string {
  return path.join(getInstallRoot(), "logs");
}

/**
 * Detects whether the application is running in development mode.
 *
 * Development mode is detected by checking if the entry point is a .ts file
 * in the src/ directory.
 *
 * In SEA mode, this always returns false.
 *
 * @returns {boolean} True if in development mode, false otherwise
 *
 * @example
 * ```typescript
 * if (isDevMode()) {
 *   console.log("Development mode - using TypeScript source");
 * } else {
 *   console.log("Production mode - using compiled JavaScript");
 * }
 * ```
 */
export function isDevMode(): boolean {
  if (isSeaRuntime()) {
    // SEA is always production mode
    return false;
  }

  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  const normalized = entry.replaceAll("\\", "/");
  return normalized.includes("/src/") && normalized.endsWith(".ts");
}

/**
 * Gets the path to the executable or script.
 *
 * In SEA mode: Returns the executable path (process.execPath).
 * In normal mode: Returns the script path (process.argv[1]) or falls back to execPath.
 *
 * @returns {string} The binary or script path
 *
 * @example
 * ```typescript
 * const binaryPath = getBinaryPath();
 * // SEA: "/usr/local/bin/openclaw"
 * // Normal: "/path/to/openclaw/dist/cli.js"
 * ```
 */
export function getBinaryPath(): string {
  return isSeaRuntime() ? process.execPath : (process.argv[1] || process.execPath);
}

/**
 * Gets information about the current runtime environment.
 *
 * @returns {object} Runtime information object
 *
 * @example
 * ```typescript
 * const info = getRuntimeInfo();
 * console.log(info);
 * // {
 * //   isSea: true,
 * //   isDev: false,
 * //   installRoot: "/usr/local/bin",
 * //   binaryPath: "/usr/local/bin/openclaw",
 * //   resourcesPath: "/usr/local/bin",
 * //   configPath: "/usr/local/bin/.openclaw"
 * // }
 * ```
 */
export function getRuntimeInfo() {
  return {
    isSea: isSeaRuntime(),
    isDev: isDevMode(),
    installRoot: getInstallRoot(),
    binaryPath: getBinaryPath(),
    resourcesPath: getResourcesPath(),
    configPath: getConfigPath(),
    cachePath: getCachePath(),
    logPath: getLogPath(),
  };
}
