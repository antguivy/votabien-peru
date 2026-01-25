import { serverGetUser } from "@/lib/auth-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { adminNavGroups } from "@/components/navbar/navbar-config";

export default async function AdminDashboardPage() {
  const { profile } = await serverGetUser();
  const firstName = profile?.full_name?.split(" ")[0] || "Administrador";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mt-2">
          Bienvenido de vuelta, {firstName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminNavGroups.map((group) =>
          group.links.map((link) => {
            const Icon = link.icon;

            return (
              <Link key={link.href} href={link.href} className="group">
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {link.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">&rarr;</div>
                    <CardDescription className="mt-2 text-xs">
                      Gestionar {link.label.toLowerCase()}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          }),
        )}
      </div>
    </div>
  );
}
