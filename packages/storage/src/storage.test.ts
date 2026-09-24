import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { strToU8, zipSync } from "fflate";

const tmp = mkdtempSync(path.join(tmpdir(), "foundry-storage-"));
process.env.DATA_DIR = tmp;

const storage = await import("./index");
const { normalizeRelativePath, UnsafePathError } = storage;

describe("normalizeRelativePath", () => {
  test("cleans harmless paths", () => {
    assert.equal(normalizeRelativePath("./src//a\\b.ts"), "src/a/b.ts");
    assert.equal(normalizeRelativePath(""), "");
  });

  test("rejects traversal and absolute paths", () => {
    for (const p of ["../x", "a/../../x", "/etc/passwd", "C:/win", "a\0b"]) {
      assert.throws(() => normalizeRelativePath(p), UnsafePathError, p);
    }
  });
});

describe("snapshots", () => {
  before(() => {});
  after(() => rmSync(tmp, { recursive: true, force: true }));

  test("extracts a zip, strips the common root and ignores junk", async () => {
    const zip = zipSync({
      "repo-main/README.md": strToU8("# Hello"),
      "repo-main/src/index.ts": strToU8("export const x = 1;"),
      "repo-main/node_modules/dep/index.js": strToU8("junk"),
      "repo-main/.git/HEAD": strToU8("ref"),
    });
    const res = await storage.writeSnapshotFromZip("snap1", zip);
    assert.equal(res.fileCount, 2);
    assert.deepEqual(await storage.listAllFiles("snap1"), ["README.md", "src/index.ts"]);

    const root = await storage.statPath("snap1", "");
    assert.equal(root?.type, "dir");
    assert.deepEqual(
      root?.type === "dir" && root.entries.map((e) => `${e.type}:${e.name}`),
      ["dir:src", "file:README.md"],
    );

    const file = await storage.readSnapshotFile("snap1", "src/index.ts");
    assert.equal(file?.text, "export const x = 1;");
    assert.equal(file?.binary, false);
  });

  test("rejects zip-slip entries", async () => {
    const zip = zipSync({ "../evil.txt": strToU8("nope") });
    await assert.rejects(storage.writeSnapshotFromZip("snap2", zip), UnsafePathError);
  });

  test("derives a new snapshot with a changed file", async () => {
    await storage.deriveSnapshot("snap1", "snap3", [{ path: "src/index.ts", data: strToU8("export const x = 2;") }]);
    assert.equal((await storage.readSnapshotFile("snap3", "src/index.ts"))?.text, "export const x = 2;");
    assert.equal((await storage.readSnapshotFile("snap1", "src/index.ts"))?.text, "export const x = 1;");
  });

  test("detects binary files", async () => {
    await storage.writeSnapshot("snap4", [{ path: "img.bin", data: new Uint8Array([1, 0, 2]) }]);
    assert.equal((await storage.readSnapshotFile("snap4", "img.bin"))?.binary, true);
  });

  test("rejects unsafe snapshot ids", () => {
    assert.throws(() => storage.snapshotDir("../x"), UnsafePathError);
  });
});
