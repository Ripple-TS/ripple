# Ripple benchmark baseline

Recorded from 3 independent normal runs on Intel(R) Core(TM) i9-9980HK CPU @ 2.40GHz, darwin/x64, Node v24.18.0.

Workload SHA-256: `d57ecabaa85755644834750a4181058cb80969c2d7f97fe4ad95a120a4e28620`.
Lockfile SHA-256: `ed3c2efa3d1fdd72c4980173d1b09c4160efd0dd1537d0b7918ede3bbcd96e9c`.

These are baseline observations before Ripple optimization. Scores below are medians of the per-run headline scores; the range shows run-to-run variation. The p95 column is the median of the per-run p95 values. RME remains a per-run diagnostic; neither is proof of a timing win. Each framework column is that framework's score relative to Ripple's (Ripple = 1): above 1 the framework is slower than Ripple, below 1 it is faster. For timings below 0.01 ms or a zero Ripple score, the column shows the framework's score minus Ripple's instead (positive means slower than Ripple). N/A means that operation has no matching competitor fixture.

## Verified environment

```json
{
  "ripple": "0.4.2",
  "@ripple-ts/vite-plugin": "0.4.2",
  "@tsrx/ripple": "0.2.1",
  "octane": "0.2.6",
  "solid-js": "2.0.0-rc.7",
  "@solidjs/web": "2.0.0-rc.7",
  "vite-plugin-solid": "3.0.0-next.26",
  "vue": "3.6.0-rc.1",
  "@vue/runtime-vapor": "3.6.0-rc.1",
  "react": "19.2.7",
  "react-dom": "19.2.7",
  "preact": "10.29.8",
  "svelte": "5.56.7",
  "inferno": "9.1.0",
  "vite": "8.1.5",
  "babel-plugin-react-compiler": "1.0.0"
}
```

## Largest timing gaps to investigate later

These candidates are ranked by absolute time difference from the best matching competitor, without starting performance work.


## bundle-size

| Operation | Unit | Ripple score [run range] | p95 | Max RME | Samples | Octane TSRX | Octane JSX | Solid | Vue Vapor | Best matching competitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| js_raw | bytes | 25998 [25998, 25998] | 25998 | 0.0% | 3 | 3.45× | 6.81× | 1.60× | 2.47× | preact: 25247 |
| js_gzip | bytes | 9961 [9961, 9961] | 9961 | 0.0% | 3 | 3.03× | 5.72× | 1.57× | 2.42× | preact: 9990 |
| js_brotli | bytes | 8970 [8970, 8970] | 8970 | 0.0% | 3 | 3.00× | 5.55× | 1.58× | 2.43× | preact: 9056 |
| app_raw | bytes | 7522 [7522, 7522] | 7522 | 0.0% | 3 | 0.95× | 1.12× | 0.85× | 0.87× | svelte: 5149 |
| app_gzip | bytes | 2294 [2294, 2294] | 2294 | 0.0% | 3 | 1.05× | 1.29× | 0.87× | 0.91× | solid: 1990 |
| app_brotli | bytes | 2029 [2029, 2029] | 2029 | 0.0% | 3 | 1.05× | 1.24× | 0.87× | 0.92× | solid: 1763 |
| fw_raw | bytes | 18476 [18476, 18476] | 18476 | 0.0% | 3 | 4.46× | 9.13× | 1.91× | 3.12× | preact: 19940 |
| fw_gzip | bytes | 7667 [7667, 7667] | 7667 | 0.0% | 3 | 3.62× | 7.04× | 1.79× | 2.87× | preact: 7985 |
| fw_brotli | bytes | 6941 [6941, 6941] | 6941 | 0.0% | 3 | 3.57× | 6.81× | 1.79× | 2.87× | preact: 7273 |
| todo_js_raw | bytes | 24827 [24827, 24827] | 24827 | 0.0% | 3 | 3.84× | N/A | 1.56× | 2.57× | preact: 16244 |
| todo_js_gzip | bytes | 10234 [10234, 10234] | 10234 | 0.0% | 3 | 3.17× | N/A | 1.48× | 2.38× | preact: 6841 |
| todo_js_brotli | bytes | 9183 [9183, 9183] | 9183 | 0.0% | 3 | 3.14× | N/A | 1.49× | 2.41× | preact: 6180 |
| todo_app_raw | bytes | 4293 [4293, 4293] | 4293 | 0.0% | 3 | 1.09× | N/A | 0.69× | 0.72× | preact: 2156 |
| todo_app_gzip | bytes | 1837 [1837, 1837] | 1837 | 0.0% | 3 | 1.23× | N/A | 0.70× | 0.74× | preact: 991 |
| todo_app_brotli | bytes | 1579 [1579, 1579] | 1579 | 0.0% | 3 | 1.24× | N/A | 0.71× | 0.76× | preact: 868 |
| todo_fw_raw | bytes | 20534 [20534, 20534] | 20534 | 0.0% | 3 | 4.42× | N/A | 1.74× | 2.96× | preact: 14088 |
| todo_fw_gzip | bytes | 8397 [8397, 8397] | 8397 | 0.0% | 3 | 3.59× | N/A | 1.65× | 2.75× | preact: 5850 |
| todo_fw_brotli | bytes | 7604 [7604, 7604] | 7604 | 0.0% | 3 | 3.53× | N/A | 1.65× | 2.75× | preact: 5312 |
| chat_js_raw | bytes | 26324 [26324, 26324] | 26324 | 0.0% | 3 | 3.59× | N/A | 1.54× | 2.56× | preact: 17744 |
| chat_js_gzip | bytes | 11086 [11086, 11086] | 11086 | 0.0% | 3 | 2.90× | N/A | 1.45× | 2.34× | preact: 7607 |
| chat_js_brotli | bytes | 9993 [9993, 9993] | 9993 | 0.0% | 3 | 2.87× | N/A | 1.46× | 2.36× | preact: 6886 |
| chat_app_raw | bytes | 5311 [5311, 5311] | 5311 | 0.0% | 3 | 1.12× | N/A | 0.82× | 0.86× | preact: 3898 |
| chat_app_gzip | bytes | 2428 [2428, 2428] | 2428 | 0.0% | 3 | 1.14× | N/A | 0.87× | 0.89× | preact: 1846 |
| chat_app_brotli | bytes | 2161 [2161, 2161] | 2161 | 0.0% | 3 | 1.13× | N/A | 0.87× | 0.90× | preact: 1645 |
| chat_fw_raw | bytes | 21013 [21013, 21013] | 21013 | 0.0% | 3 | 4.22× | N/A | 1.72× | 2.99× | preact: 13846 |
| chat_fw_gzip | bytes | 8658 [8658, 8658] | 8658 | 0.0% | 3 | 3.40× | N/A | 1.62× | 2.75× | preact: 5761 |
| chat_fw_brotli | bytes | 7832 [7832, 7832] | 7832 | 0.0% | 3 | 3.35× | N/A | 1.62× | 2.76× | preact: 5241 |
| weather_js_raw | bytes | 42375 [42375, 42375] | 42375 | 0.0% | 3 | 3.13× | N/A | 1.26× | N/A | preact: 29422 |
| weather_js_gzip | bytes | 15774 [15774, 15774] | 15774 | 0.0% | 3 | 2.81× | N/A | 1.23× | N/A | preact: 10641 |
| weather_js_brotli | bytes | 13975 [13975, 13975] | 13975 | 0.0% | 3 | 2.78× | N/A | 1.25× | N/A | preact: 9528 |
| weather_app_raw | bytes | 19087 [19087, 19087] | 19087 | 0.0% | 3 | 1.18× | N/A | 0.89× | N/A | inferno: 13677 |
| weather_app_gzip | bytes | 6365 [6365, 6365] | 6365 | 0.0% | 3 | 1.25× | N/A | 0.85× | N/A | inferno: 4475 |
| weather_app_brotli | bytes | 5470 [5470, 5470] | 5470 | 0.0% | 3 | 1.24× | N/A | 0.86× | N/A | inferno: 3900 |
| weather_fw_raw | bytes | 23288 [23288, 23288] | 23288 | 0.0% | 3 | 4.73× | N/A | 1.56× | N/A | preact: 14254 |
| weather_fw_gzip | bytes | 9409 [9409, 9409] | 9409 | 0.0% | 3 | 3.86× | N/A | 1.50× | N/A | preact: 5906 |
| weather_fw_brotli | bytes | 8505 [8505, 8505] | 8505 | 0.0% | 3 | 3.77× | N/A | 1.50× | N/A | preact: 5362 |
