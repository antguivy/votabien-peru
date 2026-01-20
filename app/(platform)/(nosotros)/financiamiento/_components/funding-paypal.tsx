"use client";

import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FundingPaypal() {
  const handlePayPalClick = () => {
    // Reemplaza esto con tu link de PayPal.me o link de donación
    window.open("https://paypal.me/TuUsuario", "_blank");
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-[#0070BA]/30">
      <CardHeader>
        <CardTitle className="text-xl flex flex-row items-center gap-5">
          <div className="w-12 h-12 rounded-lg bg-[#0070BA]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CreditCard className="w-6 h-6 text-[#0070BA]" />
          </div>
          PayPal
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Donación internacional segura
        </p>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handlePayPalClick}
          className="w-full bg-[#0070BA] hover:bg-[#005a96] text-white"
        >
          Donar con PayPal
        </Button>
      </CardContent>
    </Card>
  );
}
