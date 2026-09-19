import { FC, ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: FC<AuthLayoutProps> = async ({ children }) => {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-md md:max-w-4xl">{children}</div>
    </div>
  );
};

export default AuthLayout;
