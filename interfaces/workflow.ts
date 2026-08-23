export interface AIWorkflow {
  id: string;
  name: string;
  description: string | null;
  sources: string[];
  compressor_prompt: string;
  compressor_model: string;
  validator_prompt: string;
  validator_model: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}
