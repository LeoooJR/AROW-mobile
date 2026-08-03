# Shared Hooks Context

This directory owns reusable React hooks for UI and platform behavior. Read this
file before creating, moving, or modifying a hook under `src/hooks`.

Hooks that affect interaction, motion, accessibility, visual feedback, or
platform adaptation must also follow the repository-level [`DESIGN.md`](../../DESIGN.md).
That document is authoritative for design decisions and takes precedence when
guidance conflicts.

## What belongs here

Move logic into `src/hooks` only when it is reused by multiple components or
clearly represents an application-wide UI or platform policy. A hook used by one
component stays beside that component until genuine reuse appears.

This directory may contain:

- interaction and presentation-state logic shared by components;
- accessibility and reduced-motion behavior;
- lifecycle, subscription, measurement, and layout coordination;
- animation behavior shared across component families;
- operating-system, device-capability, and Expo/native API adapters.

It must not contain:

- network requests or server-state orchestration;
- storage, persistence, or cache policy;
- analytics policy;
- domain data access, validation, or business workflows;
- route selection or feature-specific navigation decisions.

Keep those concerns with their owning feature, service, or data layer.

## Directory roles

Create role directories only when the first shared hook for that role is added:

```text
src/hooks/
  ui/         Shared interaction, accessibility, animation, and presentation logic.
  platform/   Shared operating-system, device, and Expo/native API behavior.
```

UI hooks may depend on platform hooks. Platform hooks must not depend on UI hooks
or components. Neither role may import feature or domain modules, and circular
dependencies are not allowed.

## Hook API conventions

- Use kebab-case filenames beginning with `use-`, such as
  `use-reduced-motion.ts`.
- Export hooks with the `use` prefix, such as `useReducedMotion`.
- Define explicit exported input and result types for shared hook boundaries.
- Keep the public return shape narrow and semantic. Expose state and operations,
  not internal implementation details or package objects.
- Prefer named object results when a hook returns several values. Preserve
  conventional tuple APIs only when tuple position is clearer and stable.
- Accept dependencies through typed parameters when injection makes behavior
  reusable or testable.
- Import hooks directly through aliases such as `@/hooks/ui/use-reduced-motion`.
- Do not create a global barrel file; direct imports keep ownership and dependency
  direction visible.

## State and effects

- Store the minimum state required. Derive values from props and existing state
  during render instead of synchronizing redundant state with effects.
- When the next value depends on current state, use a functional state updater.
- Represent distinct lifecycle states precisely, using a discriminated union when
  multiple flags could otherwise describe impossible combinations.
- Never call hooks conditionally or hide hook calls inside callbacks.
- Effects synchronize with external systems; they are not a substitute for
  derived values or event handlers.
- Clean up timers, subscriptions, listeners, animations, and in-flight work
  deterministically. Propagate cancellation when the underlying API supports it.
- Avoid singleton mutable state. Use an explicit external store with correct
  subscription semantics only when state genuinely must be shared outside React.

## React Compiler and native behavior

The application has React Compiler enabled:

- return stable operations and let consumers destructure functions before using
  them in callbacks;
- do not add memoization reflexively; use it when an external API or measured hot
  path requires referential stability;
- with Reanimated shared values, use `.get()` and `.set()` rather than direct
  `.value` access;
- keep worklets and UI-thread behavior isolated from ordinary React state;
- respect reduced-motion and accessibility preferences defined by `DESIGN.md`.

Platform hooks must expose supported, unsupported, denied, and unavailable states
where those distinctions affect callers. They must not silently choose product
fallbacks or request permissions without an explicit caller action.

## Verification for hook changes

For every future hook implementation:

1. test its initial state, updates, cleanup, remount behavior, and supported
   platform branches;
2. test denied, unavailable, canceled, and error outcomes when the platform API
   exposes them;
3. verify that callbacks do not capture stale state and subscriptions do not leak;
4. run `npx tsc --noEmit` and the repository lint command when configured;
5. run the narrowest relevant tests, then verify affected native and web behavior.

