# Android launcher icon

The editable SVGs reproduce the light-theme marker in
`src/components/adapters/map/user-location-marker.tsx`, pointing upward. Its
50-unit halo is scaled to 66 units inside a 108-unit adaptive-icon canvas. Keep
the geometry and colors aligned with the marker when updating these assets.

The monochrome SVG includes the core's outer stroke extent and cuts the arrow
out of both the core and halo. Android supplies the themed icon's colors.

Regenerate the 1024 x 1024 PNGs with librsvg's `rsvg-convert`:

```bash
rsvg-convert assets/images/android-icon-foreground.svg -o assets/images/android-icon-foreground.png
rsvg-convert assets/images/android-icon-monochrome.svg -o assets/images/android-icon-monochrome.png
rsvg-convert --background-color white assets/images/android-icon-foreground.svg -o assets/images/android-icon.png
```

`app.json` uses the transparent foreground and monochrome layers over a white
adaptive background, plus the flattened PNG for legacy Android launchers.
Launcher icon changes require a new native build.

Format SVGs with Prettier's HTML parser (`--parser html`); Prettier does not infer
a parser for the `.svg` extension.
