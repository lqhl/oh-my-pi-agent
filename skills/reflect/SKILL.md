---
name: reflect
description: Review chat history to identify mistakes, friction points, and improvement opportunities. Check used skills for quality. Propose reusable skills for recurring patterns. Use this skill when the user types "reflect", AND proactively invoke it when you notice repeated errors, user frustration, or the same problem surfacing more than once in a conversation.
---

# Reflect

A structured retrospective on the current conversation. Triggered by the user typing "reflect", or auto-invoked when repeated problems are detected.

## When to auto-invoke

Fire this skill automatically (without the user asking) when any of these happen:
- The same type of mistake occurs twice in one conversation (e.g., wrong file path format, missing config param, same test failure)
- The user corrects you on the same thing twice
- The user expresses frustration ("ugh", "no that's wrong again", "this is taking forever")
- A task takes 3+ back-and-forth turns beyond what it should

When auto-invoking, lead with: "I'm noticing some repeated friction — let me do a quick reflect."

## Steps

### 1. Review the conversation

Scan the full chat and identify:
- **Mistakes** — errors in code, logic, tool usage, or factual claims you made
- **Friction** — repeated clarifications, unnecessary back-and-forth, things the user had to correct
- **Unclear outputs** — overly verbose responses, missing context, poor formatting
- **Missed opportunities** — better approaches you didn't suggest, obvious shortcuts you ignored

Be honest and specific. Reference the actual exchange where each issue occurred.

### 2. Propose improvements

Create a short list (3-7 items) of concrete improvements. Each item should be:
- A one-line description of the issue
- A specific fix or behavior change

Format:

```
## Improvements

1. **[Category]**: Issue → Fix
2. ...
```

Focus on things that are actionable and would make a difference if remembered. Skip trivial or one-off issues that won't recur.

### 3. Check skills used in this chat

If any skills were invoked during this conversation, quickly check:
- Did the skill produce the expected result?
- Was the output bloated or missing key info?
- Any obvious improvements to the skill's instructions?

If issues are found, propose specific edits. Ask: "Should I apply these skill fixes now?"

### 4. Detect reusable patterns

If you notice the user asked you to do similar tasks 2+ times in this chat:
1. Describe the pattern
2. Propose a skill name and one-line description
3. Ask: "Want me to create a skill for this?"

### 5. Ask what to remember

Present the improvement list and ask:

> **Which of these should I save for future chats?**
> Reply with numbers (e.g., "1, 3, 5") or "all" / "none".

### 6. Save to memory

For each item the user confirms, save it as a **feedback** memory using the memory system (write a file to the memory directory and update MEMORY.md). This ensures the learning persists across conversations.

If the improvement is a project-wide rule (e.g., "always use X pattern in this codebase"), add it to the project's `CLAUDE.md` instead.
