### Feature

**You own the design. Plan, implement, review, verify.** Delegate only when authorized under the Pi execution contract.

1. `how` over the affected subsystem.
2. Use `architect` when the feature needs a new structure or crosses a meaningful design boundary. Keep a small extension in the existing shape.
3. Write the throughput checkpoint as four todo items. A dimension that genuinely does not apply (single file, no fan-out) keeps its item with `n/a: <reason>` rather than being dropped:
   - **Blocking first steps.** Gates run before fan-out.
   - **Independent workstreams.** Disjoint files, services, or layers parallelize. Shared writes serialize.
   - **Shared mutable state.** Default to splitting the target (the **separate-before-serializing-shared-state** principle skill). Serialize only for real invariants.
   - **Smallest safe decomposition.** If one worker is best, name why.
4. Implement from a specific scope: allowed paths, named data shape, organizing structure, and acceptance criteria. If delegation is authorized, use a bounded native `poteto-agent`; competing valid shapes can use **arena** inside the same workflow. The parent reviews delegated work. Children own their assigned step directly and do not spawn again. Apply **Comments**, surgical edits, and source grounding. Update affected consumers within the authorized change and verify each.
5. Verify on the matching surface. "Inconclusive" or wrong-surface is not a pass. Flag it.
6. Build and verify in small ordered units per **sequence-verifiable-units**. Keep commits similarly ordered when committing is part of delivery. Preserve unrelated history.
7. If the design is contested, use `interrogate` within authorized delegation, or mark independent cross-model review unperformed.
8. Prepare delivery under **Opening a PR** when requested; otherwise report the checked local diff.

Keep code coupled across the feature under one owner. For authorized parallel work, the parent partitions exclusive write boundaries and integrates after dependencies pass. Rewrite the checkpoint at phase boundaries. Use the native status/resume contract for known follow-up roles; ordinary children remain leaves.

**Reply:** what you built, what you chose and why, the throughput checkpoint, open decisions. Tables for design alternatives.
