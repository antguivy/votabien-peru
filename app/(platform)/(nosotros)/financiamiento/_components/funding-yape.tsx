"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import YapeQrModal from "./yape-qr-modal";

export default function FundingYape() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:border-[#722C8E]/30">
        <CardHeader>
          <CardTitle className="text-xl flex flex-row items-center gap-5">
            <div className="w-12 h-12 rounded-lg bg-[#722C8E]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6 text-[#722C8E]" />
            </div>
            Yape
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Apoyo instantáneo desde tu celular
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-[#722C8E] hover:bg-[#5d2373] text-white"
          >
            Ver QR de Yape
          </Button>
        </CardContent>
      </Card>

      <YapeQrModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
