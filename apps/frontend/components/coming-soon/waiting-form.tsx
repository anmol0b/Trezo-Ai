export function WaitlistForm() {
    return (
      <form action="#" method="post" className="w-full">
        <div className="flex w-full flex-col gap-2 rounded-full border border-neutral-300/80 bg-white/80 p-2 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center">
          <label htmlFor="waitlist-email" className="sr-only">
            Email address
          </label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            placeholder="you@somewhere.com"
            autoComplete="email"
            required
            className="h-11 w-full rounded-full border-none bg-transparent px-4 text-sm text-neutral-800 outline-none placeholder:text-neutral-500"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Join Waitlist
          </button>
        </div>
      </form>
    );
  }