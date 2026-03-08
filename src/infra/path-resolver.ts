import path from "node:path";

/**
 * Path Resolver for SEA and Normal Modes
 *
 * This class provides a centralized way to resolve paths that work correctly
 * in both SEA (Single Executable Application) and normal Node.js modes.
 * It uses the singleton pattern to ensure consistent behavior across the application.
 *
 * @class PathResolver
 *
 * @example
 * ```typescript
 * const resolver = PathResolver.getInstance();
 * const installRoot = resolver.getInstallRoot();
 * const configPath = resolver.getConfigPath();
 * ```
 */

export class PathResolver {
  private static instance: PathResolver;
  private readonly isSea: boolean;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    this.isSea = process.env.NODE_SEA_BLOB !== undefined;
  }

  /**
   * Gets the singleton instance of PathResolver.
   *
   * @returns {PathResolver} The PathResolver instance
   *
   * @example
   * ```typescript
   * const resolver = PathResolver.getInstance();
   * ```
   */
  static getInstance(): PathResolver {
    if (!PathResolver.instance) {
      PathResolver.instance = new PathResolver();
    }
    return PathResolver.instance;
  }

  /**
   * Resets the singleton instance (useful for testing).
   */
  static resetInstance(): void {
    PathResolver.instance = undefined as any;
  }

  /**
   * Checks if running in SEA mode.
   *
   * @returns {boolean} True if in SEA mode
   */
  isSeaRuntime(): boolean {
    return this.isSea;
  }

  /**
   * Gets the path to the executable or script.
   *
   * @returns {string} The binary or script path
   */
  getBinaryPath(): string {
    return this.isSea ? process.execPath : (process.argv[1] || process.execPath);
  }

  /**
   * Gets the installation root directory.
   *
   * @returns {string} The installation root directory
   */
  getInstallRoot(): string {
    const binaryPath = this.getBinaryPath();
    const binaryDir = path.dirname(path.resolve(binaryPath));

    if (this.isSea) {
      // SEA: Executable directory is the installation root
      return binaryDir;
    }

    // Check if we're in node_modules/.bin (cross-platform check)
    const scriptPath = process.argv[1];
    if (scriptPath) {
      const normalizedPath = scriptPath.replace(/\\/g, "/");
      if (normalizedPath.includes("node_modules/.bin")) {
        return path.resolve(binaryDir, "..", "..");
      }
    }

    // Otherwise assume we're in dist/ or similar
    return path.resolve(binaryDir, "..");
  }

  /**
   * Gets the path to resources directory.
   *
   * @param {string} [resourceName] - Optional resource name to append
   * @returns {string} The resources directory path
   */
  getResourcesPath(resourceName?: string): string {
    const base = this.isSea
      ? this.getInstallRoot()
      : path.join(this.getInstallRoot(), "dist");

    return resourceName ? path.join(base, resourceName) : base;
  }

  /**
   * Gets the configuration directory path.
   *
   * @returns {string} The configuration directory path
   */
  getConfigPath(): string {
    return path.join(this.getInstallRoot(), ".openclaw");
  }

  /**
   * Gets the cache directory path.
   *
   * @returns {string} The cache directory path
   */
  getCachePath(): string {
    return path.join(this.getInstallRoot(), ".cache");
  }

  /**
   * Gets the logs directory path.
   *
   * @returns {string} The logs directory path
   */
  getLogPath(): string {
    return path.join(this.getInstallRoot(), "logs");
  }

  /**
   * Gets the data directory path (for user data).
   *
   * @returns {string} The data directory path
   */
  getDataPath(): string {
    return path.join(this.getInstallRoot(), "data");
  }

  /**
   * Gets the temp directory path.
   *
   * @returns {string} The temp directory path
   */
  getTempPath(): string {
    return path.join(this.getInstallRoot(), "tmp");
  }

  /**
   * Gets the plugins directory path.
   *
   * @returns {string} The plugins directory path
   */
  getPluginsPath(): string {
    return path.join(this.getInstallRoot(), "plugins");
  }

  /**
   * Gets the skills directory path.
   *
   * @returns {string} The skills directory path
   */
  getSkillsPath(): string {
    return path.join(this.getInstallRoot(), "skills");
  }

  /**
   * Gets the models directory path.
   *
   * @returns {string} The models directory path
   */
  getModelsPath(): string {
    return path.join(this.getInstallRoot(), "models");
  }

  /**
   * Checks if running in development mode.
   *
   * @returns {boolean} True if in development mode
   */
  isDevMode(): boolean {
    if (this.isSea) {
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
   * Gets comprehensive runtime information.
   *
   * @returns {object} Runtime information object
   */
  getRuntimeInfo() {
    return {
      isSea: this.isSea,
      isDev: this.isDevMode(),
      installRoot: this.getInstallRoot(),
      binaryPath: this.getBinaryPath(),
      resourcesPath: this.getResourcesPath(),
      configPath: this.getConfigPath(),
      cachePath: this.getCachePath(),
      logPath: this.getLogPath(),
      dataPath: this.getDataPath(),
      tempPath: this.getTempPath(),
      pluginsPath: this.getPluginsPath(),
      skillsPath: this.getSkillsPath(),
      modelsPath: this.getModelsPath(),
    };
  }

  /**
   * Resolves a path relative to the installation root.
   *
   * @param {...string[]} pathSegments - Path segments to join
   * @returns {string} The resolved path
   */
  resolve(...pathSegments: string[]): string {
    return path.join(this.getInstallRoot(), ...pathSegments);
  }

  /**
   * Resolves a path relative to the resources directory.
   *
   * @param {...string[]} pathSegments - Path segments to join
   * @returns {string} The resolved path
   */
  resolveResource(...pathSegments: string[]): string {
    return path.join(this.getResourcesPath(), ...pathSegments);
  }

  /**
   * Resolves a path relative to the config directory.
   *
   * @param {...string[]} pathSegments - Path segments to join
   * @returns {string} The resolved path
   */
  resolveConfig(...pathSegments: string[]): string {
    return path.join(this.getConfigPath(), ...pathSegments);
  }
}
