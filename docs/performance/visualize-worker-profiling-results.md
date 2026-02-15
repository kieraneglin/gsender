# Visualize Worker Profiling Results

## Plan And Delivery Summary

Comparison basis:
- Baseline = original single-run captures (`mb-6`, `mb-14 (Baseline)`, `mb-28`).
- Current = latest `Post Phase 2 - Run 1` captures for each file (`mb-6`, `mb-14`, `mb-28`).

### Implemented Steps (Through Phase 2)

1. Build final colors during parse and remove the post-parse color expansion pass.
2. Stop duplicating `savedColors` for non-laser jobs (`saved_color_bytes` stays `0` for non-laser).
3. Replace JS staging arrays with growable typed buffers for vertices/frames/colors.
4. Stream lines into the parser (remove full `split/reverse/pop` line buffering path).
5. Refactor `GCodeVirtualizer` dispatch hot path to a single token-group cursor with reusable `argsScratch`.
6. Preserve motion fallback semantics for axis-only lines (X/Y/Z/A...) while using the new dispatch path.
7. Split worker responses into staged messages (`geometryReady`, then `metadataReady`) with `jobId`.
8. Add stale-message protection and active job tracking in response handling.
9. Move worker termination to metadata completion and remove premature terminate calls from visualizer subscribers.
10. Add copy-friendly profiling exports (`window.__vizProfile`, `window.__vizRuns`) and console guidance.

### Quick Gains From Original Runs To Current (Post Phase 2)

| File | Total ms (baseline -> current) | Total delta | Parse pipeline ms `(lineSplit + parseLoop)` | Parse pipeline delta | ColorBuild ms (baseline -> current) | ColorBuild delta | Transfer bytes (baseline -> current) | Transfer delta |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| mb-6 | 837.1 -> 400.6 | -52.1% | 478.3 -> 370.1 | -22.6% | 324.6 -> 0.0 | -100.0% | 37378156 -> 35651584 | -4.6% |
| mb-14 | 1909.6 -> 819.1 | -57.1% | 1196.0 -> 772.8 | -35.4% | 660.1 -> 0.0 | -100.0% | 74176760 -> 71303168 | -3.9% |
| mb-28 | 3539.1 -> 1692.3 | -52.2% | 1980.6 -> 1515.6 | -23.5% | 1395.4 -> 0.0 | -100.0% | 141018180 -> 142606336 | +1.1% |

Aggregate (all 3 files combined):
- Total time: `6285.8 ms -> 2912.0 ms` (`-53.7%`).
- Parse pipeline (`lineSplit + parseLoop`): `3654.9 ms -> 2658.5 ms` (`-27.3%`).
- Transfer bytes: `252573096 -> 249561088` (`-1.2%`).
- Color build time: `2380.1 ms -> 0.0 ms` (`-100.0%`).

Note:
- Current runtime speed is substantially improved versus baseline.
- Transfer size/memory copy gains are not yet realized because growable buffer capacity is still being transferred in full; Phase 3 targets transfer compaction.

Use this file to record baseline and post-change profiling for 3 representative files.

## How To Enable Profiling

Set these values in app storage before loading a file:

- `widgets.visualizer.debug.profileWorker = true`
- `widgets.visualizer.debug.profileSampleEvery = 10000` (or your preferred interval)

Profiling output is printed in the app console by `Visualize.response.js` under:

- `[Visualizer Profile] Parse + Memory Summary`

## Test Matrix

| Label | File Path | File Size (MB) | Notes |
|---|---|---:|---|
| Small |  |  |  |
| Medium |  |  |  |
| Large |  |  |  |
| mb-6 |  | 6 | Single captured run from Chrome console |
| mb-14 (Baseline) |  | 14 | Single captured run from Chrome console |
| mb-14 (Post Step 1) |  | 14 | Single captured run from Chrome console (post step 1) |
| mb-28 |  | 28 | Single captured run from Chrome console |

## Run Results (3 Runs Per File)

### Small

| Run | total (ms) | parseLoop (ms) | peakHeap (bytes) | transfer_total_bytes |
|---:|---:|---:|---:|---:|
| 1 | 470.1 | 442.0 | null | 24377068 |
| 2 | 463.9 | 435.6 | null | 24377068 |
| 3 | 457.5 | 430.2 | null | 24377068 |
| Median | 463.9 | 435.6 | null | 24377068 |

### Medium

| Run | total (ms) | parseLoop (ms) | peakHeap (bytes) | transfer_total_bytes |
|---:|---:|---:|---:|---:|
| 1 | 1110.5 | 1042.9 | null | 48376152 |
| 2 | 1171.8 | 1112.0 | null | 48376152 |
| 3 | 1203.4 | 1124.3 | null | 48376152 |
| Median | 1171.8 | 1112.0 | null | 48376152 |

### Large

| Run | total (ms) | parseLoop (ms) | peakHeap (bytes) | transfer_total_bytes |
|---:|---:|---:|---:|---:|
| 1 | 2030.6 | 1887.2 | null | 91968388 |
| 2 | 2140.6 | 1957.8 | null | 91968388 |
| 3 | 2139.4 | 1973.9 | null | 91968388 |
| Median | 2139.4 | 1957.8 | null | 91968388 |

## Optional Extended Fields

Capture these when needed for deeper diagnosis:

- `durationsMs.rotaryScan`
- `durationsMs.lineSplit`
- `durationsMs.typedArrayBuild`
- `durationsMs.colorBuild`
- `counts.frames_len`
- `counts.vertices_f32_len`
- `counts.estimates_len`
- `counts.spindle_tool_event_count`
- `vm.linesSeen`, `vm.tokensSeen`, `vm.groupsSeen`, `vm.handlerInvocations`

## Captured Results

### mb-6

Summary:
- `transfer_total_bytes=37378156`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 13.6 |
| lineSplit | 15.8 |
| parseLoop | 462.5 |
| typedArrayBuild | 2.4 |
| colorBuild | 324.6 |
| total | 837.1 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 12567944 |
| vertices_bytes | 9750816 |
| frames_bytes | 1625164 |
| color_bytes | 13001088 |
| saved_color_bytes | 13001088 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 37378156 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 406291 |
| virtualized_lines | 406297 |
| lines_with_data | 406291 |
| frames_len | 406291 |
| vertices_f32_len | 2437704 |
| colors_tag_len | 812568 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 17095 |
| estimates_len | 406291 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 406297 |
| tokensSeen | 836902 |
| groupsSeen | 406291 |
| handlerInvocations | 406291 |
| emitDataCount | 406291 |
| estimatesPushCount | 406291 |
| invalidLineCount | 0 |

### mb-6 (Post Step 1)

Summary:
- `transfer_total_bytes=37378156`
- `peakHeap=null`
- `heapSupported=false`

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 12567944 |
| vertices_bytes | 9750816 |
| frames_bytes | 1625164 |
| color_bytes | 13001088 |
| saved_color_bytes | 13001088 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 37378156 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 406291 |
| virtualized_lines | 406297 |
| lines_with_data | 406291 |
| frames_len | 406291 |
| vertices_f32_len | 2437704 |
| color_values_len | 3250272 |
| color_vertices_len | 812568 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 17095 |
| estimates_len | 406291 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 406297 |
| tokensSeen | 836902 |
| groupsSeen | 406291 |
| handlerInvocations | 406291 |
| emitDataCount | 406291 |
| estimatesPushCount | 406291 |
| invalidLineCount | 0 |

### mb-6 (Post Step 2)

Summary:
- `transfer_total_bytes=24377068`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 12.9 |
| lineSplit | 14.7 |
| parseLoop | 438.8 |
| typedArrayBuild | 3 |
| colorBuild | 3.1 |
| total | 484.7 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 12567944 |
| vertices_bytes | 9750816 |
| frames_bytes | 1625164 |
| color_bytes | 13001088 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 24377068 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 406291 |
| virtualized_lines | 406297 |
| lines_with_data | 406291 |
| frames_len | 406291 |
| vertices_f32_len | 2437704 |
| color_values_len | 3250272 |
| color_vertices_len | 812568 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 17095 |
| estimates_len | 406291 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 406297 |
| tokensSeen | 836902 |
| groupsSeen | 406291 |
| handlerInvocations | 406291 |
| emitDataCount | 406291 |
| estimatesPushCount | 406291 |
| invalidLineCount | 0 |

### mb-6 (Post Step 3)

Summary:
- `transfer_total_bytes=24377068`
- `peakHeap=null`
- `heapSupported=false`
- `gSender:fileLoad=722.489990234375 ms`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 13.1 |
| lineSplit | 14.3 |
| parseLoop | 429.8 |
| typedArrayBuild | 1.3 |
| colorBuild | 3.8 |
| total | 474.5 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 12567944 |
| vertices_bytes | 9750816 |
| frames_bytes | 1625164 |
| color_bytes | 13001088 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 24377068 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 406291 |
| virtualized_lines | 406297 |
| lines_with_data | 406291 |
| frames_len | 406291 |
| vertices_f32_len | 2437704 |
| color_values_len | 3250272 |
| color_vertices_len | 812568 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 17095 |
| estimates_len | 406291 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 406297 |
| tokensSeen | 836902 |
| groupsSeen | 406291 |
| handlerInvocations | 406291 |
| emitDataCount | 406291 |
| estimatesPushCount | 406291 |
| invalidLineCount | 0 |

### mb-6 (Post Step 4 - 3 Runs)

Summary:
- `median_total_ms=463.9`
- `median_parseLoop_ms=435.6`
- `transfer_total_bytes=24377068`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Run | rotaryScan | lineSplit | parseLoop | typedArrayBuild | colorBuild | total |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 12.3 | 0 | 442.0 | 1.8 | 1.7 | 470.1 |
| 2 | 12.9 | 0 | 435.6 | 1.4 | 2.0 | 463.9 |
| 3 | 12.4 | 0 | 430.2 | 1.5 | 1.5 | 457.5 |
| Median | 12.4 | 0 | 435.6 | 1.5 | 1.7 | 463.9 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 12567944 |
| vertices_bytes | 9750816 |
| frames_bytes | 1625164 |
| color_bytes | 13001088 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 24377068 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 406291 |
| virtualized_lines | 406297 |
| lines_with_data | 406291 |
| frames_len | 406291 |
| vertices_f32_len | 2437704 |
| color_values_len | 3250272 |
| color_vertices_len | 812568 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 17095 |
| estimates_len | 406291 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 406297 |
| tokensSeen | 836902 |
| groupsSeen | 406291 |
| handlerInvocations | 406291 |
| emitDataCount | 406291 |
| estimatesPushCount | 406291 |
| invalidLineCount | 0 |

### mb-6 (Post Step A+B - Run 1)

Summary:
- `ts=2026-02-15T14:45:43.920Z`
- `transfer_total_bytes=24377068`
- `peakHeap=null`
- `heapSupported=false`
- Compared to `mb-6 (Post Step 4 - 3 Runs)` median:
- `total: 463.9 -> 416.6 ms` (`-10.2%`)
- `parseLoop: 435.6 -> 376.6 ms` (`-13.5%`)
- `lineSplit + parseLoop: 435.6 -> 376.6 ms` (`-13.5%`)

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 14.5 |
| lineSplit | 0 |
| parseLoop | 376.6 |
| typedArrayBuild | 1.9 |
| colorBuild | 2.6 |
| total | 416.6 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 12567944 |
| vertices_bytes | 9750816 |
| frames_bytes | 1625164 |
| color_bytes | 13001088 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 24377068 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 406291 |
| virtualized_lines | 406297 |
| lines_with_data | 406291 |
| frames_len | 406291 |
| vertices_f32_len | 2437704 |
| color_values_len | 3250272 |
| color_vertices_len | 812568 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 17095 |
| estimates_len | 406291 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 406297 |
| tokensSeen | 836903 |
| groupsSeen | 406292 |
| handlerInvocations | 406291 |
| emitDataCount | 406291 |
| estimatesPushCount | 406291 |
| invalidLineCount | 0 |

### mb-6 (Post Phase 1 - Run 1)

Summary:
- `ts=2026-02-15T15:14:02.669Z`
- `transfer_total_bytes=35651584`
- `peakHeap=null`
- `heapSupported=false`
- Compared to `mb-6 (Post Step A+B - Run 1)`:
- `total: 416.6 -> 399.6 ms` (`-4.1%`)
- `parseLoop: 376.6 -> 371.2 ms` (`-1.4%`)
- `typedArrayBuild: 1.9 -> 0.0 ms` (`-100.0%`)
- `colorBuild: 2.6 -> 0.0 ms` (`-100.0%`)
- `transfer_total_bytes: 24377068 -> 35651584` (`+46.2%`)

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 15 |
| lineSplit | 0 |
| parseLoop | 371.2 |
| typedArrayBuild | 0 |
| colorBuild | 0 |
| total | 399.6 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 12567944 |
| vertices_bytes | 9750816 |
| frames_bytes | 1625164 |
| color_bytes | 13001088 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 35651584 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 406291 |
| virtualized_lines | 406297 |
| lines_with_data | 406291 |
| frames_len | 406291 |
| vertices_f32_len | 2437704 |
| color_values_len | 3250272 |
| color_vertices_len | 812568 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 17095 |
| estimates_len | 406291 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 406297 |
| tokensSeen | 836903 |
| groupsSeen | 406292 |
| handlerInvocations | 406291 |
| emitDataCount | 406291 |
| estimatesPushCount | 406291 |
| invalidLineCount | 0 |

### mb-6 (Post Phase 2 - Run 1)

Summary:
- `ts=2026-02-15T15:30:04.582Z`
- `transfer_total_bytes=35651584`
- `peakHeap=null`
- `heapSupported=false`
- Compared to `mb-6 (Post Phase 1 - Run 1)`:
- `total: 399.6 -> 400.6 ms` (`+0.3%`)
- `parseLoop: 371.2 -> 370.0 ms` (`-0.3%`)
- `lineSplit + parseLoop: 371.2 -> 370.1 ms` (`-0.3%`)
- `typedArrayBuild: 0.0 -> 0.0 ms` (`n/a`)
- `colorBuild: 0.0 -> 0.0 ms` (`n/a`)
- `transfer_total_bytes: 35651584 -> 35651584` (`0.0%`)

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 16.5 |
| lineSplit | 0.1 |
| parseLoop | 370 |
| typedArrayBuild | 0 |
| colorBuild | 0 |
| total | 400.6 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 12567944 |
| vertices_bytes | 9750816 |
| frames_bytes | 1625164 |
| color_bytes | 13001088 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 35651584 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 406291 |
| virtualized_lines | 406297 |
| lines_with_data | 406291 |
| frames_len | 406291 |
| vertices_f32_len | 2437704 |
| color_values_len | 3250272 |
| color_vertices_len | 812568 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 17095 |
| estimates_len | 406291 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 406297 |
| tokensSeen | 836903 |
| groupsSeen | 406292 |
| handlerInvocations | 406291 |
| emitDataCount | 406291 |
| estimatesPushCount | 406291 |
| invalidLineCount | 0 |

### mb-14 (Baseline)

Summary:
- `transfer_total_bytes=74176760`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 30.1 |
| lineSplit | 29.6 |
| parseLoop | 1166.4 |
| typedArrayBuild | 5.2 |
| colorBuild | 660.1 |
| total | 1909.6 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 25800608 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 74176760 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| colors_tag_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Step 1)

Summary:
- `transfer_total_bytes=74176760`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 28.1 |
| lineSplit | 27.5 |
| parseLoop | 1056.4 |
| typedArrayBuild | 6.9 |
| colorBuild | 10.3 |
| total | 1153 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 25800608 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 74176760 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Step 2)

Summary:
- `transfer_total_bytes=48376152`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 31.4 |
| lineSplit | 30.7 |
| parseLoop | 1117.1 |
| typedArrayBuild | 6.8 |
| colorBuild | 8.2 |
| total | 1216.4 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 48376152 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Step 3)

Summary:
- `transfer_total_bytes=48376152`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 30.2 |
| lineSplit | 30.1 |
| parseLoop | 1136.9 |
| typedArrayBuild | 3 |
| colorBuild | 5 |
| total | 1233.3 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 48376152 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Step 4 - Run 1)

Summary:
- `transfer_total_bytes=48376152`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 26.3 |
| lineSplit | 0 |
| parseLoop | 1042.9 |
| typedArrayBuild | 6.6 |
| colorBuild | 3.7 |
| total | 1110.5 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 48376152 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Step 4 - Run 2)

Summary:
- `transfer_total_bytes=48376152`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 29.1 |
| lineSplit | 0 |
| parseLoop | 1112.0 |
| typedArrayBuild | 4.3 |
| colorBuild | 4.4 |
| total | 1171.8 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 48376152 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Step 4 - Run 3)

Summary:
- `transfer_total_bytes=48376152`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 28.8 |
| lineSplit | 0 |
| parseLoop | 1124.3 |
| typedArrayBuild | 12.5 |
| colorBuild | 4.8 |
| total | 1203.4 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 48376152 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Step 4 - 3 Runs)

Summary:
- `median_total_ms=1171.8`
- `median_parseLoop_ms=1112.0`
- `transfer_total_bytes=48376152`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Run | rotaryScan | lineSplit | parseLoop | typedArrayBuild | colorBuild | total |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 26.3 | 0 | 1042.9 | 6.6 | 3.7 | 1110.5 |
| 2 | 29.1 | 0 | 1112.0 | 4.3 | 4.4 | 1171.8 |
| 3 | 28.8 | 0 | 1124.3 | 12.5 | 4.8 | 1203.4 |
| Median | 28.8 | 0 | 1112.0 | 6.6 | 4.4 | 1171.8 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 48376152 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Step A+B - Run 1)

Summary:
- `ts=2026-02-15T14:43:24.978Z`
- `transfer_total_bytes=48376152`
- `peakHeap=null`
- `heapSupported=false`
- Compared to `mb-14 (Post Step 4 - 3 Runs)` median:
- `total: 1171.8 -> 836.9 ms` (`-28.6%`)
- `parseLoop: 1112.0 -> 783.6 ms` (`-29.5%`)
- `lineSplit + parseLoop: 1112.0 -> 783.6 ms` (`-29.5%`)

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 27.9 |
| lineSplit | 0 |
| parseLoop | 783.6 |
| typedArrayBuild | 3.6 |
| colorBuild | 5.1 |
| total | 836.9 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 48376152 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Phase 1 - Run 1)

Summary:
- `ts=2026-02-15T15:12:42.915Z`
- `transfer_total_bytes=71303168`
- `peakHeap=null`
- `heapSupported=false`
- Compared to `mb-14 (Post Step A+B - Run 1)`:
- `total: 836.9 -> 855.2 ms` (`+2.2%`)
- `parseLoop: 783.6 -> 798.6 ms` (`+1.9%`)
- `typedArrayBuild: 3.6 -> 0.1 ms` (`-97.2%`)
- `colorBuild: 5.1 -> 0.0 ms` (`-100.0%`)
- `transfer_total_bytes: 48376152 -> 71303168` (`+47.4%`)

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 29.5 |
| lineSplit | 0 |
| parseLoop | 798.6 |
| typedArrayBuild | 0.1 |
| colorBuild | 0 |
| total | 855.2 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 71303168 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-14 (Post Phase 2 - Run 1)

Summary:
- `ts=2026-02-15T15:28:29.661Z`
- `transfer_total_bytes=71303168`
- `peakHeap=null`
- `heapSupported=false`
- Compared to `mb-14 (Post Phase 1 - Run 1)`:
- `total: 855.2 -> 819.1 ms` (`-4.2%`)
- `parseLoop: 798.6 -> 772.8 ms` (`-3.2%`)
- `lineSplit + parseLoop: 798.6 -> 772.8 ms` (`-3.2%`)
- `typedArrayBuild: 0.1 -> 0.0 ms` (`-100.0%`)
- `colorBuild: 0.0 -> 0.0 ms` (`n/a`)
- `transfer_total_bytes: 71303168 -> 71303168` (`0.0%`)

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 28.9 |
| lineSplit | 0 |
| parseLoop | 772.8 |
| typedArrayBuild | 0 |
| colorBuild | 0 |
| total | 819.1 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 30486572 |
| vertices_bytes | 19350456 |
| frames_bytes | 3225088 |
| color_bytes | 25800608 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 71303168 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 806272 |
| virtualized_lines | 806272 |
| lines_with_data | 806272 |
| frames_len | 806272 |
| vertices_f32_len | 4837614 |
| color_values_len | 6450152 |
| color_vertices_len | 1612538 |
| toolchanges_len | 0 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 1766 |
| estimates_len | 806272 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 1 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 806272 |
| tokensSeen | 2416802 |
| groupsSeen | 806272 |
| handlerInvocations | 806272 |
| emitDataCount | 806272 |
| estimatesPushCount | 806272 |
| invalidLineCount | 0 |

### mb-28

Summary:
- `transfer_total_bytes=141018180`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 60.4 |
| lineSplit | 64.1 |
| parseLoop | 1916.5 |
| typedArrayBuild | 8.6 |
| colorBuild | 1395.4 |
| total | 3539.1 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 49049792 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 141018180 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| colors_tag_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Step 1)

Summary:
- `transfer_total_bytes=141018180`
- `peakHeap=null`
- `heapSupported=false`

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Step 2)

Summary:
- `transfer_total_bytes=91968388`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 55 |
| lineSplit | 59.2 |
| parseLoop | 2010.6 |
| typedArrayBuild | 9.6 |
| colorBuild | 12.2 |
| total | 2243.3 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 91968388 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Step 3)

Summary:
- `transfer_total_bytes=91968388`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 54.4 |
| lineSplit | 60.9 |
| parseLoop | 1839 |
| typedArrayBuild | 11.6 |
| colorBuild | 7.5 |
| total | 2098.3 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 91968388 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Step 4 - Run 1)

Summary:
- `transfer_total_bytes=91968388`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 51.6 |
| lineSplit | 0 |
| parseLoop | 1887.2 |
| typedArrayBuild | 5.2 |
| colorBuild | 6.5 |
| total | 2030.6 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 91968388 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Step 4 - Run 2)

Summary:
- `transfer_total_bytes=91968388`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 57.9 |
| lineSplit | 0 |
| parseLoop | 1957.8 |
| typedArrayBuild | 6.3 |
| colorBuild | 8.8 |
| total | 2140.6 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 91968388 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Step 4 - Run 3)

Summary:
- `transfer_total_bytes=91968388`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 59.7 |
| lineSplit | 0 |
| parseLoop | 1973.9 |
| typedArrayBuild | 5 |
| colorBuild | 6.6 |
| total | 2139.4 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 91968388 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Step 4 - 3 Runs)

Summary:
- `median_total_ms=2139.4`
- `median_parseLoop_ms=1957.8`
- `transfer_total_bytes=91968388`
- `peakHeap=null`
- `heapSupported=false`

Durations (`durationsMs`):

| Run | rotaryScan | lineSplit | parseLoop | typedArrayBuild | colorBuild | total |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 51.6 | 0 | 1887.2 | 5.2 | 6.5 | 2030.6 |
| 2 | 57.9 | 0 | 1957.8 | 6.3 | 8.8 | 2140.6 |
| 3 | 59.7 | 0 | 1973.9 | 5.0 | 6.6 | 2139.4 |
| Median | 57.9 | 0 | 1957.8 | 5.2 | 6.6 | 2139.4 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 91968388 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Step A+B - Run 1)

Summary:
- `ts=2026-02-15T14:42:39.185Z`
- `transfer_total_bytes=91968388`
- `peakHeap=null`
- `heapSupported=false`
- Compared to `mb-28 (Post Step 4 - 3 Runs)` median:
- `total: 2139.4 -> 1760.0 ms` (`-17.7%`)
- `parseLoop: 1957.8 -> 1563.3 ms` (`-20.2%`)
- `lineSplit + parseLoop: 1957.8 -> 1563.3 ms` (`-20.2%`)

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 61.2 |
| lineSplit | 0 |
| parseLoop | 1563.3 |
| typedArrayBuild | 5.6 |
| colorBuild | 21.5 |
| total | 1760 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 91968388 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Phase 1 - Run 1)

Summary:
- `ts=2026-02-15T15:12:15.124Z`
- `transfer_total_bytes=142606336`
- `peakHeap=null`
- `heapSupported=false`
- Compared to `mb-28 (Post Step A+B - Run 1)`:
- `total: 1760.0 -> 1741.7 ms` (`-1.0%`)
- `parseLoop: 1563.3 -> 1566.9 ms` (`+0.2%`)
- `typedArrayBuild: 5.6 -> 0.0 ms` (`-100.0%`)
- `colorBuild: 21.5 -> 0.1 ms` (`-99.5%`)
- `transfer_total_bytes: 91968388 -> 142606336` (`+55.1%`)

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 65.4 |
| lineSplit | 0 |
| parseLoop | 1566.9 |
| typedArrayBuild | 0 |
| colorBuild | 0.1 |
| total | 1741.7 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 142606336 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |

### mb-28 (Post Phase 2 - Run 1)

Summary:
- `ts=2026-02-15T15:28:02.510Z`
- `transfer_total_bytes=142606336`
- `peakHeap=null`
- `heapSupported=false`
- Compared to `mb-28 (Post Phase 1 - Run 1)`:
- `total: 1741.7 -> 1692.3 ms` (`-2.8%`)
- `parseLoop: 1566.9 -> 1515.6 ms` (`-3.3%`)
- `lineSplit + parseLoop: 1566.9 -> 1515.6 ms` (`-3.3%`)
- `typedArrayBuild: 0.0 -> 0.1 ms` (`n/a`)
- `colorBuild: 0.1 -> 0.0 ms` (`-100.0%`)
- `transfer_total_bytes: 142606336 -> 142606336` (`0.0%`)

Durations (`durationsMs`):

| Metric | Value |
|---|---:|
| rotaryScan | 63.5 |
| lineSplit | 0 |
| parseLoop | 1515.6 |
| typedArrayBuild | 0.1 |
| colorBuild | 0 |
| total | 1692.3 |

Bytes (`bytes`):

| Metric | Value |
|---|---:|
| input_utf16_bytes | 55988574 |
| vertices_bytes | 36787344 |
| frames_bytes | 6131252 |
| color_bytes | 49049792 |
| saved_color_bytes | 0 |
| spindle_speeds_bytes | 0 |
| transfer_total_bytes | 142606336 |

Worker Counts (`counts`):

| Metric | Value |
|---|---:|
| vm_data_events | 1532813 |
| virtualized_lines | 1532814 |
| lines_with_data | 1532813 |
| frames_len | 1532813 |
| vertices_f32_len | 9196836 |
| color_values_len | 12262448 |
| color_vertices_len | 3065612 |
| toolchanges_len | 1 |
| spindle_changes_len | 0 |
| spindle_speeds_len | 0 |
| paths_len | 217 |
| estimates_len | 1532813 |
| invalid_lines_len | 0 |
| spindle_tool_event_count | 4 |

Virtualizer Stats (`vm`):

| Metric | Value |
|---|---:|
| linesSeen | 1532814 |
| tokensSeen | 4554159 |
| groupsSeen | 1532814 |
| handlerInvocations | 1532813 |
| emitDataCount | 1532813 |
| estimatesPushCount | 1532813 |
| invalidLineCount | 0 |
