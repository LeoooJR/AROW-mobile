/** @jest-environment node */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";
import { checkArchitecture } from "./check";

function inspect(files: Readonly<Record<string, string>>) {
  const root = mkdtempSync(join(tmpdir(), "arow-architecture-"));
  try {
    writeFileSync(
      join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          allowJs: true,
          moduleResolution: "bundler",
          module: "preserve",
          paths: {
            "@/*": ["./src/*"],
            "@shared/*": ["./shared/*"],
            "@leak/*": ["./src/*"],
          },
        },
        include: [
          "**/*.ts",
          "**/*.tsx",
          "**/*.js",
          "**/*.jsx",
          "**/*.mts",
          "**/*.cts",
          "**/*.mjs",
          "**/*.cjs",
        ],
      }),
    );
    for (const [file, contents] of Object.entries(files)) {
      const destination = join(root, file);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, contents);
    }
    return checkArchitecture(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("allows shared-relative imports, aliases, re-exports, and real Node built-ins", () => {
  expect(
    inspect({
      "shared/value.ts": "export const value = 1;",
      "shared/domain/model.ts":
        'import { value } from "../value"; export { value } from "@shared/value"; import { join } from "node:path"; const fs = require("fs"); const sqlite = import("node:sqlite");',
      "shared/model.test.ts":
        'import { value } from "./value"; test("value", () => expect(value).toBe(1));',
    }),
  ).toEqual([]);
});

test.each([
  'import React from "react";',
  'import type { AppStateStatus } from "react-native";',
  'export type { AppStateStatus } from "react-native";',
  'export * from "expo";',
  'const module = require("expo-location");',
  'const module = require.resolve("expo");',
  'const module = import("expo");',
  'import module = require("expo");',
  'type Module = import("expo").Module;',
  'import "node:not-a-builtin";',
  '/// <reference types="react" />',
  '/// <reference lib="dom" />',
  '/// <reference lib="webworker" />',
])("rejects a shared framework or non-Node dependency: %s", (source) => {
  expect(inspect({ "shared/model.ts": source })).toEqual([
    expect.objectContaining({
      file: "shared/model.ts",
      line: 1,
      message: expect.stringMatching(/Shared/),
    }),
  ]);
});

test.each([
  'import { value } from "@/features/model";',
  'import type { value } from "../../src/features/model";',
  'export { value } from "@leak/features/model";',
  '/// <reference path="../../src/features/model.ts" />',
])(
  "rejects shared application imports regardless of spelling: %s",
  (source) => {
    expect(
      inspect({
        "shared/domain/model.ts": source,
        "src/features/model.ts": "export const value = 1;",
      }),
    ).toHaveLength(1);
  },
);

test.each([
  "const module = import(name);",
  "const module = require(name);",
  'const module = import("expo" + suffix);',
])("rejects unchecked computed shared dependencies: %s", (source) => {
  expect(inspect({ "shared/model.ts": source })[0]?.message).toContain(
    "string literals",
  );
});

test("checks shared tests too and reports the dependency's precise location", () => {
  const [violation] = inspect({
    "shared/model.test.ts": '\nimport type { View } from "react-native";',
  });
  expect(violation).toMatchObject({
    file: "shared/model.test.ts",
    line: 2,
    column: 27,
  });
});

test.each([
  "shared/helper.tsx",
  "shared/helper.js",
  "src/utils/helper.jsx",
  "src/utils/helper.mts",
  "src/utils/helper.test.js",
  "src/components/primitives/button/styles.ts",
  "src/components/primitives/icons/props.d.ts",
])("rejects inconsistent source extension %s", (file) => {
  expect(inspect({ [file]: "export {};" })).toEqual([
    expect.objectContaining({
      file,
      message: expect.stringContaining("Use .ts"),
    }),
  ]);
});

test("allows current utility dependencies and .tsx primitive helpers/platform variants", () => {
  expect(
    inspect({
      "src/utils/platform.ts": 'import { Platform } from "react-native";',
      "src/utils/model.test.ts": 'import type { Model } from "@/types/model";',
      "src/types/model.ts": "export interface Model {}",
      "src/components/primitives/button/styles.tsx":
        'import { tv } from "tailwind-variants";',
      "src/components/primitives/button/index.web.tsx": "export {};",
      "src/components/primitives/button/index.android.tsx": "export {};",
      "src/components/primitives/button/index.test.tsx":
        'import { render } from "@testing-library/react-native";',
    }),
  ).toEqual([]);
});

test.each([
  "src/app/route.tsx",
  "src/components/composites/card.tsx",
  "src/features/model.ts",
  "src/hooks/features/use-model.ts",
  "src/contexts/model.ts",
])("prevents primitive dependencies on %s", (target) => {
  expect(
    inspect({
      "src/components/primitives/button/index.tsx": `import type { Model } from "@/${target.slice(4).replace(/\.[^.]+$/, "")}";`,
      [target]: "export interface Model {}",
    }),
  ).toHaveLength(1);
});

test("resolves a relative primitive import before applying boundaries", () => {
  expect(
    inspect({
      "src/components/primitives/button/index.tsx":
        'export { Model } from "../../composites/model";',
      "src/components/composites/model.ts": "export class Model {}",
    }),
  ).toHaveLength(1);
});

test.each(["ui", "platform"])(
  "prevents %s hooks from importing features, domain/reference, or components",
  (role) => {
    expect(
      inspect({
        [`src/hooks/${role}/use-model.ts`]:
          'import "@/features/model"; import "@shared/railway-domain/model"; import "@shared/railway-reference/model"; import "@/components/primitives/button";',
        "src/features/model.ts": "export {};",
        "shared/railway-domain/model.ts": "export {};",
        "shared/railway-reference/model.ts": "export {};",
        "src/components/primitives/button/index.tsx": "export {};",
      }),
    ).toHaveLength(4);
  },
);

describe.each(["ui", "platform"])("%s hook feature boundaries", (role) => {
  test.each([
    'import { useModel } from "@/hooks/features/use-model";',
    'import type { Model } from "../features/use-model";',
    'export { useModel } from "@/hooks/features/use-model";',
    'const model = import("../features/use-model");',
    'const model = require("@/hooks/features/use-model");',
    'type Model = import("@/hooks/features/use-model").Model;',
  ])("rejects a feature-hook dependency: %s", (source) => {
    const file = `src/hooks/${role}/use-model.ts`;
    expect(
      inspect({
        [file]: source,
        "src/hooks/features/use-model.ts":
          "export interface Model {} export function useModel() {}",
      }),
    ).toEqual([
      expect.objectContaining({
        file,
        message: expect.stringContaining("feature hooks"),
      }),
    ]);
  });

  test("allows feature-hook dependencies in tests", () => {
    expect(
      inspect({
        [`src/hooks/${role}/use-model.test.ts`]:
          'import { useModel } from "@/hooks/features/use-model";',
        "src/hooks/features/use-model.ts": "export function useModel() {}",
      }),
    ).toEqual([]);
  });
});

test("allows UI-to-platform dependencies but prevents the reverse direction", () => {
  expect(
    inspect({
      "src/hooks/ui/use-model.ts": 'import "../platform/use-model";',
      "src/hooks/platform/use-model.ts": 'import "../ui/use-model";',
    }),
  ).toEqual([
    expect.objectContaining({ file: "src/hooks/platform/use-model.ts" }),
  ]);
});

test("allows primitive framework, adapter, utility and generic-hook dependencies", () => {
  expect(
    inspect({
      "src/components/primitives/button/index.tsx":
        'import "react"; import "expo-image"; import "@/components/adapters/control"; import "@/utils/model"; import "@/hooks/ui/use-model"; import "@/hooks/platform/use-model";',
      "src/components/adapters/control.tsx": "export {};",
      "src/utils/model.ts": "export {};",
      "src/hooks/ui/use-model.ts": "export {};",
      "src/hooks/platform/use-model.ts": "export {};",
    }),
  ).toEqual([]);
});

test.each([
  "@gluestack-ui/core/toast/creator",
  "@gluestack-ui/utils",
  "@maplibre/maplibre-react-native",
  "@maplibre/maplibre-react-native/subpath",
])("keeps %s behind its adapter", (dependency) => {
  expect(
    inspect({
      "src/features/model.ts": `export type { Model } from "${dependency}";`,
    }),
  ).toHaveLength(1);
});

test("allows adapter packages at their boundaries and existing test mocks", () => {
  expect(
    inspect({
      "src/components/adapters/toast/index.tsx":
        'import "@gluestack-ui/core/toast/creator";',
      "src/components/adapters/map/index.tsx":
        'import "@maplibre/maplibre-react-native";',
      "src/components/composites/toast.test.tsx":
        'jest.mock("@gluestack-ui/core/toast/creator", () => ({}));',
      "src/hooks/platform/use-model.test.ts": 'import "@/features/model";',
      "src/features/model.ts": "export {};",
    }),
  ).toEqual([]);
});

test("detects adapter package imports through relative paths", () => {
  expect(
    inspect({
      "src/features/model.ts":
        'import "../../node_modules/@gluestack-ui/example/index"; export * from "../../node_modules/@maplibre/maplibre-react-native/index";',
      "node_modules/@gluestack-ui/example/index.ts": "export {};",
      "node_modules/@maplibre/maplibre-react-native/index.ts": "export {};",
    }),
  ).toHaveLength(2);
});

test("does not overlook source files in an ordinary folder named build", () => {
  expect(inspect({ "shared/build/helper.js": "export {};" })).toHaveLength(1);
});

test("does not treat nested node_modules as shared source", () => {
  expect(
    inspect({
      "shared/model.ts": 'import "./node_modules/react/index";',
      "shared/node_modules/react/index.ts": "export {};",
    }),
  ).toHaveLength(1);
});

test("the standalone shared compiler excludes framework, browser, and Jest ambient globals", () => {
  const config = ts.readConfigFile(
    resolve("tsconfig.shared.json"),
    ts.sys.readFile,
  );
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    process.cwd(),
  );
  const file = resolve("shared/__ambient-check.ts");
  const host = ts.createCompilerHost(parsed.options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (
    name,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) =>
    name === file
      ? ts.createSourceFile(
          name,
          "export const browser = window; export const dom = document; export const test = jest; export type Element = React.ReactNode;",
          ts.ScriptTarget.Latest,
        )
      : getSourceFile(
          name,
          languageVersion,
          onError,
          shouldCreateNewSourceFile,
        );
  const program = ts.createProgram([file], parsed.options, host);
  const errors = ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    )
    .join("\n");
  expect(errors).toContain("window");
  expect(errors).toContain("document");
  expect(errors).toContain("jest");
  expect(errors).toContain("React");
});
