import { redirect } from "next/navigation";

export default function PropuestasLegacyRedirect() {
  redirect("/admin/personas/revisiones");
}
