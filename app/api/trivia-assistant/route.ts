import { API_BASE_URL } from "@/lib/config";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionResponse || !sessionResponse.session) {
      return new Response(JSON.stringify({ detail: "Not authorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { prisma } = await import("@/lib/prisma");
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionResponse.user.id },
      select: { role: true },
    });

    if (
      !dbUser ||
      !["volunteer", "editor", "lead", "admin", "super_admin"].includes(
        dbUser.role,
      )
    ) {
      return new Response(
        JSON.stringify({ detail: "Reviewer or Admin role required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await request.json();
    const targetWorkflowId = body?.workflow_id || "wf_trivia_eje5_debates";
    const workflow = await prisma.ai_workflow.findFirst({
      where: {
        OR: [
          { id: targetWorkflowId },
          { type: "TRIVIA_EJE5", status: "ACTIVE" },
        ],
      },
    });
    if (workflow) {
      body.compressor_prompt = workflow.compressor_prompt;
      body.compressor_model =
        workflow.compressor_model === "gemini-2.5-flash"
          ? "gemini-3.6-flash"
          : workflow.compressor_model || "gemini-3.6-flash";
      body.validator_prompt = workflow.validator_prompt;
      body.validator_model = workflow.validator_model;
    }

    const accessToken = process.env.API_SECRET_KEY;
    const pythonResponse = await fetch(
      `${API_BASE_URL}/api/v1/trivia/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error("[Trivia Proxy] Python error:", errorText);
      return new Response(errorText, { status: pythonResponse.status });
    }

    return new Response(pythonResponse.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Trivia Proxy] Fatal error:", error);
    return new Response(JSON.stringify({ detail: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
