const fs = require("fs").promises;
const path = require("path");

const OUTPUT_FILE = "ai-context.txt";

// Files and directories to ignore
const IGNORE_PATTERNS = [
  "test-verdex-api.js",
  "jest.config.js",
  "eslint.config.cjs",

  "fluent-playwright",
  "node_modules",
  "ai-context.txt",
  ".env",
  ".gitignore",
  "gather-context.js",
  ".git",
  "dist",
  "build",
  ".DS_Store",
  "*.log",
  "*.lock",
  "*.md",
  "package-lock.json",
  "template/package-lock.json",
  "template/node_modules",
];

async function shouldIgnore(filePath) {
  const normalizedPath = path.normalize(filePath);
  const relativePath = path.relative(process.cwd(), normalizedPath);

  return IGNORE_PATTERNS.some((pattern) => {
    // If the pattern includes '*', treat it like a wildcard in a regex
    if (pattern.includes("*")) {
      const escaped = pattern
        .split("*")
        .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*");
      const regex = new RegExp(escaped);
      return regex.test(relativePath);
    }

    // For directories, check if the path starts with the pattern
    if (pattern === "src" || pattern === "fluent-playwright") {
      return relativePath.startsWith(pattern);
    }

    // Otherwise, just check if the normalized path includes the pattern
    return relativePath.includes(pattern);
  });
}

async function main() {
  // Remove existing output file if it exists
  try {
    await fs.unlink(OUTPUT_FILE);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  // Start scanning from current directory
  const files = await getFilesRecursive(".");

  // Process all found files
  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      await fs.appendFile(
        OUTPUT_FILE,
        `--- Start of ${filePath} ---\n` +
          content +
          `\n--- End of ${filePath} ---\n\n`
      );
      console.log(`Processed: ${filePath}`);
    } catch (err) {
      console.warn(`Warning: Could not process ${filePath}:`, err.message);
    }
  }

  console.log(`Context file "${OUTPUT_FILE}" created successfully.`);
}

async function getFilesRecursive(dir) {
  let results = [];

  try {
    const dirEntries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of dirEntries) {
      const fullPath = path.join(dir, entry.name);

      // Check if path should be ignored
      if (await shouldIgnore(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        const subFiles = await getFilesRecursive(fullPath);
        results = results.concat(subFiles);
      } else {
        // Only process text files
        try {
          const content = await fs.readFile(fullPath, "utf8");
          results.push(fullPath);
        } catch (err) {
          // Skip binary files
          continue;
        }
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not process directory ${dir}:`, err.message);
  }

  return results;
}

main().catch((err) => {
  console.error("Error while generating context file:", err);
  process.exit(1);
});
