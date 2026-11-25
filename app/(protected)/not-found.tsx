import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-zinc-200 mb-2">Not found</h1>
      <p className="text-sm text-zinc-400 mb-6">This page could not be found.</p>
      <Link href="/" className="text-xs font-bold uppercase tracking-wider text-accent hover:underline">
        ← Back home
      </Link>
    </div>
  );
}
