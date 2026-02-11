import { serverGetUser } from "@/lib/auth-actions";
import { MobileBottomNav } from "./mobile-bottom-nav";
import NavbarClient from "./navbar-client";

export default async function Navbar() {
  const { user, profile } = await serverGetUser();

  return <NavbarClient user={user} profile={profile} />;
}
