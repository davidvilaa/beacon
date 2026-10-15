export default function Loading({
  text = "Loading...",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}
    >
      <div className="w-6 h-6 rounded-full border-2 border-zinc-800 border-t-[#a8dadc] animate-spin" />
      {text && <p className="text-xs text-zinc-500 font-medium">{text}</p>}
    </div>
  );
}
