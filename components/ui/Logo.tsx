import Link from "next/link";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <Link 
      href="/" 
      className={`inline-block font-black tracking-widest text-zinc-100 hover:text-zinc-400 transition-colors ${className}`}
    >
      BEACON
    </Link>
  );
}
