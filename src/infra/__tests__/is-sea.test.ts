import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "node:path";
import {
  isSeaRuntime,
  getInstallRoot,
  getResourcesPath,
  getConfigPath,
  getCachePath,
  getLogPath,
  isDevMode,
  getBinaryPath,
  getRuntimeInfo,
} from "../is-sea.js";

describe("SEA Detection Module", () => {
  const originalEnv = process.env.NODE_SEA_BLOB;
  const originalArgv = [...process.argv];
  const originalExecPath = process.execPath;

  beforeEach(() => {
    // Reset environment
    delete process.env.NODE_SEA_BLOB;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original state
    if (originalEnv !== undefined) {
      process.env.NODE_SEA_BLOB = originalEnv;
    } else {
      delete process.env.NODE_SEA_BLOB;
    }
    process.argv = originalArgv;
    Object.defineProperty(process, "execPath", {
      value: originalExecPath,
      writable: true,
    });
  });

  describe("isSeaRuntime()", () => {
    it("should return false in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      expect(isSeaRuntime()).toBe(false);
    });

    it("should return true in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      expect(isSeaRuntime()).toBe(true);
    });

    it("should return true when NODE_SEA_BLOB is empty string", () => {
      process.env.NODE_SEA_BLOB = "";
      expect(isSeaRuntime()).toBe(true);
    });
  });

  describe("getInstallRoot()", () => {
    it("should return project root in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];

      const root = getInstallRoot();
      expect(root).toBe(path.resolve("/path/to/openclaw"));
    });

    it("should return project root when in node_modules/.bin", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/node_modules/.bin/openclaw"];

      const root = getInstallRoot();
      expect(root).toBe(path.resolve("/path/to/openclaw"));
    });

    it("should return binary directory in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      Object.defineProperty(process, "execPath", {
        value: "/usr/local/bin/openclaw",
        writable: true,
      });

      const root = getInstallRoot();
      expect(root).toBe(path.dirname("/usr/local/bin/openclaw"));
    });

    it("should return cwd when argv[1] is undefined", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node"];

      const root = getInstallRoot();
      expect(root).toBe(process.cwd());
    });
  });

  describe("getResourcesPath()", () => {
    it("should return dist directory in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];

      const resPath = getResourcesPath();
      expect(resPath).toBe(path.resolve("/path/to/openclaw/dist"));
    });

    it("should return dist/resource when resource name provided in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];

      const resPath = getResourcesPath("templates");
      expect(resPath).toBe(path.resolve("/path/to/openclaw/dist/templates"));
    });

    it("should return binary directory in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      Object.defineProperty(process, "execPath", {
        value: "/usr/local/bin/openclaw",
        writable: true,
      });

      const resPath = getResourcesPath();
      expect(resPath).toBe(path.dirname("/usr/local/bin/openclaw"));
    });

    it("should return binary/resource when resource name provided in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      Object.defineProperty(process, "execPath", {
        value: "/usr/local/bin/openclaw",
        writable: true,
      });

      const resPath = getResourcesPath("templates");
      expect(resPath).toBe(path.join(path.dirname("/usr/local/bin/openclaw"), "templates"));
    });
  });

  describe("getConfigPath()", () => {
    it("should return .openclaw directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];

      const configPath = getConfigPath();
      expect(configPath).toBe(path.resolve("/path/to/openclaw/.openclaw"));
    });

    it("should return .openclaw directory under binary directory in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      Object.defineProperty(process, "execPath", {
        value: "/usr/local/bin/openclaw",
        writable: true,
      });

      const configPath = getConfigPath();
      expect(configPath).toBe(path.join(path.dirname("/usr/local/bin/openclaw"), ".openclaw"));
    });
  });

  describe("getCachePath()", () => {
    it("should return .cache directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];

      const cachePath = getCachePath();
      expect(cachePath).toBe(path.resolve("/path/to/openclaw/.cache"));
    });
  });

  describe("getLogPath()", () => {
    it("should return logs directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];

      const logPath = getLogPath();
      expect(logPath).toBe(path.resolve("/path/to/openclaw/logs"));
    });
  });

  describe("isDevMode()", () => {
    it("should return true for .ts files in src/", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/src/cli.ts"];

      expect(isDevMode()).toBe(true);
    });

    it("should return false for .js files", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];

      expect(isDevMode()).toBe(false);
    });

    it("should return false for .ts files not in src/", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/test/test.ts"];

      expect(isDevMode()).toBe(false);
    });

    it("should return false in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      process.argv = ["node", "/path/to/openclaw/src/cli.ts"];

      expect(isDevMode()).toBe(false);
    });

    it("should return false when argv[1] is undefined", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node"];

      expect(isDevMode()).toBe(false);
    });
  });

  describe("getBinaryPath()", () => {
    it("should return argv[1] in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];

      expect(getBinaryPath()).toBe("/path/to/openclaw/dist/cli.js");
    });

    it("should return execPath when argv[1] is undefined in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node"];

      expect(getBinaryPath()).toBe(process.execPath);
    });

    it("should return execPath in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      Object.defineProperty(process, "execPath", {
        value: "/usr/local/bin/openclaw",
        writable: true,
      });

      expect(getBinaryPath()).toBe("/usr/local/bin/openclaw");
    });
  });

  describe("getRuntimeInfo()", () => {
    it("should return comprehensive runtime information in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];

      const info = getRuntimeInfo();

      expect(info.isSea).toBe(false);
      expect(info.isDev).toBe(false);
      expect(info.installRoot).toBe(path.resolve("/path/to/openclaw"));
      expect(info.binaryPath).toBe("/path/to/openclaw/dist/cli.js");
      expect(info.resourcesPath).toBe(path.resolve("/path/to/openclaw/dist"));
      expect(info.configPath).toBe(path.resolve("/path/to/openclaw/.openclaw"));
    });

    it("should return comprehensive runtime information in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      Object.defineProperty(process, "execPath", {
        value: "/usr/local/bin/openclaw",
        writable: true,
      });

      const info = getRuntimeInfo();

      expect(info.isSea).toBe(true);
      expect(info.isDev).toBe(false);
      expect(info.installRoot).toBe(path.dirname("/usr/local/bin/openclaw"));
      expect(info.binaryPath).toBe("/usr/local/bin/openclaw");
      expect(info.resourcesPath).toBe(path.dirname("/usr/local/bin/openclaw"));
      expect(info.configPath).toBe(path.join(path.dirname("/usr/local/bin/openclaw"), ".openclaw"));
    });
  });
});
