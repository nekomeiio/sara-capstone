Outfit-Picker AI Agent — Detailed Build Plan
0. AI Model Policy — Gemini Only, Everywhere
Every AI decision at runtime is made by Gemini. No other model is called by the running application, ever. This applies to:
Wardrobe item tagging (vision)
Inspiration image style extraction (vision)
Style profile merging (text)
Prompt-based outfit generation (text/agentic)
Try Something New generation (text/agentic)
Any retry/fallback reasoning
Claude (via Claude Code) is used only as the development tool that writes the codebase — it has no runtime role and makes no calls inside the shipped product. If at any point a library, template, or tutorial suggests wiring in OpenAI/Claude/another model "for comparison" or "as a fallback," that's out of scope — the fallback path for AI failures is the deterministic backend randomizer described in Section 5, not a second AI provider.
One API key, one provider: your .env should only ever need GEMINI_API_KEY. If Claude Code's scaffold generates a .env.example with any other AI provider key in it, that's a signal something drifted from spec — flag it and remove it.
1. Tech Stack (specific choices)
Layer	Choice	Why
Frontend	Next.js 14 (App Router) + TypeScript	API routes + frontend in one repo, simplest for Claude Code to scaffold
Styling	Tailwind CSS	fast to iterate, no design system overhead needed at MVP stage
DB	SQLite via Prisma ORM (dev) → swap to Postgres via same Prisma schema for prod	Prisma makes the swap a config change, not a rewrite
Image storage	Local /public/uploads/ folder at MVP → S3-compatible bucket later	Don't build cloud storage before you need it
AI	Gemini 1.5 Flash for vision tagging (cheap, fast), Gemini 1.5 Pro for outfit reasoning (better reasoning over structured JSON)	Split by task cost/complexity
Auth	Skip at MVP (single-user, no login) → NextAuth.js if you add multi-user later	Confirm with yourself before building this — don't let Claude Code build auth you don't need yet
2. Exact Database Schema (Prisma syntax)
model WardrobeItem {
  id               String   @id @default(cuid())
  imageUrl         String
  category         String   // top | bottom | dress | outerwear | shoes | accessory | bag | other
  subcategory      String
  primaryColor     String
  secondaryColors  String   // stored as comma-separated or JSON string
  pattern          String
  materialGuess    String
  formality        Int      // 1-5
  seasons          String   // JSON array as string: ["summer","fall"]
  fitStyle         String
  tags             String   // JSON array as string
  userConfirmed    Boolean  @default(false) // true once user reviews/edits Gemini's tags
  createdAt        DateTime @default(now())
  outfitLinks      OutfitItem[]
}

model WornOutfit {
  id            String   @id @default(cuid())
  dateWorn      DateTime
  contextNote   String?  // "date night", "work", etc — optional
  sourceType    String   // "logged_manually" | "generated_accepted"
  createdAt     DateTime @default(now())
  items         OutfitItem[]
}

model OutfitItem {
  id             String        @id @default(cuid())
  wardrobeItemId String
  wardrobeItem   WardrobeItem  @relation(fields: [wardrobeItemId], references: [id])
  wornOutfitId   String
  wornOutfit     WornOutfit    @relation(fields: [wornOutfitId], references: [id])
}

model InspirationImage {
  id                String   @id @default(cuid())
  imageUrl          String
  aestheticLabels   String   // JSON array as string
  colorPalette      String   // JSON array as string
  silhouetteNotes   String
  formalityRangeMin Int
  formalityRangeMax Int
  moodDescription   String
  createdAt         DateTime @default(now())
}

model StyleProfile {
  id                     String   @id @default("singleton") // one row, single-user MVP
  dominantAesthetics     String   // JSON array as string
  preferredColors        String   // JSON array as string
  formalityComfortMin    Int
  formalityComfortMax    Int
  styleSummary           String
  lastGeneratedAt        DateTime @updatedAt
}

model GeneratedSuggestion {
  id            String   @id @default(cuid())
  triggerType   String   // "prompt" | "try_something_new"
  promptText    String?  // null for try_something_new
  itemIdsJson   String   // JSON array of WardrobeItem ids as string
  explanation   String
  confidence    String?  // "high" | "medium" | "low" — prompt mode only
  noveltyNote   String?  // try_something_new mode only
  wasAccepted   Boolean  @default(false)
  createdAt     DateTime @default(now())
}
Why item IDs are stored as JSON strings in GeneratedSuggestion and WardrobeItem (tags/colors) instead of relational tables everywhere: at MVP scale (one user, hundreds of items) this avoids join complexity for fields you're only ever reading as a whole blob. OutfitItem is the one place a real join table is used, because dedup logic needs to query it directly.
3. Exact API Routes
POST   /api/wardrobe/upload          — multipart upload, triggers Gemini vision tagging, returns tagged item
PATCH  /api/wardrobe/:id              — user corrects tags, sets userConfirmed = true
GET    /api/wardrobe                  — list all wardrobe items (with filter query params: category, formality)
DELETE /api/wardrobe/:id

POST   /api/inspiration/upload        — multipart upload, triggers Gemini vision style extraction
POST   /api/style-profile/regenerate  — re-runs merge step (#2b) over all InspirationImage rows
GET    /api/style-profile             — returns current StyleProfile row

POST   /api/outfits/worn              — manually log a worn outfit (item IDs + date + note)
GET    /api/outfits/worn              — outfit history, paginated, sorted by dateWorn desc
POST   /api/outfits/worn/:suggestionId/accept  — converts a GeneratedSuggestion into a WornOutfit row

POST   /api/generate/prompt           — body: { promptText: string } → runs prompt-based generator
POST   /api/generate/try-new          — no body needed → runs try-something-new generator
4. Gemini Call Configuration (specific params)
// Vision tagging call (wardrobe items + inspiration images)
model: "gemini-1.5-flash"
generationConfig: {
  temperature: 0.2,       // low — you want consistent, literal tagging, not creativity
  responseMimeType: "application/json"  // forces valid JSON output, use this instead of prompt-only instruction
}

// Outfit reasoning calls (prompt-based + try-something-new)
model: "gemini-1.5-pro"
generationConfig: {
  temperature: 0.7,       // higher — you want some creative variation in combos
  responseMimeType: "application/json"
}
Use responseMimeType: "application/json" (Gemini's structured output mode) rather than relying purely on "return only JSON" instructions in the prompt — it's enforced at the API level and eliminates most parsing failures.
4a. Making This an Actual Agent (Gemini Function Calling)
So far, sections 3-4 describe Gemini as a set of one-shot prompt→JSON calls, with your backend manually assembling context (wardrobe, history, style profile) before every call. That works, but it's not really "agentic" — it's scripted. To make Gemini the actual reasoning agent driving the whole product, give it tools it can call itself, rather than pre-stuffing every prompt with everything it might need.
Define these as Gemini function-calling tools (using the Gemini API's tools/functionDeclarations config):
const tools = [
  {
    functionDeclarations: [
      {
        name: "get_wardrobe_items",
        description: "Fetch the user's wardrobe, optionally filtered by category or formality range",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["top","bottom","dress","outerwear","shoes","accessory","bag","other"] },
            minFormality: { type: "number" },
            maxFormality: { type: "number" }
          }
        }
      },
      {
        name: "get_worn_outfit_history",
        description: "Fetch past worn outfits as sets of item IDs, optionally within a date range",
        parameters: {
          type: "object",
          properties: {
            sinceDate: { type: "string", description: "ISO date, optional" }
          }
        }
      },
      {
        name: "get_style_profile",
        description: "Fetch the user's derived style profile summary",
        parameters: { type: "object", properties: {} }
      },
      {
        name: "check_combination_is_novel",
        description: "Check whether a candidate set of item IDs overlaps too heavily with any past worn outfit",
        parameters: {
          type: "object",
          properties: {
            itemIds: { type: "array", items: { type: "string" } }
          },
          required: ["itemIds"]
        }
      }
    ]
  }
];
Agent loop (both /api/generate/prompt and /api/generate/try-new use this same loop, just with a different initial instruction):
Send Gemini the user's request (their prompt text, or "generate something new" for the button) plus the tools config — but NOT the full wardrobe dump up front.
Gemini decides which tools it needs (e.g. calls get_wardrobe_items, then get_style_profile, then for try-new specifically also get_worn_outfit_history and finally check_combination_is_novel on its own candidate before returning it).
Your backend executes each requested function call against the real DB (these map directly to the Prisma queries in Section 2/5), and returns the results to Gemini in the next turn.
Repeat until Gemini stops requesting tools and returns a final JSON outfit suggestion (same schemas as Section 4's prompt templates).
Why this is better than the scripted version:
Gemini only pulls the data it decides it actually needs (e.g., it might filter wardrobe by category itself instead of you sending all 200 items every time)
The novelty check (Section 5's dedup logic) becomes a tool Gemini calls on itself before answering, rather than a check your backend bolts on after the fact — though you should still re-run the hard filter in Section 5 server-side as a final safety net, since a tool call is still just the model choosing to use it correctly
This is the actual definition of an "agent" per Google's Gemini docs: a model that reasons over multiple tool calls to reach a goal, versus a single-shot completion
Fallback if you'd rather not build function calling for MVP: the scripted single-shot version in Sections 3-5 works fine and is simpler to ship first. Build that in Phase 3/4, then upgrade to the function-calling agent loop as a Phase 7 once the core product works — don't let agent architecture block your first working version.
5. Dedup Logic for "Try Something New" (exact algorithm)
Don't trust the model's output as final. After Gemini returns a candidate item_ids set:
function isDuplicateOrNearDuplicate(candidateIds, pastOutfitIdSets) {
  const candidateSet = new Set(candidateIds);
  for (const pastSet of pastOutfitIdSets) {
    const pastSetAsSet = new Set(pastSet);
    const intersection = [...candidateSet].filter(id => pastSetAsSet.has(id));
    const overlapRatio = intersection.length / Math.max(candidateSet.size, pastSetAsSet.size);
    if (overlapRatio >= 0.75) return true; // 75%+ item overlap = treat as a repeat
  }
  return false;
}
Backend flow for /api/generate/try-new:
Fetch all WardrobeItem rows + all WornOutfit → OutfitItem sets
Call Gemini with wardrobe + past-outfit-sets as context
Run isDuplicateOrNearDuplicate() on the response
If duplicate → re-call Gemini once with an explicit "that overlapped too much, try again avoiding item set X" retry prompt
If still duplicate after 1 retry → fall back to a simple backend-side randomizer: pick one item per category not present in the most-recently-worn 5 outfits, skip Gemini reasoning entirely, return with explanation: "Fresh pick from your less-worn pieces."
This retry-then-fallback pattern means the feature never fully fails, even if Gemini keeps producing overlapping combos.
6. Frontend Components (specific breakdown)
/app
  /wardrobe/page.tsx         — grid of uploaded items, upload button, tag-edit modal
  /inspiration/page.tsx      — grid of inspiration images, upload button
  /page.tsx (home)           — prompt text box + "Try Something New" button + suggestion display area
  /history/page.tsx          — calendar or reverse-chron list of WornOutfit rows

/components
  UploadDropzone.tsx         — reused across wardrobe/inspiration uploads, accepts drag-drop + click
  TagEditModal.tsx           — shows Gemini's auto-tags as editable form fields
  OutfitCard.tsx             — displays a suggestion: item thumbnails laid out top/bottom/shoes, explanation text, "Mark as Worn" + "Regenerate" buttons
  PromptBox.tsx              — textarea + submit button, calls /api/generate/prompt
  TryNewButton.tsx           — calls /api/generate/try-new, shows loading state (Gemini calls take 2-5s)
  HistoryCalendar.tsx        — simple month-grid view, click a day to see what was worn
Loading state matters here — Gemini calls are not instant. Every generation action needs a visible loading indicator (skeleton or spinner), not a frozen button.
7. Build Order (with concrete deliverables per phase)
Phase 1 — Scaffold
Next.js + Prisma + SQLite initialized
Schema above migrated
Empty pages for all 4 routes above, basic nav between them
✅ Done when: app runs locally, all pages load with placeholder content
Phase 2 — Wardrobe upload + tagging
UploadDropzone + /api/wardrobe/upload wired to Gemini vision
TagEditModal for corrections
Wardrobe grid page showing all items with their tags
✅ Done when: you can upload 10 real clothing photos and see correct-ish tags on all of them
Phase 3 — Prompt-based generator
PromptBox + /api/generate/prompt wired to Gemini 1.5 Pro
OutfitCard rendering the response
✅ Done when: typing "party tonight, chic" returns a real outfit from your uploaded wardrobe with a sensible explanation
Phase 4 — Try Something New + worn history
Manual "log a worn outfit" flow first (needed to have history data to test against)
/api/generate/try-new + dedup algorithm above
"Mark as Worn" button on OutfitCard → creates WornOutfit row
✅ Done when: clicking Try Something New never returns a combo matching your logged history, verified by manually testing with a small wardrobe where you can check by hand
Phase 5 — Inspiration + style profile
Inspiration upload page + Gemini style extraction
Style profile merge job
Wire styleSummary into the Phase 3 prompt as additional context
✅ Done when: adding 5 inspiration images changes the tone/explanation of prompt-based suggestions
Phase 6 — History view + polish
HistoryCalendar page
Empty states (no wardrobe items yet, no worn history yet, fewer than ~5 items so Try Something New has little to work with)
Basic error toasts for failed Gemini calls (network errors, malformed JSON responses)
8. Edge Cases to Explicitly Handle
Fewer than ~5 wardrobe items: disable "Try Something New" with a message like "Add a few more items to unlock this" rather than returning a degenerate/empty combo
Gemini returns malformed JSON despite responseMimeType: wrap every parse in try/catch, retry once, then show user a "couldn't generate, try again" error rather than crashing
User uploads a non-clothing image by mistake: have the vision tagging prompt include an explicit "is_clothing_item": boolean field; if false, reject the upload with a message instead of storing garbage tags
Outfit missing a core category (e.g., wardrobe has no shoes at all): the reasoning prompt should be told what categories exist in the wardrobe so it doesn't hallucinate items you don't own
Duplicate detection threshold (75% overlap): this is a tunable constant — expose it as a config value, not a hardcoded magic number buried in logic
9. What NOT to Build Yet
Multi-user auth/accounts
Cloud image storage (S3) — local disk is fine until you're actually deploying
Weather API integration (tempting, but out of scope until core loop works)
Mobile app — this is a responsive web app first
Any second AI provider "for comparison" — see Section 0. One model, Gemini, end to end. If a future feature seems to need a different kind of model, check Gemini's current capabilities first before reaching for another API.
10. Phase 7 (Optional, After MVP) — Upgrade to the Agentic Loop
Once Phases 1-6 produce a working scripted version:
Implement the tools/functionDeclarations config from Section 4a
Move /api/generate/prompt and /api/generate/try-new from single-shot calls to the multi-turn tool-calling loop
Keep the Section 5 hard-filter dedup check as a server-side safety net regardless — never rely solely on the model correctly using check_combination_is_novel on itself
✅ Done when: you can inspect Gemini's tool-call trace in the response and see it independently deciding, e.g., to fetch only "shoes" category items rather than the full wardrobe, without you telling it to