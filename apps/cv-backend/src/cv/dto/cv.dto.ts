import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateCvDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };

  @IsOptional()
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
    layout?: string;
  };

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class UpdateCvDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsArray()
  sections?: any[];

  @IsOptional()
  personalInfo?: any;

  @IsOptional()
  theme?: any;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  aiGeneratedHtml?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class AiGenerateCvDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  cvId?: string;

  @IsOptional()
  context?: Record<string, any>;
}

export class AiEditSectionDto {
  @IsString()
  prompt: string;

  @IsString()
  sectionType: string;

  @IsOptional()
  currentContent?: any;
}
