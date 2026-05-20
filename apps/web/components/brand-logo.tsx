import Link from "next/link";
import { cn } from "@/lib/styles";

export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      className={cn(
        "text-kiri-hero inline-flex min-w-0 items-center gap-3 no-underline",
        className,
      )}
      href="/"
      aria-label="Kirigami home"
    >
      <svg
        aria-hidden="true"
        className="border-kiri-hero/25 bg-kiri-surface shadow-kiri-subtle h-11 w-11 shrink-0 overflow-hidden rounded-lg border"
        viewBox="0 0 44 44"
      >
        <rect width="44" height="44" fill="#f8fbf8" />
        <path d="M0 0h44L22 22z" fill="#d4edf7" />
        <path d="M0 0l22 22L0 44z" fill="#4c9bd3" />
        <path d="M44 0v44L22 22z" fill="#f5c06f" />
        <path d="M0 44h44L22 22z" fill="#0a6b96" />
        <path d="M22 12l9 21h-6l-3-8-3 8h-6z" fill="#16322b" />
      </svg>
      <span className="grid min-w-0 gap-0.5">
        <strong className="text-[1.05rem] leading-none font-black text-inherit">
          Kirigami
        </strong>
        <span className="text-kiri-muted text-[0.72rem] leading-tight font-extrabold uppercase max-sm:hidden">
          Consensus Not Included
        </span>
      </span>
    </Link>
  );
}
