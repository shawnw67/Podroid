# Podroid — Adaptive Icon (10% smaller)

This revision reduces the **adaptive icon foreground artwork by 10%** relative to `Podroid_Adaptive_Icons_Final_20261102.zip`. The graphic is scaled uniformly about the center of the 108×108dp viewport. **The original lowered placement, the compact i/D spacing, the eyes, antennae, and the original vector paths are all retained.**

Color palette: Android green `#3DDC84`, navy `#19243D`, and white `#FFFFFF`.

## Android project

Copy `res/` into `app/src/main/res/`, overwriting the old launcher resources; set the `<application>` attributes:

```xml
android:icon="@mipmap/ic_launcher"
android:roundIcon="@mipmap/ic_launcher_round"
```

- `res/drawable/ic_launcher_foreground.xml` and `ic_launcher_monochrome.xml` are true Android VectorDrawables with the **new, smaller** transform.
- `res/drawable/ic_launcher_background.xml` contains the navy background.
- `res/mipmap-anydpi-v26/` contains adaptive icon declarations.
- `res/mipmap-*/` contains regenerated legacy PNG fallbacks at mdpi-xxxhdpi.
- `podroid-adaptive-foreground.svg` and matching 1080/432 PNGs have exactly the same smaller geometry.
- Standalone `podroid-logo*.svg/png` files remain unchanged, because this revision is specifically for the Android launcher icon.

Note: some launchers cache icons. Rebuild/reinstall the app or refresh the launcher icon cache before checking on a device.
