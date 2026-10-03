#!/bin/sh
# Usage: scripts/owl-guide-qa/run-matrix.sh [workers] [filter]   (workers default 3; filter is an egrep over the job lines, e.g. 'lab|policy')
# Runs the real-browser matrix against QA_URL (default http://127.0.0.1:5173/, start `npm run dev` first).
# Needs PUPPETEER_CORE (puppeteer-core is not a project dependency) and CHROME_PATH, see README.
# One log per run in .studio/qa/owl-guide/logs/; the walkers write result.json + screenshots under .studio/qa/owl-guide/.
set -eu
cd "$(dirname "$0")/../.."
: "${PUPPETEER_CORE:?set PUPPETEER_CORE to the puppeteer-core entry file}"
: "${CHROME_PATH:?set CHROME_PATH to a Chrome/Chromium binary}"
logs=.studio/qa/owl-guide/logs
mkdir -p "$logs"

modules="intro history production lab vietnam policy finale"
{
  for m in $modules; do
    echo "matrix-walk --module $m --width 1440 --height 900"
    echo "matrix-walk --module $m --width 1366 --height 768"
    echo "matrix-walk --module $m --width 360 --height 640 --touch"
    echo "matrix-walk --module $m --width 390 --height 844 --touch"
  done
  # Breakpoint, tablet, large screen, reduced motion and browser zoom 200% (viewport 720x450 at DPR 2).
  for w in 899 900; do echo "matrix-walk --module history --width $w --height 700"; done
  echo "matrix-walk --module history --width 1024 --height 768"
  echo "matrix-walk --module lab --width 1024 --height 768"
  echo "matrix-walk --module history --width 768 --height 1024 --touch"
  for m in history lab intro; do echo "matrix-walk --module $m --width 1440 --height 900 --reduced"; done
  for m in lab history; do echo "matrix-walk --module $m --width 1920 --height 1080"; done
  for m in intro lab policy; do echo "matrix-walk --module $m --width 1440 --height 900 --zoom 2"; done
  echo "game-walk --via module"
  echo "game-walk --via f04"
  echo "game-walk --via module --width 390 --height 844 --touch"
  echo "game-walk --via module --reduced"
  echo "states --width 1440 --height 900"
  echo "states --width 360 --height 640 --touch"
  echo "a11y --width 1440 --height 900"
  echo "a11y --width 360 --height 640 --touch"
  echo "resize"
} | grep -E -- "${2:-.}" | xargs -P "${1:-3}" -I{} sh -c '
  set -- {}
  script=$1; shift
  name=$(echo "$script $*" | tr " " "_" | tr -d "-")
  timeout 1500 node scripts/owl-guide-qa/$script.mjs "$@" > ".studio/qa/owl-guide/logs/$name.log" 2>&1 || echo "FAILED: $script $*" >> .studio/qa/owl-guide/logs/_failed.txt
'
