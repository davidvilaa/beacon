import Navbar from "@/components/layout/Navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />
      <div className="flex-1 pt-[104px] flex flex-col">{children}</div>
    </div>
  );
}
