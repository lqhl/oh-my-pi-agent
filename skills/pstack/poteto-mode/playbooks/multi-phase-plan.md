### Multi-phase plan

The deliverable is a plan. Do not implement product code or begin a background goal merely because the plan has phases.

1. Ground the existing behavior with **how** and, where rationale matters, **why**. Inspect directly unless bounded source delegation is authorized. Children return source pointers and commands, not a source dump.
2. Settle observable uncertainties with cheap isolated prototypes when that exploration is within the planning request. Product or preference decisions that cannot be observed stay explicit open decisions.
3. Choose verifiable units. Each unit has one owner, a clear edit boundary, dependencies, an observable pass predicate, and evidence. Partition parallel writers into managed worktrees from a clean intended source; keep integration under one owner.
4. Write the plan to the user's chosen path, or a project-local `docs/<task>-plan.md`. Use the outline below, with concrete discovered paths and commands. Do not leave placeholders in the final plan.
5. Write with **technical-writing** and **unslop**. Read the final plan cold and check paths, dependency order, ownership, and whether every claimed outcome has a executable verification path. Mark unavailable prerequisites as blockers. A generic checker's pass cannot establish the correctness of the plan.
6. Hand back the plan path, choices, open decisions, and validation. Start execution only when the operator has requested it, using the matching bounded playbook and the native Pi execution contract.

## Outline

- **Outcome and boundaries.** The user-visible result, acceptance criteria, allowed scope, and constraints.
- **Current behavior.** Source entry points and the evidence that matters to the design.
- **Target shape.** Ownership, data structures, interfaces, and rejected alternatives.
- **Units and dependencies.** One section per unit with its owner, files, predecessor, implementation steps, and finish condition.
- **Verification per unit.** Meaningful tests; a real CLI/UI/API/data path when behavior changes; retained evidence and its pass predicate. Performance gates apply when the task changes or claims performance, with comparable baseline and treatment. Do not require arbitrary lane counts or invent an old-version baseline for a feature that did not exist.
- **Integration and delivery.** One integration owner, verification on the combined result, intended branch/PR sequence, and any actual operator gate.
- **Risks and blockers.** Concrete prerequisites, unresolved decisions, attempted evidence, and the next input needed.

When cross-model or parallel checks are part of the requested plan, name the model roles, independent slices, native async dependency barriers, and output locations. Explicitly requested goal mode uses the installed `pi-goal-writer` to form a durable outcome, constraints, iteration policy, and blocked stop condition. Do not add another scheduler.

**Reply:** the plan path, what it establishes, verification of the plan, and any decision execution still requires.
