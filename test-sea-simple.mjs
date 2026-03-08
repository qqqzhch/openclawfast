#!/usr/bin/env node

/**
 * Simple test script for SEA detection module
 * This script tests the core functionality without requiring vitest
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

// Simulate is-sea.ts functionality for testing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n🧪 Testing SEA Detection Module\n");

// Test 1: isSeaRuntime()
console.log("Test 1: isSeaRuntime()");
console.log("  - Normal mode (no NODE_SEA_BLOB):", process.env.NODE_SEA_BLOB ? "SEA mode" : "Normal mode");

// Test 2: getInstallRoot simulation
console.log("\nTest 2: getInstallRoot() simulation");
const argv1 = process.argv[1];
if (argv1) {
  const installRoot = path.dirname(argv1);
  console.log("  - argv[1]:", argv1);
  console.log("  - Install root:", installRoot);
} else {
  console.log("  - No argv[1], using cwd:", process.cwd());
}

// Test 3: Check environment variables
console.log("\nTest 3: Environment Variables");
console.log("  - NODE_SEA_BLOB:", process.env.NODE_SEA_BLOB || "(not set)");
console.log("  - execPath:", process.execPath);
console.log("  - cwd:", process.cwd());
console.log("  - platform:", process.platform);
console.log("  - arch:", process.arch);

// Test 4: Path resolution
console.log("\nTest 4: Path Resolution");
console.log("  - __dirname:", __dirname);
console.log("  - __filename:", __filename);

console.log("\n✅ Basic environment test complete\n");

// Now try to import the actual module
console.log("Attempting to import is-sea module...\n");

try {
  // We can't directly import .ts files, so we'll create a compiled version
  console.log("Note: Cannot directly import TypeScript files.");
  console.log("To run proper tests, first build the project:");
  console.log("  pnpm build");
  console.log("Then run:");
  console.log("  pnpm test src/infra/__tests__/is-sea.test.ts");
  
} catch (error) {
  console.error("Error:", error.message);
}
