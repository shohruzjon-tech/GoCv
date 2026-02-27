import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { OrgPlan, OrgRole } from '../../common/enums/org-role.enum.js';

export class CreateOrganizationDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsEnum(OrgPlan) plan?: OrgPlan;
}

export class UpdateOrganizationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() size?: string;
}

export class UpdateOrgBrandingDto {
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() faviconUrl?: string;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() accentColor?: string;
  @IsOptional() @IsString() customDomain?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() tagline?: string;
}

export class UpdateOrgSettingsDto {
  @IsOptional() @IsBoolean() allowMemberInvites?: boolean;
  @IsOptional() @IsBoolean() allowPublicCvs?: boolean;
  @IsOptional() @IsBoolean() requireApprovalForPublish?: boolean;
  @IsOptional() @IsBoolean() enableAiTools?: boolean;
  @IsOptional() @IsBoolean() enforceTemplates?: boolean;
  @IsOptional() @IsArray() allowedTemplateIds?: string[];
  @IsOptional() @IsString() preferredAiProvider?: string;
}

export class InviteMemberDto {
  @IsString() email: string;
  @IsOptional() @IsEnum(OrgRole) role?: OrgRole;
  @IsOptional() @IsArray() teamIds?: string[];
}

export class UpdateMemberRoleDto {
  @IsEnum(OrgRole) role: OrgRole;
}

export class CreateTeamDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() memberIds?: string[];
  @IsOptional() @IsString() color?: string;
}

export class UpdateTeamDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsArray() memberIds?: string[];
  @IsOptional() @IsString() leadId?: string;
}
