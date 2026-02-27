import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TemplateCategory,
  TemplateStatus,
} from '../../common/enums/template.enum.js';

export class ColorThemeDto {
  @IsString()
  name: string;

  @IsString()
  primaryColor: string;

  @IsString()
  secondaryColor: string;

  @IsString()
  backgroundColor: string;

  @IsString()
  textColor: string;

  @IsOptional()
  @IsString()
  accentColor?: string;
}

export class LayoutConfigDto {
  @IsOptional()
  @IsNumber()
  columns?: number;

  @IsOptional()
  @IsString()
  sidebarPosition?: 'left' | 'right' | 'none';

  @IsOptional()
  @IsString()
  headerStyle?: 'full-width' | 'centered' | 'split';

  @IsOptional()
  @IsString()
  sectionSpacing?: 'compact' | 'normal' | 'spacious';
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @IsString()
  htmlTemplate: string;

  @IsOptional()
  @IsString()
  cssStyles?: string;

  @IsOptional()
  @IsObject()
  layoutConfig?: LayoutConfigDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorThemeDto)
  colorThemes?: ColorThemeDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedFonts?: string[];

  @IsOptional()
  @IsString()
  defaultFont?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnterprise?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @IsOptional()
  @IsString()
  htmlTemplate?: string;

  @IsOptional()
  @IsString()
  cssStyles?: string;

  @IsOptional()
  @IsObject()
  layoutConfig?: LayoutConfigDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorThemeDto)
  colorThemes?: ColorThemeDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedFonts?: string[];

  @IsOptional()
  @IsString()
  defaultFont?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnterprise?: boolean;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  previewUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
