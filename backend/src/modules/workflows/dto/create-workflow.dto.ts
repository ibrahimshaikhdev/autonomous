import { IsString, IsOptional, IsBoolean, IsJSON } from "class-validator";

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsJSON()
  nodes: string; // JSON string of React Flow nodes

  @IsJSON()
  edges: string; // JSON string of React Flow edges

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
