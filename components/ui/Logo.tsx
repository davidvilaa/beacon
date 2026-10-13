import Link from "next/link";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <Link 
      href="/" 
      className={`group relative inline-flex items-center justify-center font-black tracking-widest transition-all duration-300 ${className}`}
    >
      <span className="absolute w-[0.2em] h-[0.2em] rounded-full bg-[#a8dadc] blur-md opacity-45 group-hover:opacity-85 group-hover:blur-lg transition-all duration-300 pointer-events-none" />
      <span className="relative bg-[radial-gradient(circle_at_center,_#a8dadc_0%,_#a8dadc_35%,_#ffffff_85%)] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,218,220,0.25)] group-hover:drop-shadow-[0_0_18px_rgba(168,218,220,0.6)] transition-all duration-300 select-none">
        BEACON
      </span>
    </Link>
  );
}
