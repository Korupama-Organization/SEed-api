# 06 Discovery - LiveKit Livestream Foundation

## Discovery Level
Level 2 (standard research) due to new external integration (LiveKit) not present in existing stack.

## What Was Evaluated
- Existing auth and enrollment authorization patterns in current backend
- Current infrastructure integrations and configuration handling
- LiveKit integration assumptions for room and token lifecycle

## Decision
Use LiveKit as locked livestream backend for milestone 1.1 phase 06.

## Must-Keep Constraints
- Teacher-only control actions
- Join only after teacher start
- No join after explicit teacher end
- Public/private access mode per stream
- Single-device active participation per user

## Discovery Output for Planning
- Plan must include LiveKit adapter layer and avoid provider logic in controllers.
- Plan must include explicit user_setup frontmatter for LiveKit credentials and host config.
- Plan must include integration tests covering lifecycle and access policy truths.
