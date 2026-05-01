type ComingSoonBadgeProps = {
  text: string;
};

export function ComingSoonBadge({ text }: ComingSoonBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-300/80 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-700 backdrop-blur-sm">
      {text}
    </span>
  );
}
