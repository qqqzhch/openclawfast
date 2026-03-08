#!/usr/bin/env node

/**
 * SEA (Single Executable Application) Build Script
 * 
 * This script builds OpenClaw CLI as a standalone executable using Node.js SEA.
 * 
 * Prerequisites:
 * - Node.js 20+ (for SEA support)
 * - pnpm installed
 * 
 * Usage:
 *   node scripts/build-sea.mjs [--platform=win32|darwin|linux] [--arch=x64|arm64]
 * 
 * Options:
 *   --platform   Target platform (default: current platform)
 *   --arch       Target architecture (default: current architecture)
 *   --output     Output directory (default: dist-sea)
 *   --version    Include version in output filename
 * 
 * Environment Variables:
 *   SEA_PLATFORM   Override target platform
 *   SEA_ARCH       Override target architecture
 */

import { createRequire } from "node:module";
import { execSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  statSync,
} from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { platform, arch, homedir, tmpdir } from "node:os";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : null;
};

// Configuration
const config = {
  platform: getArg("platform") || process.env.SEA_PLATFORM || platform(),
  arch: getArg("arch") || process.env.SEA_ARCH || arch(),
  outputDir: getArg("output") || "dist-sea",
  includeVersion: args.includes("--version"),
  projectRoot: join(__dirname, ".."),
};

// Validate platform
const validPlatforms = ["win32", "darwin", "linux"];
if (!validPlatforms.includes(config.platform)) {
  console.error(`Error: Invalid platform "${config.platform}"`);
  console.error(`Valid platforms: ${validPlatforms.join(", ")}`);
  process.exit(1);
}

// Validate architecture
const validArchs = ["x64", "arm64"];
if (!validArchs.includes(config.arch)) {
  console.error(`Error: Invalid architecture "${config.arch}"`);
  console.error(`Valid architectures: ${validArchs.join(", ")}`);
  process.exit(1);
}

// Utility functions
function exec(command, options = {}) {
  console.log(`Executing: ${command}`);
  try {
    return execSync(command, {
      stdio: "inherit",
      cwd: config.projectRoot,
      ...options,
    });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    throw error;
  }
}

function getPackageInfo() {
  const packageJsonPath = join(config.projectRoot, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  return {
    name: packageJson.name,
    version: packageJson.version,
    bin: packageJson.bin,
  };
}

function getExecutableName() {
  const pkg = getPackageInfo();
  const baseName = typeof pkg.bin === "string" 
    ? basename(pkg.bin) 
    : Object.keys(pkg.bin)[0];
  
  // Add platform-specific extension
  if (config.platform === "win32") {
    return `${baseName}.exe`;
  }
  return baseName;
}

function getOutputPath() {
  const executableName = getExecutableName();
  const pkg = getPackageInfo();
  
  if (config.includeVersion) {
    const versionedName = `${basename(executableName, extname(executableName))}-${pkg.version}${extname(executableName)}`;
    return join(config.outputDir, versionedName);
  }
  
  return join(config.outputDir, executableName);
}

// Build steps
function cleanBuild() {
  console.log("\n🧹 Cleaning previous build...");
  const outputDir = join(config.projectRoot, config.outputDir);
  if (existsSync(outputDir)) {
    try {
      rmSync(outputDir, { recursive: true, force: true });
    } catch (e) {
      if (e.code === "EBUSY") {
        console.log("⚠️ Output directory is locked, skipping clean...");
      } else {
        throw e;
      }
    }
  }
  mkdirSync(outputDir, { recursive: true });
}

function buildProject() {
  console.log("\n📦 Building project...");
  exec("pnpm run build");
}

async function bundleForSEA() {
  console.log("\n📦 Bundling for SEA...");
  
  const seaEntryPath = join(config.projectRoot, "dist", "entry.js");
  const seaOutputPath = join(config.projectRoot, "dist", "sea-bundle.cjs");
  
  // Create a shim file for import.meta in CJS
  const importMetaShimPath = join(config.projectRoot, "dist", "import-meta-shim.cjs");
  const shimContent = `
// Shim for import.meta in CJS/SEA context
const { URL, pathToFileURL } = require('node:url');
const { dirname } = require('node:path');
const __globalThis__ = typeof globalThis !== 'undefined' ? globalThis : global;
__globalThis__.__import_meta_url__ = __filename ? pathToFileURL(__filename).href : '';
`;
  writeFileSync(importMetaShimPath, shimContent);
  
  // Use esbuild for bundling (already installed in project)
  const esbuild = await import("esbuild");
  
  await esbuild.build({
    entryPoints: [seaEntryPath],
    outfile: seaOutputPath,
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node22",
    external: [
      "fsevents",
      "@napi-rs/canvas",
      "@napi-rs/image",
      "better-sqlite3",
      "sharp",
      "@node-llama-cpp/*",
      "@reflink/*",
      "@snazzah/davey*",
      "ffmpeg-static",
      "node-llama-cpp",
      "playwright-core",
      "playwright",
      "chromium-bidi",
    ],
    minify: false,
    sourcemap: false,
    define: {
      "import.meta.url": "__import_meta_url__",
    },
    inject: [importMetaShimPath],
    banner: {
      js: "// OpenClaw SEA Bundle - Generated by esbuild",
    },
  });
  
  // Clean up shim
  rmSync(importMetaShimPath, { force: true });
  
  console.log(`SEA bundle created: ${seaOutputPath}`);
  return seaOutputPath;
}

function createSeaConfig(seaBundlePath) {
  console.log("\n📝 Creating SEA configuration...");
  
  const seaConfigPath = join(config.projectRoot, "sea-config.json");
  const blobPath = join(config.projectRoot, "sea-prep.blob");
  
  const seaConfig = {
    main: seaBundlePath,  // Use the single-file bundle as entry
    output: blobPath,
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    assets: {
      // Include control-ui if it exists
      ...(existsSync(join(config.projectRoot, "dist", "control-ui"))
        ? { "dist/control-ui/**/*": "dist/control-ui" }
        : {}),
    },
  };
  
  writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
  console.log(`SEA config written to: ${seaConfigPath}`);
  
  return seaConfigPath;
}

function generateBlob(seaConfigPath) {
  console.log("\n🔮 Generating SEA blob...");
  
  const nodePath = process.execPath;
  exec(`"${nodePath}" --experimental-sea-config "${seaConfigPath}"`);
}

function createExecutable() {
  console.log("\n🏗️  Creating standalone executable...");
  
  const outputPath = getOutputPath();
  const nodePath = process.execPath;
  const executablePath = join(config.projectRoot, outputPath);
  
  // Copy Node executable as base
  console.log(`Copying Node executable from: ${nodePath}`);
  copyFileSync(nodePath, executablePath);
  
  // Remove signature (macOS only)
  if (config.platform === "darwin") {
    console.log("Removing code signature...");
    exec(`codesign --remove-signature "${executablePath}"`, { stdio: "pipe" });
  }
  
  // Inject blob
  console.log("Injecting SEA blob...");
  const blobPath = join(config.projectRoot, "sea-prep.blob");
  
  if (!existsSync(blobPath)) {
    throw new Error(`SEA blob not found at: ${blobPath}`);
  }
  
  // Platform-specific blob injection
  if (config.platform === "win32") {
    // Windows: Use postject
    console.log("Injecting blob using postject...");
    exec(`npx postject "${executablePath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`);
  } else if (config.platform === "darwin") {
    // macOS: Use postject
    console.log("Injecting blob using postject...");
    exec(`npx postject "${executablePath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`);
    
    // Re-sign
    console.log("Re-signing executable...");
    exec(`codesign --sign - "${executablePath}"`, { stdio: "pipe" });
  } else {
    // Linux: Use postject
    console.log("Injecting blob using postject...");
    exec(`npx postject "${executablePath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`);
  }
  
  // Make executable (Unix-like systems)
  if (config.platform !== "win32") {
    console.log("Setting executable permissions...");
    exec(`chmod +x "${executablePath}"`, { stdio: "pipe" });
  }
  
  return executablePath;
}

function copyAssets(executablePath) {
  console.log("\n📋 Copying additional assets...");
  
  const outputDir = dirname(executablePath);
  
  // Copy control-ui if it exists
  const controlUiSrc = join(config.projectRoot, "dist", "control-ui");
  const controlUiDest = join(outputDir, "control-ui");
  
  if (existsSync(controlUiSrc)) {
    console.log("Copying control-ui...");
    mkdirSync(controlUiDest, { recursive: true });
    exec(`cp -r "${controlUiSrc}"/* "${controlUiDest}"/`);
  }
  
  // Copy README and LICENSE
  const docs = ["README.md", "LICENSE"];
  for (const doc of docs) {
    const docPath = join(config.projectRoot, doc);
    if (existsSync(docPath)) {
      copyFileSync(docPath, join(outputDir, doc));
    }
  }
}

function printSummary(executablePath) {
  const stats = statSync(executablePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log("\n✅ SEA build completed successfully!");
  console.log("\n📊 Build Summary:");
  console.log(`  Platform:      ${config.platform}`);
  console.log(`  Architecture:  ${config.arch}`);
  console.log(`  Executable:    ${executablePath}`);
  console.log(`  Size:          ${sizeMB} MB`);
  console.log(`\n🎯 Usage:`);
  console.log(`  ${executablePath} --version`);
  console.log(`  ${executablePath} doctor`);
}

// Main build process
async function main() {
  console.log("🚀 OpenClaw SEA Build Script");
  console.log(`\nBuild Configuration:`);
  console.log(`  Platform: ${config.platform}`);
  console.log(`  Architecture: ${config.arch}`);
  console.log(`  Output: ${config.outputDir}`);
  
  try {
    // Check Node.js version
    const nodeVersion = process.versions.node.split(".").map(Number);
    if (nodeVersion[0] < 20) {
      console.error("Error: Node.js 20+ is required for SEA support");
      process.exit(1);
    }
    
    // Execute build steps
    cleanBuild();
    buildProject();
    const seaBundlePath = await bundleForSEA();
    const seaConfigPath = createSeaConfig(seaBundlePath);
    generateBlob(seaConfigPath);
    const executablePath = createExecutable();
    copyAssets(executablePath);
    printSummary(executablePath);
    
    // Cleanup
    console.log("\n🧹 Cleaning up temporary files...");
    const seaConfigPath_ = join(config.projectRoot, "sea-config.json");
    const blobPath = join(config.projectRoot, "sea-prep.blob");
    const seaBundleJs = join(config.projectRoot, "dist", "sea-bundle.cjs");
    if (existsSync(seaConfigPath_)) rmSync(seaConfigPath_);
    if (existsSync(blobPath)) rmSync(blobPath);
    if (existsSync(seaBundleJs)) rmSync(seaBundleJs);
    
    console.log("\n✨ Build complete!");
    
  } catch (error) {
    console.error("\n❌ Build failed:");
    console.error(error.message);
    process.exit(1);
  }
}

// Run main
main();
