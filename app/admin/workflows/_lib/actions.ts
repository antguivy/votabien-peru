"use server";

import { prisma } from "@/lib/prisma";
import { serverRequireEditor } from "@/lib/auth-actions";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";

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

export async function createWorkflow(data: WorkflowFormValues) {
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateWorkflow(
  id: string,
  data: Partial<WorkflowFormValues>,
) {
  await serverRequireEditor();
  try {
    const workflow = await prisma.ai_workflow.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/workflows");
    return { success: true, data: workflow };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteWorkflow(id: string) {
  await serverRequireEditor();
  try {
    await prisma.ai_workflow.delete({ where: { id } });
    revalidatePath("/admin/workflows");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getActiveWorkflows() {
  await serverRequireEditor();
  try {
    const workflows = await prisma.ai_workflow.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    });
    return { success: true, workflows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWorkflows() {
  await serverRequireEditor();
  return prisma.ai_workflow.findMany({
    orderBy: { created_at: "desc" },
  });
}
