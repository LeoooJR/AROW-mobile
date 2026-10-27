# Component Library Context

This directory is the application-owned UI boundary. Read this file before
creating, moving, or modifying a component under `src/components`.

Keep this context about component authoring rules, boundaries and pitfalls.
Document component behavior and implementation walkthroughs elsewhere. Capture
iteration lessons as reusable instructions, not dependency snapshots or changelogs.

## What belongs here

Every extracted React component belongs under `src/components`, whether it is
shared across the application or used by one screen or domain. Route files may
keep small inline JSX; do not extract markup only to satisfy this rule.

Use this directory for:

- styled wrappers around React Native and Expo primitives;
- custom components composed from application primitives;
- stable adapters or re-exports for UI supplied by third-party packages.

Basic, unstyled layout may still import framework primitives directly. Once a
primitive has application styling, variants, behavior, or a reusable API, expose
it through this directory. Third-party UI abstractions used by application code
must also be exposed here so their package API does not spread through the app.

## Directory roles

Create role directories only when the first component for that role is added:

```text
src/components/
  primitives/   Reusable styled foundations such as Button, Text, or Card.
  composites/   Multi-element custom UI, including screen- or domain-specific UI.
  adapters/     Stable boundaries around third-party UI components.
```

Domain-specific composites may be grouped one level deeper, for example
`composites/profile/profile-header.tsx`. Organize by responsibility, not by the
package that happens to implement a component.

Dependency direction must remain one-way:

- adapters depend only on their framework or package and lightweight mappings;
- primitives may depend on React Native, Expo, and adapters;
- composites may compose primitives, adapters, and lower-level composites;
- no layer may introduce a circular dependency.

## Domain rules

- Components render UI and translate props into presentation. They must not own
  data fetching, persistence, analytics policy, route selection, or business
  workflows.
- Pass data, callbacks, and navigation destinations in through typed props.
  Navigation-aware primitives may render a supplied destination but must not
  decide where the user goes.
- Keep public props narrower than the underlying package API when the application
  does not need the full surface. Preserve accessibility and platform behavior.
- Use `Pressable` instead of legacy touchable components. In gesture-handler
  scroll containers, use the matching gesture-handler pressable when coordination
  requires it.
- Use `expo-image` rather than React Native's `Image` for application images.
- Render every string inside a `Text` component.
- Prefer controlled components. Local state is appropriate only for visual or
  interaction state that does not belong to the feature or domain.

## Styling and variants

Use NativeWind `className` for static application styling. Use `style` for values
that are genuinely dynamic at runtime or are not supported by NativeWind. Keep
complete Tailwind class tokens in source; do not construct class names such as
`bg-${color}` dynamically.

Use `tailwind-variants` only when a component exposes visual alternatives such
as named intents, sizes, boolean visual states, slots, or compound states.
Components without variants may use a plain `className` string.

When using `tailwind-variants`:

- import the default build from `tailwind-variants`;
- define the `tv` recipe at module scope, outside the component render;
- choose semantic variant names and specify `defaultVariants`;
- use `compoundVariants` or slots when styling depends on multiple public states;
- derive the public variant fields with `VariantProps<typeof componentStyles>`;
- accept `className?: string` when callers need an override and pass it to the
  recipe so caller classes are resolved last;
- do not add `tailwind-merge` only for this purpose: `tailwind-variants` 3.3's
  default build already includes conflict resolution.

## Packages and platform foundation

Check installed versions in [`package.json`](../../package.json) and the package's
documentation before changing integrations. Do not duplicate dependency-version
tables here. Follow the exact Expo SDK documentation required by `AGENTS.md`.

## Gluestack UI v5

Place manually copied Gluestack components in `src/components/adapters`;
application code must import them directly through
the `@/components/adapters/<component>` boundary rather than importing
`@gluestack-ui/*` package APIs.

Keep `GluestackUIProvider` mounted once at the application root. Treat its
application-level provider dependencies as an exception to normal adapter
dependency direction; do not mount additional copies in routes or features.

Agents must not install or run the `gluestack-ui` CLI at any version, including
through `npx`, `npm exec`, `yarn dlx`, `pnpm dlx`, global commands, or project
scripts. Use the **Manual** installation tab in the official component
documentation and copy the required source into `src/components/adapters`.

Review and adapt copied code before use so it follows this context, `DESIGN.md`,
the project's semantic theme tokens, accessibility requirements, kebab-case
naming, and strict TypeScript rules. Verify compatibility with Expo SDK 57,
NativeWind v5, and Tailwind CSS v4. Prefer existing application-owned primitives
when they already provide the required behavior and presentation. Review
dependency instructions separately; manual copying can still require Gluestack
runtime packages and must not trigger automatic dependency installation.

**Before using any component, always verify the latest usage patterns at**
**https://gluestack.io/ui/docs/components/${componentName}/**.

## File and API conventions

- Use TypeScript and keep strict typing enabled.
- Under `primitives`, use `.tsx` for every source file, including styles, types,
  platform variants, and tests. The architecture check enforces this convention.
- Use kebab-case filenames and PascalCase component exports.
- Export each component as its module's default export. Keep reusable component
  prop types as explicit named exports.
- Export component prop types explicitly. Prefer inferred local types and avoid
  `any`, broad assertions, and unnecessary pass-through props.
- Import components directly through the configured alias, for example
  `@/components/primitives/button`.
- Do not create a global barrel file. Direct imports keep ownership visible and
  avoid accidental cycles.
- Keep a component, its test, and component-specific helpers beside each other.
  Create a deeper component folder only when the implementation genuinely needs
  multiple files.
- Prefer semantic component and variant names over visual implementation names.
- Add comments only for non-obvious intent, platform constraints, or invariants.

## Verification for component changes

For any future code change in this directory:

1. exercise the component's default state, every public variant, disabled or
   loading states where applicable, and caller `className` overrides;
2. verify accessibility labels, roles, focus, and press behavior on supported
   platforms;
3. run `npx tsc --noEmit` and the repository lint command when configured;
4. run the narrowest relevant tests, then verify native and web bundles when a
   styling, Metro, animation, gesture, or package boundary changes.
