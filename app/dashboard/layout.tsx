"use client";

import { usePathname } from "next/navigation";

import { Navbar, NavbarBrand, type NavLink } from "@/components/layout/navbar";
import { ProfileMenu } from "@/components/layout/profile-menu";

const NAV_LINKS: Omit<NavLink, "active">[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Resumes", href: "/dashboard/resumes" },
  { label: "Cover letters", href: "/dashboard/cover-letters" },
  { label: "Applications", href: "/dashboard/applications" },
  { label: "Billing", href: "/dashboard/billing" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links: NavLink[] = NAV_LINKS.map((link) => ({
    ...link,
    active:
      link.href === "/dashboard"
        ? pathname === link.href
        : pathname.startsWith(link.href),
  }));

  return (
    <>
      <Navbar
        brand={<NavbarBrand href="/dashboard" />}
        links={links}
        trailing={<ProfileMenu />}
      />
      {children}
    </>
  );
}
