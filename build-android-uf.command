#!/bin/bash
# Build Podroid APK with the release keystore.
# This file is opened in Terminal so the user can type the keystore password.
source "$HOME/Library/Android/androidenv.sh"
cd "$HOME/Documents/touchHLE"
echo "=== Building Podroid APK ==="
if ! ./dev-scripts/build-android-uf.sh; then
    echo "Build failed. Press any key to close this window..."
    read -n 1
    exit 1
fi
echo
echo "=== Done. APK at: ==="
ls -lh "$HOME/Documents/touchHLE"/Podroid_*_Android*.apk | tail -5
echo
echo "Press any key to close this window..."
read -n 1
