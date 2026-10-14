import Navbar from "@/components/layout/Navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-50">
      <Navbar />
      <div className="flex-1 pt-14 flex flex-col">{children}</div>
    </div>
  );
}
