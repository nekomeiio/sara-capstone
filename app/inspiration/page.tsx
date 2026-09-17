export default function InspirationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inspiration</h1>
        <button
          type="button"
          disabled
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          Upload image
        </button>
      </div>

      <p className="text-sm text-black/40 dark:text-white/40">
        No inspiration images yet — style extraction is coming in Phase 5.
      </p>
    </div>
  );
}
