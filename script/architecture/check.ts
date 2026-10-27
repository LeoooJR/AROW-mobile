import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { isBuiltin } from "node:module";
import { join, relative, resolve, sep } from "node:path";
import ts from "typescript";

export interface ArchitectureViolation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
}

const SOURCE_EXTENSION = /\.[cm]?[jt]sx?$/;
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".expo",
  ".gradle",
  ".cxx",
  ".cache",
]);

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nativeBuild =
        entry.name === "build" && directory.endsWith(`${sep}android`);
      return IGNORED_DIRECTORIES.has(entry.name) || nativeBuild
        ? []
        : sourceFiles(file);
    }
    return SOURCE_EXTENSION.test(entry.name) ? [file] : [];
  });
}

function isWithin(file: string, directory: string): boolean {
  return file.startsWith(`${directory}/`);
}

function isTest(file: string): boolean {
  return (
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) ||
    /(^|\/)(__tests__|__mocks__)\//.test(file) ||
    isWithin(file, "src/tests")
  );
}

function dependencyViolation(
  file: string,
  target: string | undefined,
  specifier: string,
): string | undefined {
  if (isWithin(file, "shared")) {
    if (
      isBuiltin(specifier) ||
      (target !== undefined &&
        isWithin(target, "shared") &&
        !target.split("/").includes("node_modules"))
    )
      return;
    return `Shared code may import only shared modules or Node built-ins; replace "${specifier}" or move its consumer outside shared.`;
  }
  if (isTest(file)) return;

  const packageTarget = target?.split(/(?:^|\/)node_modules\//).at(-1);

  if (
    (specifier.startsWith("@gluestack-ui/") ||
      packageTarget?.startsWith("@gluestack-ui/")) &&
    !isWithin(file, "src/components/adapters")
  ) {
    return "Import Gluestack through an application component adapter.";
  }
  if (
    (specifier === "@maplibre/maplibre-react-native" ||
      specifier.startsWith("@maplibre/maplibre-react-native/") ||
      packageTarget?.startsWith("@maplibre/maplibre-react-native/")) &&
    !isWithin(file, "src/components/adapters/map")
  ) {
    return "Import MapLibre through the application map adapter.";
  }
  if (target === undefined) return;

  if (
    isWithin(file, "src/components/primitives") &&
    [
      "src/app",
      "src/components/composites",
      "src/features",
      "src/contexts",
    ].some((directory) => isWithin(target, directory))
  ) {
    return "Primitives cannot depend on routes, composites, features, feature hooks, or application contexts; pass data and callbacks through props.";
  }
  const uiHook = isWithin(file, "src/hooks/ui");
  const platformHook = isWithin(file, "src/hooks/platform");
  if (
    (uiHook || platformHook) &&
    ["src/features", "shared/railway-domain", "shared/railway-reference"].some(
      (directory) => isWithin(target, directory),
    )
  ) {
    return "UI/platform hooks cannot depend on feature implementations, feature hooks, or railway-domain/reference modules; use a feature hook or keep the logic with its owner.";
  }
  if ((uiHook || platformHook) && isWithin(target, "src/components")) {
    return "UI/platform hooks cannot depend on components.";
  }
  if (platformHook && isWithin(target, "src/hooks/ui")) {
    return "Platform hooks cannot depend on UI hooks.";
  }
}

export function checkArchitecture(
  root: string,
): readonly ArchitectureViolation[] {
  const configPath = join(root, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, "\n"),
    );
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  if (parsed.errors.length > 0)
    throw new Error(
      parsed.errors
        .map((error) =>
          ts.flattenDiagnosticMessageText(error.messageText, "\n"),
        )
        .join("\n"),
    );
  const cache = ts.createModuleResolutionCache(
    root,
    (file) => file,
    parsed.options,
  );
  const rootPath = realpathSync(root);
  const relativePath = (file: string) =>
    relative(rootPath, realpathSync(file)).split(sep).join("/");
  const violations: ArchitectureViolation[] = [];
  const files = ["shared", "src", "script", "modules"].flatMap((directory) =>
    sourceFiles(join(root, directory)),
  );

  for (const file of files) {
    const name = relative(root, file).split(sep).join("/");
    const shared = isWithin(name, "shared");
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const report = (position: number, message: string) => {
      const { line, character } =
        source.getLineAndCharacterOfPosition(position);
      violations.push({
        file: name,
        line: line + 1,
        column: character + 1,
        message,
      });
    };
    const extension = isWithin(name, "src/components/primitives")
      ? ".tsx"
      : shared || isWithin(name, "src/utils")
        ? ".ts"
        : undefined;
    if (extension !== undefined && !name.endsWith(extension))
      report(
        0,
        `Use ${extension} files in this directory, including helpers and tests.`,
      );

    const inspect = (node: ts.Node, expression: ts.Node | undefined) => {
      if (expression === undefined || !ts.isStringLiteralLike(expression)) {
        if (shared)
          report(
            node.getStart(source),
            "Shared module specifiers must be string literals so their dependencies can be checked.",
          );
        return;
      }
      const specifier = expression.text;
      const resolved = ts.resolveModuleName(
        specifier,
        file,
        parsed.options,
        ts.sys,
        cache,
      ).resolvedModule;
      const target =
        resolved === undefined
          ? undefined
          : relativePath(resolved.resolvedFileName);
      const message = dependencyViolation(name, target, specifier);
      if (message !== undefined) report(expression.getStart(source), message);
    };
    const visit = (node: ts.Node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier !== undefined
      )
        inspect(node, node.moduleSpecifier);
      else if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference)
      )
        inspect(node, node.moduleReference.expression);
      else if (ts.isImportTypeNode(node))
        inspect(
          node,
          ts.isLiteralTypeNode(node.argument)
            ? node.argument.literal
            : undefined,
        );
      else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require") ||
          (ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === "require" &&
            node.expression.name.text === "resolve"))
      )
        inspect(node, node.arguments[0]);
      ts.forEachChild(node, visit);
    };
    visit(source);
    if (shared) {
      for (const reference of source.typeReferenceDirectives) {
        if (reference.fileName !== "node")
          report(
            reference.pos,
            "Shared code may reference only Node ambient types.",
          );
      }
      for (const reference of source.referencedFiles) {
        const target = resolve(file, "..", reference.fileName);
        if (!existsSync(target) || !isWithin(relativePath(target), "shared"))
          report(
            reference.pos,
            "Shared file references must stay inside shared.",
          );
      }
      if (
        source.libReferenceDirectives.some((reference) =>
          /^(dom|webworker)/i.test(reference.fileName),
        )
      )
        report(0, "Shared code cannot reference browser libraries.");
    }
  }
  return violations;
}
