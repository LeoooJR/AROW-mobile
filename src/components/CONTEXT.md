# Component Library Context

This directory is the application-owned UI boundary. Read this file before
creating, moving, or modifying a component under `src/components`.

## What belongs here

Every extracted React component belongs under `src/components`, whether it is
shared across the application or used by one screen or domain. Route files may
keep small inline JSX; do not extract markup only to satisfy this rule.

This directory contains:

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

Example shape for future variant components:

```tsx
import { tv, type VariantProps } from "tailwind-variants";

const buttonStyles = tv({
  base: "items-center justify-center rounded-xl",
  variants: {
    intent: {
      primary: "bg-blue-600",
      secondary: "bg-slate-200",
    },
  },
  defaultVariants: {
    intent: "primary",
  },
});

type ButtonVariants = VariantProps<typeof buttonStyles>;

export interface ButtonProps extends ButtonVariants {
  className?: string;
}
```

## Packages and platform foundation

The current component foundation is defined in `package.json`:

| Package | Current version | Component responsibility |
| --- | --- | --- |
| Expo | `~57.0.9` | Universal application runtime and SDK |
| React Native | `0.86.2` | Native primitives and platform behavior |
| @gluestack-ui/core | `^5.0.15` | Headless component creators and providers |
| @gluestack-ui/utils | `^5.0.6` | Gluestack accessibility and styling utilities |
| NativeWind | `^5.0.0-preview.4` | Universal `className` styling |
| react-native-css | `^3.0.7` | Native CSS runtime used by NativeWind |
| Tailwind CSS | `^4.3.3` | Utility generation and design tokens |
| tailwind-variants | `^3.3.0` | Typed visual variants, slots, and class conflict resolution |
| expo-image | `~57.0.1` | Application image rendering |
| react-native-reanimated | `4.5.1` | UI-thread animations |
| react-native-gesture-handler | `~2.32.0` | Coordinated native gestures |

Verify this table when upgrading the UI stack. Follow the exact Expo SDK 57
documentation required by the repository-level `AGENTS.md`.

## Gluestack UI v5

Gluestack UI is installed as a source-owned component library on top of
NativeWind v5 and Tailwind CSS v4. Generated gluestack components belong in
`src/components/adapters`; application code must import them directly through
the `@/components/adapters/<component>` boundary rather than importing
`@gluestack-ui/*` package APIs.

The root `GluestackUIProvider` is the single application-level exception to the
normal adapter dependency direction: it owns gluestack overlay and toast
providers and is mounted once by `src/app/_layout.tsx`. Do not mount additional
copies in routes or feature components.

Use `npx gluestack-ui@latest add <component>` to add components. The repository's
`gluestack-ui.config.json` keeps CLI output inside `src/components/adapters`.
Review generated code before use so it follows this context, `DESIGN.md`, the
project's semantic theme tokens, accessibility requirements, kebab-case naming,
and strict TypeScript rules.

**Before using any component, always verify the latest usage patterns at**
**https://gluestack.io/ui/docs/components/${componentName}/**.

## File and API conventions

- Use TypeScript and keep strict typing enabled.
- Use kebab-case filenames and PascalCase component exports.
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
