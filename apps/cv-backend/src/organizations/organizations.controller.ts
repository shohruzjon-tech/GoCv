import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateOrgBrandingDto,
  UpdateOrgSettingsDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  CreateTeamDto,
  UpdateTeamDto,
} from './dto/organization.dto.js';

@Controller('api/organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  // ─── Organization CRUD ───

  @Post()
  async create(
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.orgService.create(userId, dto);
  }

  @Get()
  async findMyOrgs(@CurrentUser('_id') userId: string) {
    return this.orgService.findByUser(userId);
  }

  @Get(':orgId')
  async findOne(@Param('orgId') orgId: string) {
    return this.orgService.findById(orgId);
  }

  @Put(':orgId')
  async update(
    @Param('orgId') orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgService.update(orgId, userId, dto);
  }

  @Put(':orgId/branding')
  async updateBranding(
    @Param('orgId') orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateOrgBrandingDto,
  ) {
    return this.orgService.updateBranding(orgId, userId, dto);
  }

  @Put(':orgId/settings')
  async updateSettings(
    @Param('orgId') orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateOrgSettingsDto,
  ) {
    return this.orgService.updateSettings(orgId, userId, dto);
  }

  @Delete(':orgId')
  async delete(
    @Param('orgId') orgId: string,
    @CurrentUser('_id') userId: string,
  ) {
    return this.orgService.delete(orgId, userId);
  }

  @Get(':orgId/stats')
  async getStats(@Param('orgId') orgId: string) {
    return this.orgService.getOrgStats(orgId);
  }

  // ─── Members ───

  @Get(':orgId/members')
  async getMembers(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orgService.getMembers(
      orgId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Post(':orgId/members/invite')
  async inviteMember(
    @Param('orgId') orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.orgService.inviteMember(orgId, userId, dto);
  }

  @Put(':orgId/members/:memberId/role')
  async updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.orgService.updateMemberRole(orgId, userId, memberId, dto.role);
  }

  @Delete(':orgId/members/:memberId')
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('_id') userId: string,
  ) {
    return this.orgService.removeMember(orgId, userId, memberId);
  }

  @Post(':orgId/transfer-ownership')
  async transferOwnership(
    @Param('orgId') orgId: string,
    @CurrentUser('_id') userId: string,
    @Body('newOwnerId') newOwnerId: string,
  ) {
    return this.orgService.transferOwnership(orgId, userId, newOwnerId);
  }

  // ─── Teams ───

  @Get(':orgId/teams')
  async getTeams(@Param('orgId') orgId: string) {
    return this.orgService.getTeams(orgId);
  }

  @Post(':orgId/teams')
  async createTeam(
    @Param('orgId') orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateTeamDto,
  ) {
    return this.orgService.createTeam(orgId, userId, dto);
  }

  @Put(':orgId/teams/:teamId')
  async updateTeam(
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.orgService.updateTeam(orgId, teamId, userId, dto);
  }

  @Delete(':orgId/teams/:teamId')
  async deleteTeam(
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('_id') userId: string,
  ) {
    return this.orgService.deleteTeam(orgId, teamId, userId);
  }
}
