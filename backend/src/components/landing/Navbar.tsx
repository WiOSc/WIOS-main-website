const NAV_LINKS = [
  { label: "ABOUT US", href: "#" },
  { label: "EVENTS", href: "/events" },
  { label: "GALLERY", href: "#" },
  { label: "MEET OUR TEAM", href: "#" },
  { label: "CONTACT", href: "#" },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-center px-8 py-6">
      <nav className="flex items-center gap-10 rounded-full bg-white/90 px-12 py-4 shadow-lg backdrop-blur">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="group relative font-poppins text-xs font-bold text-black"
          >
            <span className="inline-block transition-transform duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-[2px]">
              {link.label}
            </span>
            <span className="absolute -bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-black transition-all duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:w-full" />
          </a>
        ))}
      </nav>
    </header>
  );
}
