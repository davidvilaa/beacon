import BeaconMark from "@/components/ui/BeaconMark";

export default function Loading({
  text = "Loading...",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-2 py-16 ${className}`}
    >
      <BeaconMark animated className="h-12 w-12 rotate-90" />
      {text && <p className="text-xs text-zinc-500 font-medium">{text}</p>}
    </div>
  );
}
