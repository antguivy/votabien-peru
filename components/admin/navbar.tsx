import { UserNav } from "@/components/admin/user-nav";
import { SheetMenu } from "@/components/admin/sheet-menu";
import { serverGetUser } from "@/lib/auth-actions";

interface NavbarProps {
  title: string;
}

export async function Navbar({ title }: NavbarProps) {
  const { user } = await serverGetUser();

  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          {user && <SheetMenu />} <h1 className="font-bold">{title}</h1>
        </div>
        <div className="flex flex-1 items-center space-x-2 justify-end">
          {user && (
            <>
              <div className="hidden md:flex flex-col text-xs items-center">
                <span className="font-semibold capitalize text-sm">
                  {user.name}
                </span>
                <span className="text-muted-foreground">{user.role}</span>
              </div>
              <UserNav user={user} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
