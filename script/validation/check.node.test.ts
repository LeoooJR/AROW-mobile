/** @jest-environment node */
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { checkValidation } from "./check";

let root: string;
function put(path: string, value: string) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), value);
}
const flow = (body: string) =>
  `appId: example\nname: Test feature\ntags: [feature]\n---\n${body}\n`;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "arow-validation-"));
  execFileSync("git", ["init", "--quiet", root]);
  put(
    ".maestro/config.yaml",
    "flows: [journeys/*, features/*]\nexecutionOrder:\n  flowsOrder: [Test feature]\n",
  );
  put(".maestro/features/test.yaml", flow("- assertVisible: Ready"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

test("accepts categorized flows and local untracked experiments", () => {
  put("script/local/broken.ts", "this is intentionally not TypeScript");
  expect(checkValidation(root)).toEqual([]);
});
test("rejects malformed YAML and dangling ordered names", () => {
  put(".maestro/features/test.yaml", "appId: [");
  expect(checkValidation(root).join("\n")).toMatch(/Invalid YAML/);
  expect(checkValidation(root).join("\n")).toMatch(/Unknown ordered flow/);
});

test("rejects misplaced flows and mismatched category tags", () => {
  put(".maestro/tests/old.yaml", flow("- assertVisible: Ready"));
  put(".maestro/journeys/wrong.yaml", flow("- assertVisible: Ready"));
  const errors = checkValidation(root).join("\n");
  expect(errors).toMatch(/Use journeys, features, subflows, or setup/);
  expect(errors).toMatch(/journey tag/);
});

test("allows deliberate setup inclusion without discovering reusable units", () => {
  put(
    ".maestro/setup/provider.yaml",
    "appId: example\nname: Prepare provider\ntags: [setup]\n---\n- assertVisible: Settings\n",
  );
  put(
    ".maestro/config.yaml",
    "flows: [journeys/*, features/*, setup/provider.yaml]\nexecutionOrder:\n  flowsOrder: [Prepare provider, Test feature]\n",
  );
  expect(checkValidation(root)).toEqual([]);
});
test("rejects missing runFlow references inside hooks and nested commands", () => {
  put(
    ".maestro/features/test.yaml",
    flow(
      "- runFlow:\n    when:\n      visible: Ready\n    commands:\n      - runFlow:\n          file: ../subflows/missing.yaml",
    ),
  );
  expect(checkValidation(root).join("\n")).toMatch(
    /Missing or external runFlow/,
  );
});
test("rejects a cycle in reusable flows", () => {
  put(".maestro/subflows/a.yaml", "appId: example\n---\n- runFlow: b.yaml\n");
  put(".maestro/subflows/b.yaml", "appId: example\n---\n- runFlow: a.yaml\n");
  expect(checkValidation(root).join("\n")).toMatch(/Cyclic/);
});
test("rejects helpers discovered as independent tests", () => {
  put(
    ".maestro/config.yaml",
    "flows: ['**']\nexecutionOrder:\n  flowsOrder: [Test feature]\n",
  );
  expect(checkValidation(root).join("\n")).toMatch(/never discover subflows/);
});
test("rejects hidden recovery in shared preparation", () => {
  put(
    ".maestro/subflows/start.yaml",
    "appId: example\n---\n- retry:\n    maxRetries: 2\n    commands:\n      - tapOn: Réessayer\n",
  );
  expect(checkValidation(root).join("\n")).toMatch(/must not retry/);
});
test("rejects task-local scripts even when force-added to Git", () => {
  put(".gitignore", "script/local/*\n!script/local/.gitkeep\n");
  put("script/local/.gitkeep", "");
  put("script/local/probe.sh", "exit 0\n");
  execFileSync("git", ["-C", root, "add", "-f", "script/local"]);
  expect(checkValidation(root).join("\n")).toMatch(/must not be tracked/);
});
test("rejects documentation links to missing flows or private scripts", () => {
  put(
    "docs/testing.md",
    "[old](../.maestro/tests/gone.yaml) [local](../script/local/probe.sh)",
  );
  expect(
    checkValidation(root).filter((error) => error.includes("validation link")),
  ).toHaveLength(2);
});
test("the local workspace is ignored by Git while its placeholder is retained", () => {
  put(".gitignore", readFileSync(".gitignore", "utf8"));
  const ignored = execFileSync(
    "git",
    ["-C", root, "check-ignore", "--no-index", "--stdin"],
    {
      input:
        "script/local/.gitkeep\nscript/local/probe.ts\nscript/local/nested/probe.sh\nscript/build_dev_client.sh\n",
      encoding: "utf8",
    },
  );
  expect(ignored.trim().split("\n")).toEqual([
    "script/local/probe.ts",
    "script/local/nested/probe.sh",
  ]);
});
