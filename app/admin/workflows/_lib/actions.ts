"use server";

import { prisma } from "@/lib/prisma";
import { serverRequireEditor, serverRequireReviewer } from "@/lib/auth-actions";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { extractErrorMessage } from "@/lib/error-handler";
import type { AIWorkflow } from "@/interfaces/workflow";

export interface WorkflowFormValues {
  name: string;
  description: string;
  sources: string[];
  compressor_prompt: string;
  compressor_model: string;
  validator_prompt: string;
  validator_model: string;
  status: string;
}

export async function createWorkflow(
  data: WorkflowFormValues,
): Promise<
  { success: true; data: AIWorkflow } | { success: false; error: string }
> {
  await serverRequireEditor();
  try {
    const workflow = await prisma.ai_workflow.create({
      data: {
        id: createId(),
        name: data.name,
        description: data.description,
        sources: data.sources,
        compressor_prompt: data.compressor_prompt,
        compressor_model: data.compressor_model,
        validator_prompt: data.validator_prompt,
        validator_model: data.validator_model,
        status: data.status,
      },
    });

    revalidatePath("/admin/workflows");
    return { success: true, data: workflow };
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function updateWorkflow(
  id: string,
  data: Partial<WorkflowFormValues>,
): Promise<
  { success: true; data: AIWorkflow } | { success: false; error: string }
> {
  await serverRequireEditor();
  try {
    const workflow = await prisma.ai_workflow.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/workflows");
    return { success: true, data: workflow };
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function deleteWorkflow(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  await serverRequireEditor();
  try {
    await prisma.ai_workflow.delete({ where: { id } });
    revalidatePath("/admin/workflows");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function getActiveWorkflows(): Promise<
  | { success: true; workflows: { id: string; name: string }[] }
  | { success: false; error: string }
> {
  await serverRequireReviewer();
  try {
    const workflows = await prisma.ai_workflow.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    });
    return { success: true, workflows };
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

export async function getWorkflows(): Promise<AIWorkflow[]> {
  await serverRequireEditor();
  return prisma.ai_workflow.findMany({
    orderBy: { created_at: "desc" },
  });
}
