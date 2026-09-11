1. Problem:
People often have a specific clothing design in mind — something they saw, imagined, or half-remember — but have no easy way to (1) visualize it concretely, (2) see it on themselves, or (3) actually acquire or make it. Existing tools solve fragments of this (Pinterest for inspiration, try-on apps for existing catalog items, Etsy/YouTube for DIY) but nothing connects "idea → visual → on you → real-world path to owning it."

2. Target user & core use case:
Someone browsing fashion inspiration (Pinterest, a sketch, a vague description like "cropped cardigan, chunky knit, oversized buttons") who wants to know: what would this actually look like, and how do I get it?

3. MVP Scope: the one thing that must work end-to-end
Narrow to a single linear pipeline, one option per stage:
Input: text description or Pinterest image/URL parsing.
Generation: call an image-gen API (e.g. Stability/DALL·E/Gemini image) to render the garment as a standalone product-style image from the description.
Try-on: user uploads a photo of themselves; overlay/composite the generated garment onto it. For MVP this can be a simple pose-agnostic overlay (even non-photorealistic alignment) rather than true body-aware rendering — realism is a stretch goal, not a requirement.

4. One downstream action:
(a) reverse image search the generated garment to surface visually similar real products with purchase links.

Definition of done for MVP: a user can type a description, get a generated image, see it composited on their own photo, and get one concrete next step (either "here's something similar you can buy" or "here's what you'd need to make it").

5. Final Goals:
Additional inputs: hand-drawn sketch upload.
Higher-fidelity virtual try-on (pose estimation, fabric drape, lighting match)
Add the other downstream action you didn't build for MVP (reverse search or DIY path)
YouTube tutorial curation matched to garment type
Custom sewing pattern generation
Saved history / gallery of past generations
Style refinement loop (user tweaks the description, image regenerates)

6. Why this scope?
Each stage (gen, try-on, sourcing) is independently a full sub-project; the risk isn't building any one of them well, it's failing to connect them at all. An MVP that's a thin, but complete pipeline is more valuable to demonstrate than one polished stage in isolation.

7. AI-Involvement Level
AI-driven implementation, human-directed architecture, using Claude Code as the primary build tool. I define the pipeline architecture and integration points (input normalization → image-gen → try-on compositing → downstream action) and review every commit before pushing. Claude Code handles the implementation work within that structure — API wiring, prompt iteration, UI scaffolding, and the vision-model/image-gen/overlay integration code. This also makes BUILD_LOG.md straightforward to maintain, since Claude Code can report time/tokens per commit as part of the workflow itself.

8. Known risks / open questions
Image-gen APIs may not reliably produce "flat garment, no model" images from text alone — may need prompt engineering or a garment-specific model.
Overlay quality without pose estimation may look bad enough to undermine the demo — worth prototyping early to validate feasibility before committing to it as MVP.
Reverse image search APIs (Google Vision, etc.) may have cost/rate limits worth checking early.

9. Architecture (linear pipeline, single path per stage):

  1. Frontend — simple web app (React/Next.js or even a plain HTML+JS page for
     MVP). Screens: input form → generated garment preview → photo upload →
     composited try-on result.
  2. Backend — thin API server (Node/Express or Python/FastAPI) that
     orchestrates the 3 stages and proxies API keys (never call image-gen APIs
     from the client).
  3. Storage — object storage (S3/Cloudinary/local disk for MVP) for generated
     images, user photos, composited outputs.

  Pipeline stages:

  - Input: text field, or Pinterest URL → scrape og:image / use Pinterest's
    oEmbed/API to pull the image, then optionally run it through a vision model
    to get a text description (for consistency, always end up with a text
    prompt).
  - Generation: send prompt to an image-gen API (DALL·E 3, Stability, or Gemini
    image) with a fixed style prefix like "studio product photo, plain
    background, full garment, front view" for consistent output.
  - Try-on (pose-agnostic overlay): user uploads photo → run a
    person-segmentation/pose model (e.g., Mediapipe Pose or a body-segmentation
    model) to find torso bounding box/keypoints → warp/scale the generated
    garment image onto that region with basic alpha blending (OpenCV/Pillow). No
    real garment-body fitting — just crude affine placement.

  Stack/commands to scaffold:

  # backend
  mkdir server && cd server
  npm init -y
  npm install express multer axios sharp dotenv
  # or Python: pip install fastapi uvicorn python-multipart pillow mediapipe 
  requests

  # frontend
  npx create-next-app@latest client
  cd client && npm install axios

  # image processing (pose/segmentation for overlay)
  pip install mediapipe opencv-python pillow numpy

  # env vars
  echo "STABILITY_API_KEY=...\nOPENAI_API_KEY=..." > server/.env

  Key API calls:
  - Image gen: POST https://api.stability.ai/v2beta/stable-image/generate/core
    or OpenAI images.generate
  - Pinterest scrape: fetch page, parse og:image meta tag (no official easy API
    for arbitrary pins)
  - Overlay: local processing, no external call needed
  
  What to cut for MVP: no auth, no garment catalog/shopping links yet (stretch
  goal #3 "acquire it" can just be a text tip like "search Etsy for:
  <description>" via a static link-out), no true body-aware warping.

  Want me to actually scaffold this (pick Next.js+FastAPI or Node) and start
  writing the code?

✻ Cogitated for 15s · done 3:55 PM
  
❯ give me a build log for this                                                  

  Listed 1 directory (ctrl+o to expand)

⏺ No project scaffolded yet, so I'll set one up and write the build log into it
  as a real, appendable devlog (not a hypothetical) — starting with the
  planning/setup phase we've already done.