#!/usr/bin/env node

/**
 * SEA Compatibility Scanner
 *
 * This script scans the codebase to detect potential compatibility issues
 * with SEA (Single Executable Application) mode. It checks for patterns
 * that may cause problems when running as a standalone executable.
 *
 * Usage:
 *   node scripts/check-sea-compatibility.mjs
 *
 * Add to package.json:
 *   "scripts": {
 *     "check:sea": "node scripts/check-sea-compatibility.mjs"
 *   }
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Patterns that may cause issues in SEA mode
 */
const PROBLEMATIC_PATTERNS = [
  {
    pattern: /process\.argv\[1\]/g,
    message: "Direct use of process.argv[1]. Consider using getInstallRoot() or getBinaryPath() from infra/is-sea.js",
    severity: "error",
    suggestion: "Use getInstallRoot() for finding installation directory or getBinaryPath() for executable path"
  },
  {
    pattern: /argv\[1\]/g,
    message: "Use of argv[1]. Ensure this is handled for SEA compatibility",
    severity: "warning",
    suggestion: "If this refers to process.argv[1], consider using getInstallRoot() or getBinaryPath()"
  },
  {
    pattern: /__dirname/g,
    message: "Use of __dirname. This may not work correctly in SEA mode",
    severity: "warning",
    suggestion: "Use getInstallRoot() or getResourcesPath() from infra/is-sea.js"
  },
  {
    pattern: /__filename/g,
    message: "Use of __filename. This may not work correctly in SEA mode",
    severity: "warning",
    suggestion: "Consider using getBinaryPath() from infra/is-sea.js"
  },
  {
    pattern: /path\.dirname\(process\.argv\[1\]\)/g,
    message: "Direct extraction of directory from argv[1]. Use getInstallRoot() instead",
    severity: "error",
    suggestion: "Replace with: import { getInstallRoot } from '../infra/is-sea.js'; const dir = getInstallRoot();"
  },
  {
    pattern: /path\.resolve\(path\.dirname\(process\.argv\[1\]\)/g,
    message: "Complex path resolution from argv[1]. Use getInstallRoot() instead",
    severity: "error",
    suggestion: "Use getInstallRoot() for cleaner and SEA-compatible path resolution"
  }
];

/**
 * Patterns to ignore (files or directories)
 */
const IGNORE_PATTERNS = [
  /node_modules/,
  /dist(-bin)?/,
  /\.test\.(ts|js)$/,
  /\.spec\.(ts|js)$/,
  /__tests__/,
  /is-sea\.ts$/, // This file implements SEA compatibility
  /path-resolver\.ts$/, // This file implements SEA compatibility
  /\.d\.ts$/, // Type definition files
  /scripts\/check-sea-compatibility\.mjs$/ // This script itself
];

/**
 * Scan a single file for problematic patterns
 * @param {string} filePath - Path to file
 * @param {string} rootDir - Root directory for relative paths
 * @returns {{ file: string, relativePath: string, issues: Array }} Scan result
 */
function scanFile(filePath, rootDir) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues = [];

  for (const { pattern, message, severity, suggestion } of PROBLEMATIC_PATTERNS) {
    const matches = content.matchAll(pattern);

    for (const match of matches) {
      // Calculate line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split("\n").length;

      // Calculate column (approximate)
      const lastNewlineIndex = beforeMatch.lastIndexOf("\n");
      const columnNumber = match.index - lastNewlineIndex;

      issues.push({
        line: lineNumber,
        column: columnNumber,
        code: match[0],
        message,
        severity,
        suggestion
      });
    }
  }

  return {
    file: filePath,
    relativePath: relative(rootDir, filePath),
    issues
  };
}

/**
 * Recursively walk directory and find all source files
 * @param {string} dir - Directory to walk
 * @param {string} rootDir - Root directory for relative paths
 * @returns {string[]} List of file paths
 */
function walkDirectory(dir, rootDir) {
  const files = [];

  function walk(currentDir) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const relativePath = relative(rootDir, fullPath);

      // Skip ignored patterns
      if (IGNORE_PATTERNS.some(p => p.test(relativePath))) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && /\.(ts|js|mjs|cjs)$/.test(entry)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Format output with colors (if terminal supports it)
 * @param {string} text - Text to format
 * @param {string} color - Color name
 * @returns {string} Formatted text
 */
function formatOutput(text, color) {
  const colors = {
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
    bold: "\x1b[1m"
  };

  if (process.stdout.isTTY) {
    return `${colors[color] || ""}${text}${colors.reset}`;
  }
  return text;
}

/**
 * Main function
 */
function main() {
  // Determine source directory
  const scriptDir = __dirname;
  const rootDir = join(scriptDir, "..");
  const srcDir = join(rootDir, "src");

  if (!existsSync(srcDir)) {
    console.error(formatOutput("Error: src/ directory not found", "red"));
    process.exit(1);
  }

  console.log(formatOutput("\n🔍 SEA Compatibility Scanner\n", "cyan"));
  console.log(`Scanning: ${srcDir}\n`);

  // Find all source files
  const files = walkDirectory(srcDir, rootDir);
  console.log(`Found ${files.length} source files to scan\n`);

  // Scan each file
  const results = [];
  for (const file of files) {
    const result = scanFile(file, rootDir);
    if (result.issues.length > 0) {
      results.push(result);
    }
  }

  // Count totals
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    for (const issue of result.issues) {
      if (issue.severity === "error") {
        totalErrors++;
      } else {
        totalWarnings++;
      }
    }
  }

  // Print results
  if (results.length === 0) {
    console.log(formatOutput("✅ No SEA compatibility issues found!\n", "green"));
    process.exit(0);
  }

  // Print summary
  console.log(formatOutput("📊 Summary\n", "bold"));
  console.log(`  Files with issues: ${results.length}`);
  console.log(`  ${formatOutput(`Errors: ${totalErrors}`, totalErrors > 0 ? "red" : "green")}`);
  console.log(`  ${formatOutput(`Warnings: ${totalWarnings}`, totalWarnings > 0 ? "yellow" : "green")}`);
  console.log();

  // Print detailed results
  for (const result of results) {
    console.log(formatOutput(`\n📄 ${result.relativePath}`, "cyan"));

    // Sort issues by line number
    result.issues.sort((a, b) => a.line - b.line);

    for (const issue of result.issues) {
      const icon = issue.severity === "error" ? "❌" : "⚠️ ";
      const severityText = issue.severity === "error" 
        ? formatOutput("[ERROR]", "red")
        : formatOutput("[WARN]", "yellow");

      console.log(`  ${icon} ${severityText} Line ${issue.line}${issue.column ? `:${issue.column}` : ""}`);
      console.log(`     Code: ${issue.code}`);
      console.log(`     ${issue.message}`);
      if (issue.suggestion) {
        console.log(`     ${formatOutput("Suggestion:", "cyan")} ${issue.suggestion}`);
      }
    }
  }

  // Print footer
  console.log(formatOutput("\n\n📚 Resources\n", "bold"));
  console.log("  - SEA Documentation: src/infra/is-sea.ts");
  console.log("  - Path Resolver: src/infra/path-resolver.ts");
  console.log("  - Developer Guide: SEA-CLI支持说明.md");
  console.log("  - Development Plan: SEA方案一开发规划.md");
  console.log();

  // Exit with appropriate code
  if (totalErrors > 0) {
    console.log(formatOutput("❌ SEA compatibility check failed with errors\n", "red"));
    process.exit(1);
  } else {
    console.log(formatOutput("⚠️  SEA compatibility check passed with warnings\n", "yellow"));
    process.exit(0);
  }
}

// Run main function
main();
