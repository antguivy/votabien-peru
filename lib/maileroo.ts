export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const apiKey = process.env.MAILEROO_API_KEY;
  const from = process.env.MAIL_FROM || "no-reply@votabien.pe";

  if (!apiKey) {
    console.warn("MAILEROO_API_KEY no está configurado. Simulación de envío:");
    console.log(
      `\n=== EMAIL A: ${to} ===\nSubject: ${subject}\n${html}\n====================\n`,
    );
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch("https://smtp.maileroo.com/send", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ""), // fallback a extraer texto del HTML
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error al enviar correo con Maileroo:", errorData);
      return { success: false, error: errorData };
    }

    return { success: true };
  } catch (error) {
    console.error("Excepción al enviar correo:", error);
    return { success: false, error };
  }
}
