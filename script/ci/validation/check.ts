import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";

// Keep the parser boundary unknown: malformed YAML must fail validation.
const yaml = createRequire(resolve("package.json"))("js-yaml") as {
  loadAll(source: string): unknown[];
};
const categories = ["journeys", "features", "subflows", "setup"];
const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

function files(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "artifacts" || entry.name === "local") return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function walk(value: unknown, visit: (node: Record<string, unknown>) => void) {
  if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
  else if (value !== null && typeof value === "object") {
    const node = object(value);
    visit(node);
    Object.values(node).forEach((child) => walk(child, visit));
  }
}

export function checkValidation(root: string): string[] {
  const errors: string[] = [];
  const maestro = join(root, ".maestro");
  const names = new Map<string, string>();
  const edges = new Map<string, string[]>();
  const report = (file: string, message: string) =>
    errors.push(`${relative(root, file)}: ${message}`);
  const parse = (file: string): unknown[] => {
    try {
      return yaml.loadAll(readFileSync(file, "utf8"));
    } catch (error) {
      report(file, `Invalid YAML: ${String(error)}`);
      return [];
    }
  };
  for (const file of files(maestro).filter((path) => /\.ya?ml$/.test(path))) {
    if (file === join(maestro, "config.yaml")) continue;
    const category = relative(maestro, file).split("/")[0];
    if (!categories.includes(category))
      report(file, "Use journeys, features, subflows, or setup.");
    const docs = parse(file);
    const header = object(docs[0]);
    if (
      docs.length !== 2 ||
      !Array.isArray(docs[1]) ||
      typeof header.appId !== "string"
    )
      report(file, "Expected an appId header and a command-list document.");
    if (category !== "subflows") {
      const tag =
        category === "journeys"
          ? "journey"
          : category === "features"
            ? "feature"
            : "setup";
      if (
        typeof header.name !== "string" ||
        !Array.isArray(header.tags) ||
        !header.tags.includes(tag)
      )
        report(file, `Executable flows need a name and the ${tag} tag.`);
      if (typeof header.name === "string") {
        if (names.has(header.name))
          report(file, `Duplicate flow name: ${header.name}`);
        names.set(header.name, category);
      }
    }
    const targets: string[] = [];
    walk(docs, (node) => {
      const flow = node.runFlow;
      const target = typeof flow === "string" ? flow : object(flow).file;
      if (typeof target === "string") {
        const path = resolve(dirname(file), target);
        if (!path.startsWith(`${maestro}/`) || !existsSync(path))
          report(file, `Missing or external runFlow: ${target}`);
        else targets.push(path);
      }
      // Shared preparation must fail on startup errors, not repair the app.
      if (
        category === "subflows" &&
        ("retry" in node ||
          JSON.stringify(node.tapOn ?? "").includes("Réessayer"))
      )
        report(
          file,
          "Subflows must not retry startup or press Réessayer; test recovery explicitly.",
        );
    });
    edges.set(file, targets);
  }
  const visit = (file: string, ancestors: Set<string>) => {
    if (ancestors.has(file)) {
      report(file, "Cyclic runFlow dependency.");
      return;
    }
    for (const target of edges.get(file) ?? [])
      visit(target, new Set([...ancestors, file]));
  };
  for (const file of edges.keys()) visit(file, new Set());
  const configPath = join(maestro, "config.yaml");
  const config = object(parse(configPath)[0]);
  if (
    !Array.isArray(config.flows) ||
    !config.flows.includes("journeys/*") ||
    !config.flows.includes("features/*")
  )
    report(configPath, "Discover journeys/* and features/* explicitly.");
  for (const pattern of Array.isArray(config.flows) ? config.flows : []) {
    if (pattern === "journeys/*" || pattern === "features/*") continue;
    if (
      typeof pattern !== "string" ||
      !/^setup\/[^/*]+\.yaml$/.test(pattern) ||
      !existsSync(join(maestro, pattern))
    )
      report(
        configPath,
        "Only explicit setup files may supplement journeys/features; never discover subflows.",
      );
  }
  const order = object(config.executionOrder).flowsOrder;
  if (!Array.isArray(order) || new Set(order).size !== order.length)
    report(configPath, "Provide a unique flowsOrder.");
  for (const name of Array.isArray(order) ? order : []) {
    if (typeof name !== "string" || !names.has(name))
      report(configPath, `Unknown ordered flow: ${String(name)}`);
  }
  const tracked = execFileSync(
    "git",
    ["-C", root, "ls-files", "-z", "--", "script/local"],
    { encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
  for (const file of tracked)
    if (file !== "script/local/.gitkeep")
      report(
        join(root, file),
        "Task-local scripts must not be tracked, even with git add -f.",
      );
  for (const file of [
    join(root, "README.md"),
    ...files(join(root, "docs")),
    ...files(join(root, "src")),
    ...files(maestro),
  ].filter((path) => path.endsWith(".md") && existsSync(path))) {
    for (const [, target] of readFileSync(file, "utf8").matchAll(
      /\]\(([^)#]+)(?:#[^)]*)?\)/g,
    )) {
      if (
        !target.includes(".maestro/") &&
        !file.startsWith(maestro) &&
        !target.includes("script/local/")
      )
        continue;
      if (/^(https?:|#)/.test(target)) continue;
      const path = resolve(dirname(file), target);
      if (path.includes("/script/local/") || !existsSync(path))
        report(file, `Non-portable or broken validation link: ${target}`);
    }
  }
  return errors;
}
