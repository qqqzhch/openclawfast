import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "node:path";
import { PathResolver } from "../path-resolver.js";

describe("PathResolver", () => {
  const originalEnv = process.env.NODE_SEA_BLOB;
  const originalArgv = [...process.argv];
  const originalExecPath = process.execPath;

  beforeEach(() => {
    // Reset environment
    delete process.env.NODE_SEA_BLOB;
    PathResolver.resetInstance();
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
    PathResolver.resetInstance();
  });

  describe("getInstance()", () => {
    it("should return singleton instance", () => {
      const instance1 = PathResolver.getInstance();
      const instance2 = PathResolver.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should create new instance after reset", () => {
      const instance1 = PathResolver.getInstance();
      PathResolver.resetInstance();
      const instance2 = PathResolver.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("isSeaRuntime()", () => {
    it("should return false in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      const resolver = PathResolver.getInstance();
      expect(resolver.isSeaRuntime()).toBe(false);
    });

    it("should return true in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      const resolver = PathResolver.getInstance();
      expect(resolver.isSeaRuntime()).toBe(true);
    });
  });

  describe("getBinaryPath()", () => {
    it("should return argv[1] in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getBinaryPath()).toBe("/path/to/openclaw/dist/cli.js");
    });

    it("should return execPath in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      Object.defineProperty(process, "execPath", {
        value: "/usr/local/bin/openclaw",
        writable: true,
      });
      const resolver = PathResolver.getInstance();

      expect(resolver.getBinaryPath()).toBe("/usr/local/bin/openclaw");
    });
  });

  describe("getInstallRoot()", () => {
    it("should return project root in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getInstallRoot()).toBe(path.resolve("/path/to/openclaw"));
    });

    it("should return project root when in node_modules/.bin", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/node_modules/.bin/openclaw"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getInstallRoot()).toBe(path.resolve("/path/to/openclaw"));
    });

    it("should return binary directory in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      const testExecPath = "/usr/local/bin/openclaw";
      Object.defineProperty(process, "execPath", {
        value: testExecPath,
        writable: true,
      });
      const resolver = PathResolver.getInstance();

      // Use path.dirname(path.resolve(...)) to match the implementation
      const expected = path.dirname(path.resolve(testExecPath));
      expect(resolver.getInstallRoot()).toBe(expected);
    });
  });

  describe("getResourcesPath()", () => {
    it("should return dist directory in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getResourcesPath()).toBe(path.resolve("/path/to/openclaw/dist"));
    });

    it("should return dist/resource with resource name in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getResourcesPath("templates")).toBe(
        path.resolve("/path/to/openclaw/dist/templates")
      );
    });

    it("should return binary directory in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      const testExecPath = "/usr/local/bin/openclaw";
      Object.defineProperty(process, "execPath", {
        value: testExecPath,
        writable: true,
      });
      const resolver = PathResolver.getInstance();

      const expected = path.dirname(path.resolve(testExecPath));
      expect(resolver.getResourcesPath()).toBe(expected);
    });

    it("should return binary/resource with resource name in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      const testExecPath = "/usr/local/bin/openclaw";
      Object.defineProperty(process, "execPath", {
        value: testExecPath,
        writable: true,
      });
      const resolver = PathResolver.getInstance();

      const expected = path.join(path.dirname(path.resolve(testExecPath)), "templates");
      expect(resolver.getResourcesPath("templates")).toBe(expected);
    });
  });

  describe("getConfigPath()", () => {
    it("should return .openclaw directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getConfigPath()).toBe(path.resolve("/path/to/openclaw/.openclaw"));
    });
  });

  describe("getCachePath()", () => {
    it("should return .cache directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getCachePath()).toBe(path.resolve("/path/to/openclaw/.cache"));
    });
  });

  describe("getLogPath()", () => {
    it("should return logs directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getLogPath()).toBe(path.resolve("/path/to/openclaw/logs"));
    });
  });

  describe("getDataPath()", () => {
    it("should return data directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getDataPath()).toBe(path.resolve("/path/to/openclaw/data"));
    });
  });

  describe("getTempPath()", () => {
    it("should return tmp directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getTempPath()).toBe(path.resolve("/path/to/openclaw/tmp"));
    });
  });

  describe("getPluginsPath()", () => {
    it("should return plugins directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getPluginsPath()).toBe(path.resolve("/path/to/openclaw/plugins"));
    });
  });

  describe("getSkillsPath()", () => {
    it("should return skills directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getSkillsPath()).toBe(path.resolve("/path/to/openclaw/skills"));
    });
  });

  describe("getModelsPath()", () => {
    it("should return models directory under install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.getModelsPath()).toBe(path.resolve("/path/to/openclaw/models"));
    });
  });

  describe("isDevMode()", () => {
    it("should return true for .ts files in src/", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/src/cli.ts"];
      const resolver = PathResolver.getInstance();

      expect(resolver.isDevMode()).toBe(true);
    });

    it("should return false for .js files", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.isDevMode()).toBe(false);
    });

    it("should return false in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      process.argv = ["node", "/path/to/openclaw/src/cli.ts"];
      const resolver = PathResolver.getInstance();

      expect(resolver.isDevMode()).toBe(false);
    });
  });

  describe("resolve()", () => {
    it("should resolve path relative to install root", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.resolve("config", "settings.json")).toBe(
        path.resolve("/path/to/openclaw/config/settings.json")
      );
    });
  });

  describe("resolveResource()", () => {
    it("should resolve path relative to resources directory", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.resolveResource("templates", "welcome.html")).toBe(
        path.resolve("/path/to/openclaw/dist/templates/welcome.html")
      );
    });
  });

  describe("resolveConfig()", () => {
    it("should resolve path relative to config directory", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      expect(resolver.resolveConfig("agent.json")).toBe(
        path.resolve("/path/to/openclaw/.openclaw/agent.json")
      );
    });
  });

  describe("getRuntimeInfo()", () => {
    it("should return comprehensive runtime information in normal mode", () => {
      delete process.env.NODE_SEA_BLOB;
      process.argv = ["node", "/path/to/openclaw/dist/cli.js"];
      const resolver = PathResolver.getInstance();

      const info = resolver.getRuntimeInfo();

      expect(info.isSea).toBe(false);
      expect(info.isDev).toBe(false);
      expect(info.installRoot).toBe(path.resolve("/path/to/openclaw"));
      expect(info.binaryPath).toBe("/path/to/openclaw/dist/cli.js");
      expect(info.resourcesPath).toBe(path.resolve("/path/to/openclaw/dist"));
      expect(info.configPath).toBe(path.resolve("/path/to/openclaw/.openclaw"));
      expect(info.cachePath).toBe(path.resolve("/path/to/openclaw/.cache"));
      expect(info.logPath).toBe(path.resolve("/path/to/openclaw/logs"));
      expect(info.dataPath).toBe(path.resolve("/path/to/openclaw/data"));
      expect(info.tempPath).toBe(path.resolve("/path/to/openclaw/tmp"));
      expect(info.pluginsPath).toBe(path.resolve("/path/to/openclaw/plugins"));
      expect(info.skillsPath).toBe(path.resolve("/path/to/openclaw/skills"));
      expect(info.modelsPath).toBe(path.resolve("/path/to/openclaw/models"));
    });

    it("should return comprehensive runtime information in SEA mode", () => {
      process.env.NODE_SEA_BLOB = "test";
      Object.defineProperty(process, "execPath", {
        value: "/usr/local/bin/openclaw",
        writable: true,
      });
      const resolver = PathResolver.getInstance();

      const info = resolver.getRuntimeInfo();
      const testExecPath = "/usr/local/bin/openclaw";
      const expectedRoot = path.dirname(path.resolve(testExecPath));

      expect(info.isSea).toBe(true);
      expect(info.isDev).toBe(false);
      expect(info.installRoot).toBe(expectedRoot);
      expect(info.binaryPath).toBe(testExecPath);
      expect(info.resourcesPath).toBe(expectedRoot);
      expect(info.configPath).toBe(path.join(expectedRoot, ".openclaw"));
      expect(info.cachePath).toBe(path.join(expectedRoot, ".cache"));
      expect(info.logPath).toBe(path.join(expectedRoot, "logs"));
      expect(info.dataPath).toBe(path.join(expectedRoot, "data"));
      expect(info.tempPath).toBe(path.join(expectedRoot, "tmp"));
      expect(info.pluginsPath).toBe(path.join(expectedRoot, "plugins"));
      expect(info.skillsPath).toBe(path.join(expectedRoot, "skills"));
      expect(info.modelsPath).toBe(path.join(expectedRoot, "models"));
    });
  });
});
