# custom-fps

A Scratch Addons addon that adds a **Custom FPS** extension category to the
Scratch editor.

## Blocks

- `set FPS to (60)`
- `change FPS by (10)`
- `FPS`

The `FPS` reporter is the FPS variable-type block: it reports the current
project framerate.

## Behavior

- Default: 30 FPS, matching normal Scratch timing.
- `set FPS to (60)` changes the VM's actual stepping/rendering interval to
  approximately 60 ticks per second.
- `change FPS by (10)` adjusts the current rate.
- FPS is clamped from 0 to 240.
- `0` means display-synchronized mode using `requestAnimationFrame`.
- The rate affects both execution of Scratch scripts and the VM's stage
  rendering loop.

## Installing for development

1. Clone Scratch Addons.
2. Put this directory at:
   `addons/custom-fps/`
3. Add `custom-fps` to the `addons/addons.json` list above the
   `// NEW ADDONS ABOVE THIS` marker.
4. Reload/rebuild the unpacked Scratch Addons extension.
5. Enable **Custom project framerate** in Scratch Addons.
6. Open a Scratch project and look for the **Custom FPS** extension category.

See the official Scratch Addons development documentation:
https://scratchaddons.com/docs/develop/getting-started/creating-an-addon/

## Important compatibility note

This addon intentionally uses Scratch VM's internal extension registration API
and Runtime stepping internals. These are implementation details rather than a
stable public API, so a future Scratch VM update can require maintenance.

It can conflict with other addons that replace `runtime.start` to implement
their own framerate system, notably Scratch Addons' existing higher project
framerate addon. Do not enable both at the same time.

## Files

- `addon.json` — Scratch Addons manifest.
- `userscript.js` — VM extension and framerate implementation.
