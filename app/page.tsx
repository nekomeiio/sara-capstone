export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">What are you wearing today?</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="prompt" className="text-sm text-black/60 dark:text-white/60">
          Describe the occasion
        </label>
        <textarea
          id="prompt"
          placeholder="e.g. party tonight, chic"
          rows={3}
          disabled
          className="rounded-md border border-black/10 p-3 text-sm disabled:opacity-50 dark:border-white/10"
        />
        <button
          type="button"
          disabled
          className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          Generate outfit
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-black/60 dark:text-white/60">or</span>
        <button
          type="button"
          disabled
          className="w-fit rounded-md border border-black/10 px-4 py-2 text-sm disabled:opacity-40 dark:border-white/10"
        >
          Try Something New
        </button>
      </div>

      <p className="text-sm text-black/40 dark:text-white/40">
        Outfit generation isn&apos;t wired up yet — coming in Phase 3.
      </p>
    </div>
  );
}
