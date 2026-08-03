# Design Token Constants Context

This directory is reserved for application-wide visual design tokens. Read this
file before creating, moving, or modifying a file under `src/constants`.

The repository-level [`DESIGN.md`](../../DESIGN.md) is the normative source of
truth for token names, values, semantics, light and dark themes, typography,
spacing, shape, motion, and accessibility exceptions. If code, Tailwind, or this
context disagrees with `DESIGN.md`, update the implementation to match
`DESIGN.md`.

## What belongs here

The initial token modules, when implementation is requested, are:

```text
src/constants/
  colors.ts    Semantic light and dark color tokens.
  fonts.ts     Approved font families, weights, and typography roles.
  spacing.ts   The approved application spacing rhythm.
```

Additional visual token families may be added only when they are defined by
`DESIGN.md` and needed by application code. Do not place these concerns here:

- secrets or environment variables;
- API configuration or runtime feature flags;
- route names or navigation policy;
- domain statuses, business limits, or validation rules;
- user preferences or other mutable runtime state.

Those values remain with their owning subsystem. Constants should encode stable
design decisions, not replace configuration, state, or domain models.

## Authority and synchronization

`DESIGN.md` is the human-readable design authority. Future TypeScript constants
will be the canonical runtime representation of those approved values.

When a design token changes:

1. update and review the semantic decision in `DESIGN.md` first;
2. update its TypeScript representation in the same change;
3. update matching Tailwind `@theme` variables and any native configuration;
4. update affected components coherently across light and dark themes;
5. verify accessibility and platform behavior before completion.

Never introduce a local component token that contradicts an existing semantic
token. If a new semantic need appears, define it in `DESIGN.md` before encoding
it here.

## TypeScript conventions

- Export immutable objects with `as const` so keys and values retain literal
  types.
- Derive token-name and token-value unions from the objects instead of repeating
  string unions manually.
- Prefer semantic names such as surface, primary text, or error over visual names
  tied to a raw hue.
- Use consistent light and dark token keys so theme selection cannot produce a
  missing semantic role.
- Prefer plain objects and literal unions over enums.
- Do not expose mutable objects, classes, runtime initialization, or side effects.
- Keep constants dependency-free. Components and hooks may depend on constants;
  constants must not depend on them.
- Import modules directly, for example `@/constants/colors`. Do not create a
  global barrel file.

## Token-family rules

### Colors

- Preserve the semantic roles and status meanings defined in `DESIGN.md`.
- Define explicit light and dark values for every theme-dependent token.
- Do not use brand orange as a replacement for success, warning, error, or
  destructive semantics.
- Components must consume semantic tokens rather than scattering literal colors.
- Color must not be the only way an interface communicates state.

### Fonts

- Preserve the family preference order and typography roles from `DESIGN.md`.
- Font constants must match the family names actually embedded in the app.
- Add custom font assets through Expo's `expo-font` config plugin and rebuild the
  native application; do not make UI depend on asynchronous font loading.
- Typography tokens must remain compatible with system text scaling.

### Spacing

- Encode the spacing rhythm defined in `DESIGN.md` without inventing local scales.
- Use numeric density-independent values for React Native consumers.
- Preserve relative relationships when accessibility or platform conventions
  require an exact value to adapt.
- Spacing tokens govern local rhythm, not screen composition or control placement.

## Tailwind and NativeWind

Tailwind CSS cannot become an independent token authority. Semantic `@theme`
variables must mirror the TypeScript values and names derived from `DESIGN.md`.
Update both representations together, and use semantic NativeWind utilities in
components instead of raw palette utilities once those variables exist.

Do not generate class names dynamically from token values. Keep complete utility
class names visible to Tailwind and NativeWind.

## Verification for token changes

For every future token implementation or update:

1. compare token names, values, and meanings against `DESIGN.md`;
2. verify that light and dark themes expose identical semantic keys;
3. verify the TypeScript and Tailwind representations remain synchronized;
4. run `npx tsc --noEmit` and the repository lint command when configured;
5. inspect representative components on native and web, including text scaling,
   contrast, reduced motion, and other relevant accessibility preferences.

