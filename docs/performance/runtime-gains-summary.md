# Visualizer Runtime Gains Summary

## Why This Work Was Needed

In gSender, loading a file is more than preparing it to send to the controller.
The biggest overhead is building visualization and estimate data in the app:

- Parse the G-code
- Build visualization geometry
- Build color data for rendering
- Build estimate data (time/distance/etc.)

This means load-time performance is heavily affected by visualization parsing work, not just file transfer or send readiness.

## Old Workflow (Before)

The old path had multiple processing stages and extra memory churn:

1. Parse file content.
2. Build geometry arrays.
3. Run a second pass to set/finalize colors.
4. Optionally run another pass for opacity handling (file/type dependent).
5. Transfer larger payloads due to staging/capacity overhead.
6. Persist/reload some parsed estimate data through IndexedDB paths.

The result was avoidable CPU time, extra allocations, and slower perceived load in the UI.

## New Workflow (Now, Single Worker)

The worker now does parsing and data preparation in one streamlined pipeline:

1. Stream and parse lines in the worker.
2. Build final geometry and final color output during parse (no separate color pass).
3. Use typed buffers and compact before transfer so only used bytes are sent.
4. Send staged worker responses (`geometryReady`, then `metadataReady`) for better UI responsiveness.
5. Hand off estimate data directly in-memory (no IndexedDB round-trip for this flow).

This reduces total compute, reduces payload overhead, and makes file load feel faster and more predictable.

## What Changed Overall (GAINZ!)

Across all test files (`mb-6`, `mb-14`, `mb-28`, and `Rotary`), compared to the original baseline:

- Total runtime improved from `10340.4 ms` to `3691.0 ms` (`-64.3%`, about `2.80x` faster).
- Parse pipeline time (`lineSplit + parseLoop`) improved from `6827.7 ms` to `3508.5 ms` (`-48.6%`).
- Transfer payload size improved from `615523408` to `213180456` bytes (`-65.4%`).
- Color build time was removed (`3101.7 ms` to `0.0 ms`).

## Implemented Improvements

1. Built final colors during parsing so there is no second color-processing pass.
2. Stopped duplicating saved color arrays for non-laser jobs.
3. Replaced JS staging arrays with growable typed buffers.
4. Trimmed buffers before transfer so only used bytes are sent.
5. Switched to streaming line parsing instead of pre-splitting full file content.
6. Simplified parser dispatch using a single token-group path with reusable scratch storage.
7. Kept axis-only motion fallback behavior while using the faster dispatch path.
8. Split worker replies into staged messages (`geometryReady`, then `metadataReady`) with `jobId`.
9. Added stale-message protection and active job tracking.
10. Removed IndexedDB parsed-data persistence for this flow and passed estimate data directly.
11. Kept estimate data in memory and removed obsolete IndexedDB helper usage.
12. Moved worker termination to metadata completion for safer lifecycle handling.
13. Added copy-friendly profiling exports (`window.__vizProfile`, `window.__vizRuns`).
14. Improved rotary/arc behavior with adaptive arc tessellation and lower segment floors on A-axis moves.

## Practical Impact

- Faster time-to-visual: users see usable geometry sooner because parsing and rendering prep are streamlined.
- Less wasted work: no duplicate color processing path and fewer temporary allocations.
- Stable memory behavior: tighter buffers and direct handoff reduce unnecessary memory pressure.
- Better scaling on larger files: improvements become more meaningful as file size and line count increase.

## Runtime Tables

### Original Baseline Vs Latest Rotary-Era Results (`mb` files use 3-run medians)

| File | Total ms (baseline -> latest rotary-era) | Total delta | Parse pipeline ms `(lineSplit + parseLoop)` | Parse pipeline delta | ColorBuild ms (baseline -> latest rotary-era) | ColorBuild delta | Transfer bytes (baseline -> latest rotary-era) | Transfer delta |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| mb-6 | 837.1 -> 364.4 | -56.5% | 478.3 -> 348.4 | -27.2% | 324.6 -> 0.0 | -100.0% | 37378156 -> 24377068 | -34.8% |
| mb-14 | 1909.6 -> 766.8 | -59.8% | 1196.0 -> 733.5 | -38.7% | 660.1 -> 0.0 | -100.0% | 74176760 -> 48376152 | -34.8% |
| mb-28 | 3539.1 -> 1571.4 | -55.6% | 1980.6 -> 1510.2 | -23.8% | 1395.4 -> 0.0 | -100.0% | 141018180 -> 91968388 | -34.8% |
| Rotary | 4054.6 -> 988.4 | -75.6% | 3172.8 -> 916.4 | -71.1% | 721.6 -> 0.0 | -100.0% | 362950312 -> 48458848 | -86.6% |

### Old Baseline Median (3 Runs) Vs Latest Optimized Build

| File | Total ms (old median -> latest) | Total delta | Parse pipeline ms `(lineSplit + parseLoop)` | Parse pipeline delta | Transfer bytes (old median -> latest) | Transfer delta |
|---|---:|---:|---:|---:|---:|---:|
| mb-6 | 684.5 -> 407.4 | -40.5% | 626.7 -> 365.6 | -41.7% | 24377068 -> 24377068 | 0.0% |
| mb-14 | 1436.7 -> 848.7 | -40.9% | 1327.0 -> 790.7 | -40.4% | 48376152 -> 48376152 | 0.0% |
| mb-28 | 2691.4 -> 1723.9 | -35.9% | 2293.5 -> 1527.6 | -33.4% | 91968388 -> 91968388 | 0.0% |

### Latest Optimized Build Vs Arc-Update Build (3-Run Median)

| File | Total ms (latest -> arc-update median) | Total delta | Parse pipeline ms `(lineSplit + parseLoop)` | Parse pipeline delta | Transfer bytes (latest -> arc-update median) | Transfer delta |
|---|---:|---:|---:|---:|---:|---:|
| mb-6 | 407.4 -> 364.4 | -10.6% | 365.6 -> 348.4 | -4.7% | 24377068 -> 24377068 | 0.0% |
| mb-14 | 848.7 -> 766.8 | -9.6% | 790.7 -> 733.5 | -7.2% | 48376152 -> 48376152 | 0.0% |
| mb-28 | 1723.9 -> 1571.4 | -8.8% | 1527.6 -> 1510.2 | -1.1% | 91968388 -> 91968388 | 0.0% |
