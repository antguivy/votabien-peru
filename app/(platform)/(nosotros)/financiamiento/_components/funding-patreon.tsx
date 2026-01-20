import { Heart, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FundingPatreon() {
  const handlePatreonClick = () => {
    window.open(process.env.NEXT_PUBLIC_PATREON_URL, "_blank");
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-[#FF424D]/30">
      <CardHeader>
        <CardTitle className="text-xl flex flex-row items-center gap-5">
          <div className="w-12 h-12 rounded-lg bg-[#FF424D]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Heart className="w-6 h-6 text-[#FF424D]" />
          </div>
          Patreon
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Apoyo mensual recurrente
        </p>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handlePatreonClick}
          className="w-full bg-[#FF424D] hover:bg-[#e63946] text-white"
        >
          Ser Patrocinador
        </Button>
      </CardContent>
    </Card>
  );
}
