import Link from "next/link";

export default function BrandLogo({ className = "" }: { className?: string }) {
  const classNames = ["brandLogo", className].filter(Boolean).join(" ");

  return (
    <Link className={classNames} href="/" aria-label="Kirigami home">
      <span className="brandMark" aria-hidden="true">
        <span className="brandMarkFold brandMarkFoldA" />
        <span className="brandMarkFold brandMarkFoldB" />
        <span className="brandMarkFold brandMarkFoldC" />
      </span>
      <span className="brandWordmark">
        <strong>Kirigami</strong>
        <span>guided thread reader</span>
      </span>
    </Link>
  );
}
