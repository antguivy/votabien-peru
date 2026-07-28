"use client";

import { useAuth } from "@/lib/auth-provider";
import NavbarClient from "./navbar-client";

export default function Navbar() {
  const { user } = useAuth();

  return <NavbarClient user={user} />;
}
