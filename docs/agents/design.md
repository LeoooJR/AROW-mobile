# Design authority

Before changing UI, styling, design tokens, typography, spacing, color, shape,
iconography, motion, interaction feedback, design-related accessibility, page
architecture, or element placement, read and follow:

- [Light prototype](../../design-prototype/android-home.html)
- [Dark prototype](../../design-prototype/android-home-dark.html)
- [Design guide](../../DESIGN.md)

The rendered light and dark prototypes are the sources of truth for their
respective themes. Interpret their design intent: color, typography, spacing,
borders, shapes, sizing, alignment, element position, visual hierarchy, and page
architecture. Their programming implementation and behavior, including
functions, variables, event handling, and other logic, are not authoritative and
must not be copied or treated as application requirements.

Only the user may modify or override the design prototypes. Agents must not edit
them. When a theme's prototype and `DESIGN.md` differ on a visual decision, follow
that theme's prototype. Use `DESIGN.md` for complementary guidance where the
prototypes are silent. These sources take precedence over local component, hook,
or constants guidance when design rules conflict.
