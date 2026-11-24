#!/bin/sh
# Regenerates src/code-excerpt.ts from the emulator's real source.
# Run from promo-video/. Adjust the line ranges if game_controller.rs moves.
set -e
SRC=../src/frameworks/game_controller.rs
{
  echo '// Verbatim excerpt of src/frameworks/game_controller.rs (lines 392–400 and'
  echo '// 414–424 at the commit this video was made from). UFtouchHLE source is MPL-2.0.'
  echo '// Regenerate with scripts/extract-code.sh after the file changes.'
  echo 'export const codeExcerpt = String.raw`'
  sed -n 392,400p "$SRC"
  echo '    // …'
  sed -n 414,424p "$SRC"
  echo '`;'
} > src/code-excerpt.ts
