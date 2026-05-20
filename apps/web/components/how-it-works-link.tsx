import Link from "next/link";
import { cn } from "@/lib/styles";

export default function HowItWorksLink({ className = "" }: { className?: string }) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border px-3.5 font-black no-underline",
        className,
      )}
      href="/how-it-works"
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 5v14M5 8.5h14M5 15.5h14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
      <span>How it works</span>
    </Link>
  );
}
