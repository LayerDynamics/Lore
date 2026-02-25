import { join } from "@std/path";
import { exists, readFile, getCacheDir } from "../../core/fs.ts";
import { loadConfig } from "../../core/config.ts";
import { parse as parseJsonc } from "@std/jsonc";

/**
 * Latest findings resource
 */
export async function findingsResource(): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  try {
    const cacheDir = getCacheDir();
    const findingsPath = join(cacheDir, "latest-findings.json");

    if (!(await exists(findingsPath))) {
      return {
        contents: [{
          uri: "findlazy://findings/latest",
          mimeType: "application/json",
          text: JSON.stringify({ error: "No scan results available. Run a scan first." }),
        }],
      };
    }

    const content = await readFile(findingsPath);

    return {
      contents: [{
        uri: "findlazy://findings/latest",
        mimeType: "application/json",
        text: content,
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      contents: [{
        uri: "findlazy://findings/latest",
        mimeType: "application/json",
        text: JSON.stringify({ error: message }),
      }],
    };
  }
}

/**
 * Current config resource
 */
export async function configResource(): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  try {
    const config = await loadConfig(".");

    return {
      contents: [{
        uri: "findlazy://config/current",
        mimeType: "application/json",
        text: JSON.stringify(config, null, 2),
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      contents: [{
        uri: "findlazy://config/current",
        mimeType: "application/json",
        text: JSON.stringify({ error: message }),
      }],
    };
  }
}

/**
 * All patterns resource
 */
export async function patternsResource(): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  try {
    const patternsDir = join(Deno.cwd(), "patterns");
    const patterns: Record<string, unknown> = {};

    // Load common patterns
    const commonPath = join(patternsDir, "common.json");
    if (await exists(commonPath)) {
      const content = await readFile(commonPath);
      patterns.common = parseJsonc(content);
    }

    // Load TypeScript patterns
    const tsPath = join(patternsDir, "typescript.json");
    if (await exists(tsPath)) {
      const content = await readFile(tsPath);
      patterns.typescript = parseJsonc(content);
    }

    // Load Python patterns
    const pyPath = join(patternsDir, "python.json");
    if (await exists(pyPath)) {
      const content = await readFile(pyPath);
      patterns.python = parseJsonc(content);
    }

    return {
      contents: [{
        uri: "findlazy://patterns/all",
        mimeType: "application/json",
        text: JSON.stringify(patterns, null, 2),
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      contents: [{
        uri: "findlazy://patterns/all",
        mimeType: "application/json",
        text: JSON.stringify({ error: message }),
      }],
    };
  }
}
