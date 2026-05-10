"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/#research-interest", label: "Research Interest" },
  { href: "/research-map", label: "Research Map" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <Link className="navbar-brand" href="/">
        Yunwei Lu
      </Link>
      <nav className="navbar-links" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === "/research-map" ? pathname === "/research-map" : pathname === "/";

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`navbar-link${isActive ? " active" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
