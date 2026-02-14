# Icon Assets

Aegis requires icon files in PNG format. Please provide the following icon sizes:

- `icon16.png` - 16x16 pixels
- `icon32.png` - 32x32 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## Design Guidelines

The icon should be a shield with a checkmark, representing security and verification.

**Colors:**
- Primary: #0EA5E9 (sky-500)
- White: #FFFFFF
- Accent: As needed

## Temporary SVG

An SVG version is provided at `assets/icon.svg` for reference. You can use an online converter like:
- https://cloudconvert.com/svg-to-png
- https://svgtopng.com/

Or use ImageMagick:
```bash
convert -background none -size 128x128 assets/icon.svg assets/icon128.png
convert -background none -size 48x48 assets/icon.svg assets/icon48.png
convert -background none -size 32x32 assets/icon.svg assets/icon32.png
convert -background none -size 16x16 assets/icon.svg assets/icon16.png
```

## For Development

To skip icon errors during development, you can create simple 1x1 PNG placeholders:
```bash
# This will be handled automatically in the setup
```
