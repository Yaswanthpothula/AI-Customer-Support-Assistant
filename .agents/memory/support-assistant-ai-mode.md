---
name: Support assistant AI mode
description: The user's chosen default for optional Gemini-backed responses in the BrightCart support demo.
---

The support assistant should remain in demo mode without model calls unless the user explicitly asks to enable Gemini.

**Why:** The user chose the no-AI demo option after learning that Gemini calls would use Replit credits.

**How to apply:** Do not provision or call the Gemini integration as part of ordinary app changes. If the user later requests Gemini, explain that model usage consumes Replit credits before enabling it.
