import Link from "next/link";

// Light lavender backdrop + top bar shared by every admin screen
export default function AdminShell({
  children,
  width = "max-w-5xl",
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div
      className="min-h-screen text-[#1f1b2e]"
      style={{ background: "#f7f5fb" }}
    >
      <header className="sticky top-0 z-30 border-b border-[#8D7FB5]/15 bg-white/75 backdrop-blur">
        <div className={`mx-auto flex w-full ${width} items-center gap-4 px-6 py-3`}>
          <Link href="/admin/events" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#5b4b8a] font-bebas text-lg text-white">
              W
            </span>
            <span className="font-bebas text-2xl tracking-wide">
              WIOS <span className="text-[#5b4b8a]">Admin</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 font-poppins text-sm font-semibold">
            <Link
              href="/admin/events"
              className="rounded-full px-3.5 py-1.5 text-black/70 transition hover:bg-[#8D7FB5]/10"
            >
              Events
            </Link>
            <Link
              href="/admin/events#admins"
              className="rounded-full px-3.5 py-1.5 text-black/70 transition hover:bg-[#8D7FB5]/10"
            >
              Admins
            </Link>
            <Link
              href="/"
              className="rounded-full px-3.5 py-1.5 text-[#8D7FB5] transition hover:bg-[#8D7FB5]/10"
            >
              View site ↗
            </Link>
          </nav>
        </div>
      </header>
      <main className={`mx-auto w-full ${width} px-6 pb-24 pt-10`}>{children}</main>
    </div>
  );
}
