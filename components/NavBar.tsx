"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/inspiration", label: "Inspiration" },
  { href: "/history", label: "History" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col items-center gap-8 border-b border-black/10 px-4 pt-2 pb-6 dark:border-white/10">
      <span className="brand-title">♱ Style Me ♱</span>
      <div className="flex flex-wrap justify-center gap-3">
        {LINKS.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`btn-pill ${isActive ? "is-active" : ""}`}
            >
              † {link.label} †
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
