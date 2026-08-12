# Telegram Group Monitor — Status

Context doc for picking this conversation back up without re-deriving everything.
Two repos involved:
- **OmniscienceBackendServer** — Node/Express/TypeScript backend (`/mnt/user-data/uploads/OmniscienceBackendServer.zip`)
- **MassiveApp** — Next.js frontend on Amplify Gen 2 (`/mnt/user-data/uploads/MassiveApp.zip`)

Bot: `@Omnisciencetest_bot` (test), `@AutomatedReporting_bot` (prod, privacy mode NOT yet disabled on this one — see TODO)

## What this feature does

Bot sits in Telegram groups and watches client messages (privacy mode disabled so it sees everything, not just commands/mentions). For any message from someone **not** in the excluded list:
- Scans text for configured keywords (case-insensitive substring match)
- Detects tags/mentions via Telegram's `entities` array (not regex)
- If either matches, posts a formatted alert to a configured alert chat

Admins can manage the exclusion list live from inside any group with:
- `ignore-Omni @username` — add someone to the exclusion list (mention-picker tag, or reply-to-message also resolves an id)
- `unignore-Omni @username` — remove them

Deliberately NOT plain "ignore" — avoids false-triggering on a client saying "please ignore @B" in a normal sentence. Admin-only, checked live against Telegram via `getChatMember` (not cached).

## Architecture decisions made along the way

- **Webhook, not polling** (fits existing Express routes)
- **Config storage: DynamoDB via Amplify Gen 2**, one singleton row `id: "global"`
- **Auth for webhook**: Telegram's `secret_token` header (`X-Telegram-Bot-Api-Secret-Token`), NOT the app's normal `x-api-key` scheme — Telegram can't send that header. New `telegramWebhookAuth()` added to `securityFactory.ts` alongside `apiKeyAuth`.
- **companyUserIds field can hold either a numeric Telegram user id OR `@username`** — Telegram's Bot API has no way to resolve an arbitrary `@username` to a numeric id unless that user has messaged the bot, so mention-based ignores fall back to storing the username string. Matching checks both `message.from.id` and `message.from.username`.
- **Dashboard's "Excluded Company Members" is READ-ONLY** — by explicit user decision, that list may ONLY be mutated via `ignore-Omni`/`unignore-Omni` in chat, never from the dashboard. Enforced twice: no edit UI, AND the save service call physically never sends `companyUserIds` in its payload.
- **Exclusion-list DB writes touch ONLY the `companyUserIds` attribute** (see Bugs Fixed below for why — this was hard-won).

## Files — OmniscienceBackendServer (backend)

All under `src/`:

| File | Status | Purpose |
|---|---|---|
| `schema/telegramMonitor.schema.ts` | new | Zod schema for DynamoDB item shape (Amplify-style: `L` lists of `{S}`, plus `__typename`/`createdAt`/`updatedAt`) and for incoming Telegram webhook Update payload |
| `repositories/telegramMonitor.repository.ts` | new | `getTelegramMonitorConfig()` (cached 60s), `putTelegramMonitorConfig()` (legacy full-writer, now unused/dead code, kept for reference), `addExcludedIdentifiers()`/`removeExcludedIdentifiers()` (targeted `UpdateItem` touching ONLY `companyUserIds`) |
| `helper/telegram/telegramMonitor.helper.ts` | new | Pure logic: `isGroupChat`, `isCompanyMember` (checks id + username), `findMatchedKeywords`, `findTaggedUsers`, `evaluateMessage`, `buildAlertMessage` (escapes Telegram Markdown special chars), `parseAdminCommand` (the `ignore-Omni`/`unignore-Omni` parser), `identifierForTarget` |
| `controllers/telegramWebhook.controller.ts` | new | Webhook handler. Always ACKs Telegram with `200` immediately (before processing) to avoid retry storms. Ignores bot-authored messages (loop prevention). Routes to `handleAdminCommand` or the keyword/tag matcher. Structured logging throughout. |
| `routes/telegramWebhook.route.ts` | new | `POST /api/v1/telegramwebhook`, protected by `telegramWebhookAuth()` + rate limit |
| `routes/api.route.ts` | edited | Mounted the new webhook route |
| `security/securityFactory.ts` | edited | Added `telegramWebhookAuth()` — verifies Telegram's `secret_token` header via `crypto.timingSafeEqual` |
| `security/policyEngine.ts` | edited | Added `telegram:webhook` rate-limit profile (30/10s) |
| `services/telegram.service.ts` | edited | Added `isChatAdmin(chatId, userId)` method only — `sendMessage`/`sendPdf`/queue logic UNTOUCHED, confirmed byte-for-byte to user when they worried this might break existing hourly/status reports |
| `.env` | edited | Added `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_MONITOR_CONFIG_TABLE` |

## Files — MassiveApp (frontend)

| File | Status | Purpose |
|---|---|---|
| `amplify/data/resource.ts` | edited | Added `TelegramMonitorConfig` model: `companyUserIds`/`keywords` as `a.string().array()`, `alertChatId` as `a.string()`, `allow.publicApiKey()` auth (matches existing models) |
| `types/schema.ts` | edited | Added `TelegramMonitorConfig` type |
| `service/telegramMonitor.Service.tsx` | new | `getTelegramMonitorConfig()`, `saveTelegramMonitorConfig()` — save deliberately omits `companyUserIds` from its payload always. Has detailed `console.error(JSON.stringify(errors))` logging on both read and write paths (added after a silent-failure bug — see below). |
| `components/widgets/telegramMonitor/TelegramMonitorConfig.tsx` | new | Dashboard UI: read-only excluded-members chip list (points to `ignore-Omni` command), editable keywords chip list, editable alert chat id input, Save button. `ChipListEditor` commits a typed value on Enter, on the `+` button, AND on blur (so clicking Save right after typing doesn't lose it). The `+` button turns green/pulsing with a ring when there's unsaved draft text, to make it visually unmissable. |
| `app/(app)/telegrammonitor/page.tsx` | new | Page wrapper at route `/telegrammonitor` — NOTE: this app has no persistent sidebar/nav, routes are reached by direct URL only, matching how `/statusreport` etc. already work |

## Bugs found & fixed (chronological — useful if similar symptoms reappear)

1. **Feedback loop risk**: bot's own alert messages could re-trigger the webhook if posted into a monitored group and matched a keyword. Fix: `evaluateMessage` and the controller both skip any message where `message.from.is_bot` is true.
2. **Markdown parse failures on alert send**: client message text/names containing `_`, `*`, `` ` ``, `[` broke Telegram's legacy Markdown parser (`parse_mode: 'Markdown'`, hardcoded in `telegram.service.ts`, untouched). Fix: `escapeMarkdown()` in `buildAlertMessage` escapes those chars in all interpolated dynamic content before sending.
3. **DynamoDB item shape mismatch**: first draft used native DynamoDB String Set (`SS`) for `companyUserIds`/`keywords`. Amplify's Data client actually stores array fields as a `List` (`L` of `{S}`) plus `__typename`/`createdAt`/`updatedAt` metadata it manages itself. Fix: rewrote schema/repository to match `L` shape (mirrors how `statusReportConfig.schema.ts` already does it in this codebase).
4. **Full `PutItem` wiped Amplify metadata**: backend's `ignore-Omni` handler originally did a full-item `PutItem` write (`companyUserIds`, `keywords`, `alertChatId` only) which silently dropped `createdAt`/`updatedAt`/`__typename` — Amplify's Data client then failed to read the record back ("Field createdAt cannot be set to null since it's a required field"), and the dashboard showed everything as empty. **Manual one-time fix applied**: user added those 3 attributes back via DynamoDB console. **Code fix**: switched to `UpdateItemCommand` with `if_not_exists()` for `createdAt`/`__typename` so they're only set once and never clobbered again.
5. **`__typename` UpdateExpression syntax error**: DynamoDB's expression parser chokes on the literal attribute name `__typename` (leading double underscore). Fix: aliased via `ExpressionAttributeNames: { '#typename': '__typename' }`.
6. **Bigger structural bug — keywords silently wiped**: `addExcludedIdentifiers`/`removeExcludedIdentifiers` originally did read-whole-config → modify `companyUserIds` → write-whole-config-back. If the read ever failed/fell back to `defaultTelegramMonitorConfig` (empty), the subsequent write would overwrite real `keywords`/`alertChatId` with empty values — a real, repeatable data-loss path, not just a race condition. **Fix**: rewrote to `updateExcludedCompanyUserIds()` which does a `ProjectionExpression`-scoped read of ONLY `companyUserIds`, and an `UpdateExpression` that ONLY touches `companyUserIds` (+ metadata). Structurally cannot touch `keywords`/`alertChatId` anymore, regardless of any future bug elsewhere.
7. **Frontend "keywords not saving" — turned out to be UX, not a bug**: user was typing a keyword but never pressing Enter/tapping `+` to commit it to the chip list before hitting Save, so `config.keywords` was legitimately still empty. Root-caused via added `console.error(JSON.stringify(errors))` logging (previously silently swallowed with zero console output — also fixed). **UX fix**: added an `onBlur` auto-commit, a visible hint line under the input, and made the `+` button solid-colored + pulsing/ringed the moment there's uncommitted draft text.

## Current state (as of last message)

- ✅ Backend webhook live and tested via ngrok on `@Omnisciencetest_bot`, keyword + tag detection confirmed working end-to-end with real alerts landing in the configured chat
- ✅ `ignore-Omni @A` / `unignore-Omni @A` confirmed working, admin-gated, logged properly
- ✅ Dashboard at `/telegrammonitor` confirmed saving keywords/alertChatId correctly, excluded-members list correctly read-only and populated from chat commands
- ⚠️ Testing has all been on **ngrok + `@Omnisciencetest_bot`** — nothing deployed to a real public URL yet, and `@AutomatedReporting_bot` (the actual prod bot) has NOT had privacy mode disabled yet

## Revision 2 — Per-User Keywords + Bot-Tag Commands (this session)

Major architecture change from the original build. Full before/after:

| Area | BEFORE (rev 1) | AFTER (rev 2) |
|---|---|---|
| Keyword storage | One shared global keyword list on `TelegramMonitorConfig` | Each staff member has their own personal keyword list, stored in a new `TelegramUserKeyword` table (one row per Telegram user id) |
| Keyword match routing | Alert → shared `alertChatId` group | Alert → DM to every staff member whose personal keyword matched (all of them, if more than one matches) |
| Ignore + keyword interaction | Ignored sender → `evaluateMessage` returned `null` immediately, nothing evaluated at all | Ignored sender → still evaluated. Keyword matches now route to the centralized `alertChatId` instead of a personal DM, instead of being suppressed entirely |
| Ignore + tag interaction | Ignored sender → tags never checked (same early return) | Ignored sender → tags now checked too. Tags already always went to the centralized chat regardless of sender, so behavior is now consistent regardless of ignore status |
| Command trigger | Typed phrase: `ignore-Omni` / `unignore-Omni` | Tag the bot: `@<bot_username> ignore @A`, `@<bot_username> unignore @A` — bot's own username fetched via `getMe` and cached, so no hardcoded bot name |
| New commands | — | `@<bot> keyword = flow, scale` (add, comma-separated), `@<bot> delete_keyword = flow` (remove one or more), `@<bot> print_keyword` (list sender's own keywords in-chat) |
| Who can run what | ignore/unignore = admin only (only command that existed) | ignore/unignore = still admin only (unchanged). keyword/delete_keyword/print_keyword = self-service, but restricted to people already on the `companyUserIds` ignore list (used as a de-facto "known staff" registry) — NOT open to literally anyone, to prevent a client from tagging the bot and getting DM'd other people's flagged messages. This restriction was a judgment call flagged to and accepted implicitly by proceeding — revisit if it's ever too narrow/wide. |
| Dashboard | One editable shared "Keywords" chip list | Removed entirely. New read-only "Personal Keywords (Per Person)" card listing every staff member and their own keyword chips (name/username shown if known, else `id:<userId>`) |
| Alert chat field naming | `alertChatId`, called "Alert Destination" in UI | Same field, same name in code (no migration needed) — UI copy renamed to "Centralized Alert Chat" to reflect its narrower new role (tag matches + ignored-sender keyword matches only, not general keyword routing) |

### New files this revision
- `src/repositories/telegramUserKeyword.repository.ts` (backend) — Scan (cached 60s) + targeted per-user Get/Update, mirrors the "touch only what you own" pattern from `updateExcludedCompanyUserIds`
- `service/telegramUserKeywords.Service.tsx` (frontend) — read-only list of all per-user keyword records

### Rewritten files this revision
- `src/helper/telegram/telegramMonitor.helper.ts` — `evaluateMessage` no longer short-circuits on ignored senders; `parseAdminCommand` replaced by `parseBotCommand` (unified 5-command parser triggered by bot @mention, via `stripBotMention`); split `buildAlertMessage` into `buildPersonalAlertMessage` (DM) and `buildCentralizedAlertMessage` (shared chat)
- `src/controllers/telegramWebhook.controller.ts` — full routing rewrite: `handleIgnoreCommand` (admin-gated) + `handleKeywordCommand` (staff-gated self-service) + the DM-vs-centralized decision logic for evaluated messages. Includes a DM-failure fallback: if a personal DM fails (most likely because that staff member has never messaged the bot — a hard Telegram platform restriction, bots cannot initiate DMs), it falls back to posting in the centralized chat with a note, rather than silently losing the alert.
- `components/widgets/telegramMonitor/TelegramMonitorConfig.tsx` — removed the shared keyword editor entirely, added the read-only per-person keyword card, updated all in-app command syntax examples

### Edited files this revision
- `src/schema/telegramMonitor.schema.ts` — removed `keywords` from `TelegramMonitorConfig`, added `dynamoDbUserKeywordItemSchema`/`UserKeywordEntry`
- `src/repositories/telegramMonitor.repository.ts` — `putTelegramMonitorConfig` no longer writes `keywords`
- `src/services/telegram.service.ts` — added `getBotUsername()` (cached `getMe` call); `isChatAdmin` comment updated to drop the old `-Omni` phrasing reference; reporting-bot code path (`getTelegramService`) untouched
- `amplify/data/resource.ts` — `TelegramMonitorConfig` model dropped `keywords`; added new `TelegramUserKeyword` model
- `types/schema.ts` — `TelegramMonitorConfig` type dropped `keywords`; added `UserKeywordEntry`
- `service/telegramMonitor.Service.tsx` — dropped all `keywords` handling from get/save

### New env var needed
```
TELEGRAM_USER_KEYWORD_TABLE=<physical Dynamo table name for TelegramUserKeyword, from Amplify deploy output>
```

### Known constraint worth remembering
Telegram bots **cannot initiate a DM to someone who has never messaged the bot first** — this is a hard platform rule, not a bug. Every staff member who wants personal keyword alerts needs to send the bot at least one message (e.g. `/start`) before their DMs will work. The controller has a fallback (posts to centralized chat with a warning) for when this hasn't happened yet, so alerts aren't silently lost, but the DM won't reach them until they've messaged the bot once.

## Remaining TODO

1. Disable Group Privacy on `@AutomatedReporting_bot` (prod bot) via BotFather — same steps as done for the test bot
2. Deploy backend somewhere with a stable public HTTPS URL (currently only tested via ngrok, which changes URL every restart)
3. Re-run `setWebhook` pointing at the real production URL + real `TELEGRAM_WEBHOOK_SECRET`, for the prod bot
4. Add the bot to whatever real client groups it needs to monitor, re-adding if it was already a member before privacy mode was disabled (privacy setting only applies going forward, not retroactively to existing memberships)
5. Populate real keywords + real alert chat id in the prod dashboard (not the test data currently in there — `"scale"` keyword, test chat id, etc.)
6. Nothing else currently blocking — feature is functionally complete pending the above deploy steps

## Env vars needed (backend `.env`)

```
telegramBotToken=<already existed>
TELEGRAM_WEBHOOK_SECRET=<random string, also passed to setWebhook>
TELEGRAM_MONITOR_CONFIG_TABLE=<physical Dynamo table name from Amplify deploy output, e.g. TelegramMonitorConfig-<appId>-NONE>
```

## Key one-liners for next session

```bash
# Register webhook (run after every ngrok restart in dev, or once in prod)
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<domain>/api/v1/telegramwebhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"

# Confirm webhook registered
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```
