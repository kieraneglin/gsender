# Old Branch Performance Baseline

## Scope
- Purpose: capture baseline metrics on the old branch before cross-branch comparison.
- Run count: 3 runs per file.
- Files under test:
  - MB-6
  - MB-14
  - MB-28

## Environment
- Date:
- Branch:
- Commit:
- Machine:
- Notes:

## Raw Runs

### MB-6 Run 1
```json
See `docs/performance/perf-baseline-old/mb6-run1.json`
```

### MB-6 Run 2
```json
See `docs/performance/perf-baseline-old/mb6-run2.json`
```

### MB-6 Run 3
```json
See `docs/performance/perf-baseline-old/mb6-run3.json`
```

### MB-14 Run 1
```json
See `docs/performance/perf-baseline-old/mb14-run1.json`
```

### MB-14 Run 2
```json
See `docs/performance/perf-baseline-old/mb14-run2.json`
```

### MB-14 Run 3
```json
See `docs/performance/perf-baseline-old/mb14-run3.json`
```

### MB-28 Run 1
```json
See `docs/performance/perf-baseline-old/mb28-run1.json`
```

### MB-28 Run 2
```json
See `docs/performance/perf-baseline-old/mb28-run2.json`
```

### MB-28 Run 3
```json
See `docs/performance/perf-baseline-old/mb28-run3.json`
```

## Summary (Medians)

| File | total_ms (r1/r2/r3) | median_total_ms | parseLoop_ms (r1/r2/r3) | median_parseLoop_ms | transfer_total_bytes (r1/r2/r3) | median_transfer_total_bytes |
|---|---:|---:|---:|---:|---:|---:|
| MB-6 | 598.2 / 763.7 / 684.5 | 684.5 | 526.4 / 691.7 / 610.5 | 610.5 | 24377068 / 24377068 / 24377068 | 24377068 |
| MB-14 | 1450.1 / 1409.5 / 1436.7 | 1436.7 | 1295.6 / 1251.7 / 1292.4 | 1292.4 | 48376152 / 48376152 / 48376152 | 48376152 |
| MB-28 | 2588.7 / 2691.4 / 2792.1 | 2691.4 | 2126.1 / 2226.3 / 2335.7 | 2226.3 | 91968388 / 91968388 / 91968388 | 91968388 |

## Optional Extra Metrics (Medians)

| File | rotaryScan_ms | typedArrayBuild_ms | colorBuild_ms | vm_data_events | invalid_lines_len |
|---|---:|---:|---:|---:|---:|
| MB-6 | 17.4 | 2.7 | 36.3 | 406291 | 0 |
| MB-14 | 35.9 | 5.3 | 79.4 | 806272 | 0 |
| MB-28 | 70.6 | 11.3 | 311.4 | 1532813 | 0 |

## Comparison Hand-off
- When switching branches, import this file as-is.
- Use this baseline against the new branch medians for percent change:
  - `delta% = ((new - old) / old) * 100`
  - Negative value means improvement for time/bytes metrics.
