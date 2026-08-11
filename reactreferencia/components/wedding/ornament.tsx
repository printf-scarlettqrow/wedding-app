import { cn } from "@/lib/utils"

export function Ornament({
  className,
  tone = "gold",
}: {
  className?: string
  tone?: "gold" | "olive" | "cream"
}) {
  const color =
    tone === "gold"
      ? "text-gold"
      : tone === "olive"
        ? "text-olive"
        : "text-cream"

  return (
    <div
      className={cn("flex items-center justify-center gap-3", color, className)}
      aria-hidden="true"
    >
      <span className="h-px w-16 bg-current opacity-40 sm:w-24" />
      <svg
        width="34"
        height="16"
        viewBox="0 0 34 16"
        fill="none"
        className="shrink-0"
      >
        <path
          d="M17 2c-2.5 3-6 5-11 6 5 1 8.5 3 11 6 2.5-3 6-5 11-6-5-1-8.5-3-11-6Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="17" cy="8" r="1.6" fill="currentColor" />
      </svg>
      <span className="h-px w-16 bg-current opacity-40 sm:w-24" />
    </div>
  )
}
