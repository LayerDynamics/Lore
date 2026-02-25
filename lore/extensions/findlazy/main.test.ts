import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { FindLazyMCPServer } from "./src/interface/mcp/server.ts";
import { CLIWriter, SilentWriter, BufferWriter, createWriter } from "./src/interface/io.ts";

Deno.test("FindLazyMCPServer can be instantiated", () => {
  const server = new FindLazyMCPServer();
  assertExists(server);
});

Deno.test("CLIWriter writes without error", () => {
  const writer = new CLIWriter({ colors: false });
  // Should not throw
  writer.write("test message", "info");
  writer.write("warning", "warn");
  writer.write("error msg", "error");
});

Deno.test("SilentWriter discards output", () => {
  const writer = new SilentWriter();
  writer.write("should be discarded");
  writer.progress(5, 10, "halfway");
});

Deno.test("BufferWriter captures output", () => {
  const writer = new BufferWriter();
  writer.write("first", "info");
  writer.write("second", "warn");

  assertEquals(writer.entries.length, 2);
  assertEquals(writer.entries[0].message, "first");
  assertEquals(writer.entries[0].level, "info");
  assertEquals(writer.entries[1].message, "second");
  assertEquals(writer.entries[1].level, "warn");

  const flushed = writer.flush();
  assertEquals(flushed, "[info] first\n[warn] second");

  writer.clear();
  assertEquals(writer.entries.length, 0);
});

Deno.test("createWriter returns SilentWriter when silent", () => {
  const writer = createWriter({ silent: true });
  assertExists(writer);
  assertEquals(writer instanceof SilentWriter, true);
});

Deno.test("createWriter returns CLIWriter by default", () => {
  const writer = createWriter();
  assertExists(writer);
  assertEquals(writer instanceof CLIWriter, true);
});
