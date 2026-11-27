import Link from "next/link";
import BeaconMark from "@/components/ui/BeaconMark";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center gap-1.5 font-black tracking-widest text-zinc-50 select-none transition hover:brightness-75 ${className}`}
    >
      <BeaconMark className="h-[1.9em] w-[1.9em]" />
      <span>BEACON</span>
    </Link>
  );
}
