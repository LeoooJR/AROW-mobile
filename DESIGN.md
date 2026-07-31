# AROW mobile UI design conventions

## Purpose

This document is the authoritative visual design guide for the AROW mobile
application. Agents must follow these conventions when creating or changing its
user interface.

The guide defines AROW's visual identity and interaction character without
prescribing layout, navigation, screens, or application architecture. Mobile must
also follow its platform conventions and product requirements.

## Non-goals

This guide does not prescribe:

- screen structure;
- component arrangement;
- information density;
- navigation model;
- control placement;
- map placement;
- workflow or feature set.

Choose mobile-native patterns that satisfy the product requirements, then apply
the tokens and principles in this guide consistently.

## Design character

AROW should feel like a polished operator tool rather than a playful consumer
application or a marketing surface.

The design character is:

- **Precise:** hierarchy, alignment, labels, and feedback are unambiguous.
- **Calm:** decoration is restrained and surfaces remain visually quiet.
- **Technical:** identifiers, coordinates, statuses, and operational values are
  easy to scan.
- **Softly geometric:** forms are compact and structured without harsh boxes.
- **Orange-led:** orange identifies AROW and directs attention without dominating
  every surface.
- **Theme-consistent:** light and dark themes express the same hierarchy rather
  than behaving like unrelated designs.

## Color principles

Use semantic tokens instead of scattering literal colors through components.

Orange is reserved primarily for:

- primary actions;
- selected or active states;
- current workflow emphasis;
- focus and interaction feedback;
- active location or simulation context.

Do not use orange as a general-purpose background or decorative fill. Large areas
of orange weaken its value as a signal.

Success, warning, and error colors communicate state. Do not replace them with
orange when their semantic meaning matters.

### Light theme

| Token | Value | General role |
| --- | --- | --- |
| `CANVAS` | `#FFFFFF` | Base application background. |
| `SURFACE` | `#F7F7F6` | Primary content surface. |
| `SURFACE_ELEVATED` | `#FFFFFF` | Controls and visually raised content. |
| `SURFACE_MUTED` | `#EFEFED` | Secondary and inactive surfaces. |
| `BORDER_SUBTLE` | `#E7E7E2` | Default outlines and dividers. |
| `BORDER_STRONG` | `#BDBDB7` | Focused or strongly separated regions. |
| `TEXT_PRIMARY` | `#0A0A0A` | Primary content and labels. |
| `TEXT_MUTED` | `#7A7A74` | Secondary content and placeholders. |
| `PRIMARY` | `#FF6A00` | Brand, action, selection, and active state. |
| `PRIMARY_HOVER` | `#FF8C33` | Interactive emphasis. |
| `PRIMARY_SOFT` | `#FFF0E6` | Soft selected or highlighted state. |
| `PRIMARY_BORDER` | `#FFD3B8` | Outline for soft primary states. |
| `SUCCESS` | `#3FA66E` | Ready, running, connected, or confirmed. |
| `WARNING` | `#D98A24` | Pending, degraded, or attention required. |
| `ERROR` | `#D9544D` | Failed, unavailable, or destructive. |

### Dark theme

| Token | Value | General role |
| --- | --- | --- |
| `CANVAS` | `#10100F` | Base application background. |
| `SURFACE` | `#171716` | Primary content surface. |
| `SURFACE_ELEVATED` | `#20201E` | Controls and visually raised content. |
| `SURFACE_MUTED` | `#2A2A27` | Secondary and inactive surfaces. |
| `BORDER_SUBTLE` | `#363632` | Default outlines and dividers. |
| `BORDER_STRONG` | `#55554E` | Focused or strongly separated regions. |
| `TEXT_PRIMARY` | `#FAF9F6` | Primary content and labels. |
| `TEXT_MUTED` | `#A7A49D` | Secondary content and placeholders. |
| `PRIMARY` | `#FF7A1A` | Brand, action, selection, and active state. |
| `PRIMARY_HOVER` | `#FF9A4D` | Interactive emphasis. |
| `PRIMARY_SOFT` | `rgba(255, 106, 0, 0.18)` | Soft selected state. |
| `PRIMARY_BORDER` | `rgba(255, 106, 0, 0.34)` | Outline for soft primary states. |
| `SUCCESS` | `#55C083` | Ready, running, connected, or confirmed. |
| `WARNING` | `#E6A04A` | Pending, degraded, or attention required. |
| `ERROR` | `#F07167` | Failed, unavailable, or destructive. |

### Theme rules

- Support light and dark themes intentionally.
- Respect the system theme by default unless product requirements specify an
  explicit user preference.
- Preserve semantic hierarchy across themes.
- Dark mode uses deep neutral surfaces rather than pure black everywhere.
- Normal dark-theme text uses warm off-white rather than cold pure white.
- Separate dark surfaces through tone and subtle borders, not heavy shadows.
- Keep muted text readable; do not achieve hierarchy through illegibility.
- Verify contrast for text, icons, status indicators, and interactive states.

## Typography

Use a clean technical sans-serif as the primary voice.

Preferred family order:

1. Matter, when available and appropriately licensed;
2. Inter;
3. the platform's native sans-serif.

Use a monospaced family selectively for values where character alignment improves
recognition, such as:

- coordinates;
- device identifiers;
- versions;
- event and error codes;
- timestamps;
- technical metadata;
- log or diagnostic excerpts.

Suitable mono families include Geist Mono, SF Mono, IBM Plex Mono, Menlo, and
Consolas. Platform-native alternatives are acceptable.

### Reference type scale

| Role | Size | Weight | Line height | General use |
| --- | ---: | ---: | ---: | --- |
| Caption | 12px | 400-500 | 1.35 | Compact metadata and status labels. |
| Helper | 14px | 400 | 1.35 | Descriptions, hints, and secondary text. |
| Body | 16px | 400 | 1.35 | Default content and control labels. |
| Body strong | 16px | 600 | 1.30 | Important names, values, and selections. |
| Section title | 20px | 600 | 1.25 | Local content hierarchy. |
| Prominent title | 24px | 600 | 1.20 | Important focused context. |

These values are a visual reference, not a requirement to bypass mobile dynamic
type systems. Mobile must support platform text scaling and may map these roles to
native typography tokens.

Avoid oversized marketing-style display text in operational experiences. Favor
clear scanning and repeated use.

## Spacing rhythm

Use a compact, consistent base scale:

| Token | Value | General role |
| --- | ---: | --- |
| `XS` | 6px | Tight icon-to-text or inline gaps. |
| `SM` | 8px | Default compact gap. |
| `MD` | 10px | Control padding and small grouping. |
| `LG` | 12px | Broader content rhythm. |
| `XL` | 16px | Standard content breathing room. |
| `2XL` | 20px | Prominent or focused content padding. |

This scale governs local rhythm, not screen composition. Adapt values to
density-independent units and platform accessibility requirements while
preserving their relative relationships.

## Shape

Corners should feel soft but precise:

| Token | Value | General role |
| --- | ---: | --- |
| `XS` | 3px | Very small visual details. |
| `SM` | 6px | Compact controls. |
| `MD` | 8px | Standard controls and grouped content. |
| `LG` | 10px | More prominent surfaces. |
| `XL` | 14px | Large focused surfaces. |
| `PILL` | `999px` | Status chips and genuinely pill-shaped controls. |

Do not round every element excessively. Radii should communicate grouping and
touchability while preserving the technical character.

Prefer subtle borders and tonal surface changes over pronounced drop shadows. If
elevation is needed, keep it soft and use the platform's native elevation behavior
consistently.

## Interactive states

Every interactive element must define appropriate states:

- default;
- pressed;
- focused;
- selected, when applicable;
- disabled;
- loading or pending, when applicable;
- success or failure feedback, when applicable.

Hover is optional and applies only on platforms or input modes that support it.
Do not make hover essential to understanding or operating a control.

General treatment:

- Primary actions use `PRIMARY` and clear contrast.
- Pressed states use a visible but restrained tonal change.
- Focus uses `PRIMARY` or `BORDER_STRONG` and must remain visible in both themes.
- Selected states may combine `PRIMARY_SOFT` with `PRIMARY_BORDER`.
- Disabled controls use muted colors but remain identifiable.
- Destructive actions use `ERROR`, not brand orange.
- Loading feedback explains what is pending and prevents accidental duplicate
  actions where needed.

Touch targets must follow mobile platform accessibility guidance.

## Status and feedback

Status colors follow stable semantics:

- `SUCCESS`: ready, running, connected, trusted, or completed;
- `WARNING`: starting, pending, degraded, or requiring attention;
- `ERROR`: failed, disconnected, stopped unexpectedly, or destructive;
- `TEXT_MUTED`: unknown, unavailable, inactive, or neutral;
- `PRIMARY`: current workflow or active user-directed context.

Never communicate status through color alone. Pair color with at least one of:

- text;
- an icon;
- a shape or pattern;
- an accessibility label.

Feedback should be actionable. Error messages explain what happened and, when
possible, what the user can do next. Success feedback should be clear without
being celebratory or disruptive.

## Iconography

Icons are simple, functional, and mostly monochrome.

- Default icons use `TEXT_PRIMARY` or `TEXT_MUTED`.
- Active feature icons may use `PRIMARY`.
- Status icons use their semantic color.
- Primary action icons use whichever foreground provides sufficient contrast on
  orange.
- Use a consistent icon family, stroke character, and optical weight.
- Match icon scale to adjacent text and the platform's touch-target requirements.
- Provide accessible labels when meaning is not already expressed in text.
- Do not use decorative icons that compete with operational information.

## Motion

Motion communicates state change; it does not decorate.

- Keep common transitions short, generally around 160-220ms.
- Use subtle fades, movement, progress, or limited pulses.
- Use orange, green, or red attention pulses only when their semantic meaning is
  clear and for a limited duration.
- Prefer compact progress and status feedback over large looping animations.
- Avoid motion that delays frequent operations.
- Respect the platform's reduced-motion accessibility setting.

## Technical and operational content

- Give names and important values stronger emphasis than their labels.
- Use muted color for secondary metadata without sacrificing readability.
- Keep identifiers and coordinates copyable when the workflow needs it.
- Preserve meaningful numeric precision.
- Use monospaced text only where it materially improves scanning.
- Use orange to mark the active or selected source, not every technical value.
- Avoid exposing raw internal codes when a clear user-facing label exists; retain
  the code as secondary diagnostic context when useful.

## Accessibility

Mobile must apply these conventions accessibly:

- Support system text scaling without clipping or hiding essential content.
- Meet applicable contrast requirements in both themes.
- Provide semantic labels, roles, state, and actions for assistive technologies.
- Preserve usable focus order and external-keyboard navigation where supported.
- Do not rely on color, position, or animation alone to convey meaning.
- Respect reduced-motion, high-contrast, and other relevant system preferences.
- Use platform-compliant touch targets and adequate separation between actions.
- Keep destructive and irreversible actions clearly identified and confirm them
  when appropriate.

Accessibility requirements take precedence over literal token dimensions.

## Platform adaptation

AROW Mobile should look and behave like a well-made native mobile application.

Agents may use native mobile components, navigation patterns, gestures, sheets,
system bars, dialogs, typography roles, and feedback mechanisms. Adapt the AROW
visual language through platform conventions rather than fighting the platform.

When a mobile platform convention conflicts with a literal value in this guide:

1. preserve accessibility and native behavior;
2. preserve semantic meaning and hierarchy;
3. preserve the orange-led AROW identity;
4. adapt the exact dimension or component treatment.

## Design review checklist

Before finishing a mobile UI change, verify:

- The result follows mobile platform conventions.
- Light and dark themes have deliberate, equivalent hierarchy.
- Colors come from the defined semantic tokens.
- Orange is used as a signal rather than decoration.
- Success, warning, error, inactive, and selected states remain distinct.
- Typography is compact, readable, and compatible with system text scaling.
- Technical values use mono styling only when useful.
- Spacing and radii feel coherent across the changed experience.
- Interactive elements include required pressed, focused, disabled, selected, and
  loading states.
- Touch targets meet platform guidance.
- Text, icons, and status feedback remain accessible without color alone.
- Motion is brief, meaningful, and compatible with reduced-motion settings.
- The experience feels precise, calm, technical, and recognizably AROW.

## Maintaining the design system

Colors, typography roles, status semantics, icon character, and motion principles
are system-level conventions rather than local component preferences.

When changing a convention:

1. document the reason and intended semantic effect;
2. verify light and dark variants;
3. check accessibility impact;
4. update every affected token and component coherently;
5. preserve platform-native behavior without imposing a particular layout.
