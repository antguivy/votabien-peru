import { UserNav } from "@/components/admin/user-nav";
import { SheetMenu } from "@/components/admin/sheet-menu";
import { serverGetUser } from "@/lib/auth-actions";

interface NavbarProps {
  title: string;
}

export async function Navbar({ title }: NavbarProps) {
  const { user, profile } = await serverGetUser();

  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          {user && <SheetMenu />} <h1 className="font-bold">{title}</h1>
        </div>
        <div className="flex flex-1 items-center space-x-2 justify-end">
          <div className="hidden md:flex flex-col text-xs items-center">
            <span className="font-semibold capitalize text-sm">
              {profile?.full_name}
            </span>
            <span className="text-muted-foreground">{profile?.role}</span>
          </div>
          {user && <UserNav user={user} profile={profile} />}
        </div>
      </div>
    </header>
  );
}
