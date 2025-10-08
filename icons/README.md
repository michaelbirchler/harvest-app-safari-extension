## Icon Set & Glass Design

The extension uses a glassy macOS‑style icon composed in `icon-source.svg` (1024×1024). A warm Harvest accent ring (orange gradient) sits on a frosted squircle with subtle internal glow and clock hands set to a readable asymmetric time for visual balance.

### Generated Sizes

| File          | Purpose                     |
| ------------- | --------------------------- |
| `icon16.png`  | Toolbar (compact)           |
| `icon32.png`  | Toolbar / popup high-res    |
| `icon48.png`  | Extension management UI     |
| `icon128.png` | App Store / catalog preview |

All PNGs are generated from the single SVG source to keep consistency.

### Visual Characteristics

1. Frosted base gradient (light neutral) with inner glow + edge sheen.
2. Harvest accent ring (multi-stop orange gradient) with subtle highlight.
3. Minimal tick marks at 12/3/6/9 for recognizability at small sizes.
4. Two clock hands with soft white gradient for contrast in dark mode.
5. High-DPI friendly (vector source) and flattened to crisp PNG via `sharp`.

### Regenerating Icons

Run:

```bash
npm run build:icons
```

This executes `scripts/build-icons.js` which rasterizes `icon-source.svg` to all required sizes.

### Updating the Design

1. Edit `icons/icon-source.svg` in your vector tool (or directly).
2. Keep the viewBox 0 0 1024 1024.
3. Preserve IDs used for gradients / filters if you want to keep the same effects.
4. Re-run the build script to refresh PNGs.

### Dark & Light Mode Considerations

The semi-transparent highlight and layered white strokes allow the icon to sit well on both light and dark Safari toolbars; the strong accent ring maintains identity when the rest desaturates in dark mode.

### Accessibility

The color contrast between the accent ring and ticks / hands remains high when scaled down; hands are thicker than 1px at 16×16 due to stroke scaling.

### Future Enhancements (Optional)

- Add a subtle animated badge overlay when a timer runs (separate asset).
- Provide an inverted monochrome variant if Safari adopts different badge styles.

---

This directory is now production-ready; modify `icon-source.svg` then regenerate as needed.
