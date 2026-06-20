# Tasks: Smart Digest & Market Intelligence Discord Bot

**Input**: Design documents from `/specs/001-smart-digest-eve-agent/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md  
**Tests**: Manual smoke tests only (no automated test tasks — not requested in spec)

**Organization**: Tasks grouped by user story (P1→P4). For a working digest, implement **US4 → US2 → US1** before US3, even though story phases follow spec priority order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1, US2, US3, US4 — maps to spec.md user stories
- Every task includes an exact file path

## Path Conventions

- **Eve agent root**: repository root with `agent/` directory per plan.md
- **Config**: `agent/lib/*.ts`
- **Tools**: `agent/tools/*.ts` (snake_case filenames)
- **Skills**: `agent/skills/*.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Eve project and runtime configuration

- [x] T001 Run `npx eve@latest init .` at repository root per `specs/001-smart-digest-eve-agent/plan.md` Phase A
- [x] T002 Set model to `openai/gpt-4o` in `agent/agent.ts` using `defineAgent`
- [x] T003 [P] Create `.env.example` documenting `OPENAI_API_KEY`, `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, `DISCORD_BOT_TOKEN`, and optional `YOUTUBE_CHANNEL_IDS`
- [x] T004 [P] Verify `dev`, `build`, and `start` scripts exist in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared Discord wiring and config that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Create `agent/lib/discord-config.ts` exporting `DIGEST_CHANNEL_ID = "123456789012345678"`
- [x] T006 [P] Create `agent/channels/discord.ts` exporting `discordChannel()` from `eve/channels/discord`
- [x] T007 [P] Create `agent/lib/youtube-config.ts` with `YOUTUBE_CHANNEL_IDS` (empty array default) and `YOUTUBE_LOOKBACK_HOURS = 48` per `specs/001-smart-digest-eve-agent/contracts/youtube-watchlist-config.md`
- [x] T008 Create minimal `agent/instructions.md` defining agent role, engineer-growth mission, and Discord markdown formatting rules

**Checkpoint**: Eve agent discovers Discord channel and config — run `npx eve info` to verify

---

## Phase 3: User Story 1 — Receive Daily Engineering Digest on Discord (Priority: P1) 🎯 MVP

**Goal**: Scheduled digest fires daily and delivers a formatted message to the configured Discord channel

**Independent Test**: Trigger `POST /eve/v1/dev/schedules/daily-digest` and verify a formatted message appears in the Discord channel (content improves after US2/US4)

### Implementation for User Story 1

- [x] T009 [US1] Create `agent/schedules/daily-digest.ts` with `cron: "0 8 * * *"` and `receive(discord, …)` handler per `specs/001-smart-digest-eve-agent/contracts/daily-digest-schedule.md`
- [x] T010 [US1] Import `DIGEST_CHANNEL_ID` from `agent/lib/discord-config.ts` as `target.channelId` in `agent/schedules/daily-digest.ts`
- [x] T011 [US1] Extend `agent/instructions.md` with schedule-triggered workflow: wake → ingest → filter → categorize → post to Discord
- [x] T012 [US1] Add empty-digest handling ("no high-signal items today") to `agent/instructions.md` per spec edge cases
- [x] T013 [US1] Smoke-test schedule dispatch via `POST /eve/v1/dev/schedules/daily-digest` per `specs/001-smart-digest-eve-agent/quickstart.md`

**Checkpoint**: Schedule starts a session and Discord receives a message (may be minimal until US2/US4 complete)

---

## Phase 4: User Story 2 — Curated Filtering Over Raw Headlines (Priority: P2)

**Goal**: Digest emphasizes engineering depth and excludes funding/marketing noise

**Independent Test**: Invoke digest with mixed HN stories; verify funding/marketing items are omitted and survivors are categorized

### Implementation for User Story 2

- [x] T014 [P] [US2] Create `agent/skills/research.md` with frontmatter `description` and include/exclude criteria per spec FR-006/FR-007 and `specs/001-smart-digest-eve-agent/data-model.md` ResearchLens
- [x] T015 [US2] Update `agent/instructions.md` to load `research` skill before filtering each digest run
- [x] T016 [US2] Update `agent/instructions.md` with categorized news sections (Infrastructure, AI, Backend, etc.) per `specs/001-smart-digest-eve-agent/contracts/discord-digest-format.md`

**Checkpoint**: Agent applies research lens and groups filtered stories under bold category headers

---

## Phase 5: User Story 3 — Must-Watch Videos from My YouTube Channels (Priority: P3)

**Goal**: Operator-configured YouTube channel IDs surface up to 3 must-watch videos with "why watch" lines

**Independent Test**: Add a known channel ID to `agent/lib/youtube-config.ts`, call `fetch_youtube_videos`, verify **Must-Watch** section in digest when a recent upload passes the filter

### Implementation for User Story 3

- [x] T017 [P] [US3] Add env override parsing for `YOUTUBE_CHANNEL_IDS` in `agent/lib/youtube-config.ts` per `specs/001-smart-digest-eve-agent/contracts/youtube-watchlist-config.md`
- [x] T018 [US3] Implement `agent/tools/fetch_youtube_videos.ts` with live RSS fetch per channel ID per `specs/001-smart-digest-eve-agent/contracts/fetch-youtube-videos-tool.md`
- [x] T019 [US3] Update `agent/instructions.md` to call `fetch_youtube_videos`, filter videos with research lens, and emit **Must-Watch** section (max 3, each with `Why:` line)
- [x] T020 [US3] Update schedule prompt in `agent/schedules/daily-digest.ts` to include YouTube fetch and must-watch steps

**Checkpoint**: Digest includes **Must-Watch** when watchlist has recent engineering-relevant uploads; section omitted when watchlist empty or no matches

---

## Phase 6: User Story 4 — Reliable News Ingestion from Public Front Page (Priority: P4)

**Goal**: Fetch top 15 HN front-page stories with title, URL, and points — real HTTP, no stubs

**Independent Test**: Call `fetch_tech_news` in dev TUI or HTTP session; confirm ≤15 stories each with title, url, points

### Implementation for User Story 4

- [x] T021 [US4] Implement `agent/tools/fetch_tech_news.ts` calling HN Algolia front_page API per `specs/001-smart-digest-eve-agent/contracts/fetch-tech-news-tool.md` and `specs/001-smart-digest-eve-agent/contracts/hn-algolia-api.md`
- [x] T022 [US4] Update `agent/instructions.md` to call `fetch_tech_news` as the first ingestion step of each digest run
- [x] T023 [US4] Smoke-test `fetch_tech_news` via dev session per `specs/001-smart-digest-eve-agent/quickstart.md` §5

**Checkpoint**: Tool returns 15 normalized stories; malformed Algolia hits skipped without crashing

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, end-to-end validation, documentation alignment

- [x] T024 [P] Run `npx eve build` and resolve any TypeScript errors under `agent/`
- [x] T025 Run full end-to-end digest smoke test (schedule dispatch + both tools + Discord delivery) per `specs/001-smart-digest-eve-agent/quickstart.md`
- [x] T026 [P] Run `npx eve info` and confirm discovery of tools `fetch_tech_news`, `fetch_youtube_videos`, schedule `daily-digest`, skill `research`, channel `discord`
- [x] T027 [P] Align `specs/001-smart-digest-eve-agent/quickstart.md` with final `agent/` layout if implementation diverged
- [x] T028 Verify digest message format matches `specs/001-smart-digest-eve-agent/contracts/discord-digest-format.md` (news categories + optional Must-Watch)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **User Stories (Phases 3–6)**: Depend on Foundational
- **Polish (Phase 7)**: Depends on all user story phases you intend to ship

### Recommended Implementation Order (for a working digest)

Spec lists US1 as P1 MVP, but **content requires ingestion and filtering first**:

1. Phase 1 Setup → Phase 2 Foundational  
2. **Phase 6 US4** (`fetch_tech_news`) — news data  
3. **Phase 4 US2** (`research` skill) — curation  
4. **Phase 3 US1** (schedule + delivery) — **MVP checkpoint**  
5. **Phase 5 US3** (YouTube) — enhancement  
6. Phase 7 Polish  

### User Story Dependencies

| Story | Depends on | Independently testable via |
|-------|------------|----------------------------|
| US1 (P1) | Foundational; full value needs US2 + US4 | Schedule dispatch → Discord message |
| US2 (P2) | Foundational; best tested with US4 data | Filter/categorize sample story batch |
| US3 (P3) | Foundational + US2 lens | `fetch_youtube_videos` + Must-Watch section |
| US4 (P4) | Foundational | `fetch_tech_news` tool invocation |

### Parallel Opportunities

**Phase 1**: T003 ∥ T004  
**Phase 2**: T005 ∥ T006 ∥ T007  
**Phase 4**: T014 (skill file) can start once T008 done  
**Phase 5**: T017 ∥ (after T007) while T018 waits for T017  
**Phase 7**: T024 ∥ T026 ∥ T027  

---

## Parallel Example: Foundational Phase

```bash
# After T001–T004, launch in parallel:
Task T005: "Create agent/lib/discord-config.ts"
Task T006: "Create agent/channels/discord.ts"
Task T007: "Create agent/lib/youtube-config.ts"
```

## Parallel Example: User Story 3

```bash
# After US2 complete:
Task T017: "Add env override in agent/lib/youtube-config.ts"
# Then sequentially:
Task T018: "Implement agent/tools/fetch_youtube_videos.ts"
Task T019–T020: "Update instructions and schedule"
```

---

## Implementation Strategy

### MVP First (Daily digest with curated HN news)

1. Complete Phase 1 Setup  
2. Complete Phase 2 Foundational  
3. Complete Phase 6 US4 (news fetch)  
4. Complete Phase 4 US2 (filtering skill)  
5. Complete Phase 3 US1 (schedule + Discord delivery)  
6. **STOP and VALIDATE** — daily digest with categorized HN stories  
7. Add Phase 5 US3 for YouTube Must-Watch  
8. Phase 7 Polish  

### Incremental Delivery

| Increment | Delivers |
|-----------|----------|
| Foundational | Runnable Eve agent with Discord channel |
| + US4 | Live HN front-page data |
| + US2 | Engineer-growth filtering and categories |
| + US1 | Scheduled daily Discord digest (**MVP**) |
| + US3 | Must-Watch YouTube section |
| + Polish | Production-ready build verification |

### Task Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| 1 Setup | T001–T004 (4) | — |
| 2 Foundational | T005–T008 (4) | — |
| 3 US1 P1 | T009–T013 (5) | US1 |
| 4 US2 P2 | T014–T016 (3) | US2 |
| 5 US3 P3 | T017–T020 (4) | US3 |
| 6 US4 P4 | T021–T023 (3) | US4 |
| 7 Polish | T024–T028 (5) | — |
| **Total** | **28 tasks** | |

---

## Notes

- Tool filenames MUST be snake_case (`fetch_tech_news.ts`, `fetch_youtube_videos.ts`) per Eve discovery rules
- No `agent.json` — use `agent/agent.ts` for model config
- Schedule file is `agent/schedules/daily-digest.ts`, not JSON
- Vercel cron uses UTC — document offset in operator setup if local 8 AM is required
- Do not commit `.env` with real credentials
- Commit after each phase checkpoint if using git workflow
