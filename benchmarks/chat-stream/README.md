# Streaming chat interactions

Measures a seeded conversation corpus, controlled prompt submission, token
pumping, and conversation switching. The harness drives fixed token batches rather
than network or animation timers.

All targets must produce the same completed messages and clear streaming state.
Timings include queued DOM commits. DOM census and final text checks keep a
smaller or incomplete output from qualifying as faster.

From the repository root:

```sh
pnpm bench --quick chat-stream
pnpm bench chat-stream
pnpm bench --record chat-stream
pnpm bench --compare chat-stream
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
