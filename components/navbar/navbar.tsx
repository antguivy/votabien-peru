import { serverGetUser } from "@/lib/auth-actions";
import NavbarClient from "./navbar-client";

export default async function Navbar() {
  const { user, profile } = await serverGetUser();

  return <NavbarClient user={user} profile={profile} />;
}
