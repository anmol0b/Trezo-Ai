type FollowOnXButtonProps = {
  href: string;
};

export function FollowOnXButton({ href }: FollowOnXButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Follow Izuki on X"
      className="inline-flex items-center rounded-full border border-neutral-300/80 bg-white/80 px-4 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-white"
    >
      Follow on X
    </a>
  );
}
