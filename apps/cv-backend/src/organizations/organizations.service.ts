import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema.js';
import {
  OrgMembership,
  OrgMembershipDocument,
} from './schemas/org-membership.schema.js';
import { Team, TeamDocument } from './schemas/team.schema.js';
import { OrgRole, OrgPlan, OrgStatus } from '../common/enums/org-role.enum.js';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateOrgBrandingDto,
  UpdateOrgSettingsDto,
  InviteMemberDto,
  CreateTeamDto,
  UpdateTeamDto,
} from './dto/organization.dto.js';

// ─── Org Role Hierarchy ───

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  [OrgRole.OWNER]: 100,
  [OrgRole.ADMIN]: 80,
  [OrgRole.RECRUITER]: 60,
  [OrgRole.MEMBER]: 40,
  [OrgRole.VIEWER]: 20,
};

const DEFAULT_PERMISSIONS: Record<OrgRole, OrgMembership['permissions']> = {
  [OrgRole.OWNER]: {
    canCreateCv: true,
    canPublishCv: true,
    canUseAi: true,
    canManageTemplates: true,
    canInviteMembers: true,
    canViewAnalytics: true,
    canManageBilling: true,
  },
  [OrgRole.ADMIN]: {
    canCreateCv: true,
    canPublishCv: true,
    canUseAi: true,
    canManageTemplates: true,
    canInviteMembers: true,
    canViewAnalytics: true,
    canManageBilling: false,
  },
  [OrgRole.RECRUITER]: {
    canCreateCv: true,
    canPublishCv: true,
    canUseAi: true,
    canManageTemplates: false,
    canInviteMembers: false,
    canViewAnalytics: true,
    canManageBilling: false,
  },
  [OrgRole.MEMBER]: {
    canCreateCv: true,
    canPublishCv: false,
    canUseAi: true,
    canManageTemplates: false,
    canInviteMembers: false,
    canViewAnalytics: false,
    canManageBilling: false,
  },
  [OrgRole.VIEWER]: {
    canCreateCv: false,
    canPublishCv: false,
    canUseAi: false,
    canManageTemplates: false,
    canInviteMembers: false,
    canViewAnalytics: true,
    canManageBilling: false,
  },
};

const PLAN_MAX_MEMBERS: Record<OrgPlan, number> = {
  [OrgPlan.TEAM]: 10,
  [OrgPlan.BUSINESS]: 50,
  [OrgPlan.ENTERPRISE]: -1,
};

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    @InjectModel(OrgMembership.name)
    private memberModel: Model<OrgMembershipDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
  ) {}

  // ─── Organization CRUD ───

  async create(
    userId: string,
    dto: CreateOrganizationDto,
  ): Promise<OrganizationDocument> {
    const slug = this.generateSlug(dto.name);

    const existing = await this.orgModel.findOne({ slug }).exec();
    if (existing)
      throw new ConflictException('Organization name is already taken');

    const plan = dto.plan || OrgPlan.TEAM;
    const org = new this.orgModel({
      name: dto.name,
      slug,
      description: dto.description,
      ownerId: new Types.ObjectId(userId),
      plan,
      maxMembers: PLAN_MAX_MEMBERS[plan],
      memberCount: 1,
      industry: dto.industry,
      website: dto.website,
      size: dto.size,
      settings: {
        allowMemberInvites: true,
        allowPublicCvs: true,
        requireApprovalForPublish: false,
        enableAiTools: true,
        enforceTemplates: false,
      },
    });

    const saved = await org.save();

    // Auto-add creator as Owner
    const membership = new this.memberModel({
      userId: new Types.ObjectId(userId),
      organizationId: saved._id,
      role: OrgRole.OWNER,
      isActive: true,
      joinedAt: new Date(),
      permissions: DEFAULT_PERMISSIONS[OrgRole.OWNER],
    });
    await membership.save();

    this.logger.log(
      `Organization created: ${saved.name} (${saved.slug}) by user ${userId}`,
    );
    return saved;
  }

  async findById(orgId: string): Promise<OrganizationDocument> {
    const org = await this.orgModel.findById(orgId).exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findBySlug(slug: string): Promise<OrganizationDocument> {
    const org = await this.orgModel.findOne({ slug }).exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findByUser(userId: string): Promise<OrganizationDocument[]> {
    const memberships = await this.memberModel
      .find({ userId: new Types.ObjectId(userId), isActive: true })
      .exec();
    const orgIds = memberships.map((m) => m.organizationId);
    return this.orgModel.find({ _id: { $in: orgIds } }).exec();
  }

  async update(
    orgId: string,
    userId: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationDocument> {
    await this.assertRole(userId, orgId, OrgRole.ADMIN);
    const updated = await this.orgModel
      .findByIdAndUpdate(orgId, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Organization not found');
    return updated;
  }

  async updateBranding(
    orgId: string,
    userId: string,
    dto: UpdateOrgBrandingDto,
  ): Promise<OrganizationDocument> {
    await this.assertRole(userId, orgId, OrgRole.ADMIN);
    const updated = await this.orgModel
      .findByIdAndUpdate(orgId, { $set: { branding: dto } }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Organization not found');
    return updated;
  }

  async updateSettings(
    orgId: string,
    userId: string,
    dto: UpdateOrgSettingsDto,
  ): Promise<OrganizationDocument> {
    await this.assertRole(userId, orgId, OrgRole.ADMIN);
    const updateFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) updateFields[`settings.${key}`] = value;
    }
    const updated = await this.orgModel
      .findByIdAndUpdate(orgId, { $set: updateFields }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Organization not found');
    return updated;
  }

  async delete(orgId: string, userId: string): Promise<void> {
    await this.assertRole(userId, orgId, OrgRole.OWNER);
    await Promise.all([
      this.orgModel.findByIdAndDelete(orgId).exec(),
      this.memberModel
        .deleteMany({ organizationId: new Types.ObjectId(orgId) })
        .exec(),
      this.teamModel
        .deleteMany({ organizationId: new Types.ObjectId(orgId) })
        .exec(),
    ]);
    this.logger.log(`Organization ${orgId} deleted by user ${userId}`);
  }

  // ─── Membership Management ───

  async inviteMember(
    orgId: string,
    inviterId: string,
    dto: InviteMemberDto,
  ): Promise<OrgMembershipDocument> {
    await this.assertRole(inviterId, orgId, OrgRole.ADMIN);
    const org = await this.findById(orgId);

    if (org.maxMembers !== -1 && org.memberCount >= org.maxMembers) {
      throw new BadRequestException(
        `Organization has reached maximum member limit (${org.maxMembers}). Upgrade your plan.`,
      );
    }

    // Check if already a member (we store by email for pending invites)
    const existing = await this.memberModel
      .findOne({ organizationId: new Types.ObjectId(orgId) })
      .exec();

    const role = dto.role || OrgRole.MEMBER;
    const membership = new this.memberModel({
      userId: new Types.ObjectId(), // placeholder — resolved on accept
      organizationId: new Types.ObjectId(orgId),
      role,
      isActive: false,
      invitedBy: new Types.ObjectId(inviterId),
      invitedAt: new Date(),
      teamIds: (dto.teamIds || []).map((id) => new Types.ObjectId(id)),
      permissions: DEFAULT_PERMISSIONS[role],
    });
    await membership.save();

    // Increment member count
    await this.orgModel
      .findByIdAndUpdate(orgId, { $inc: { memberCount: 1 } })
      .exec();
    return membership;
  }

  async addMember(
    orgId: string,
    userId: string,
    role: OrgRole = OrgRole.MEMBER,
  ): Promise<OrgMembershipDocument> {
    const existing = await this.memberModel
      .findOne({
        userId: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(orgId),
      })
      .exec();

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.joinedAt = new Date();
        return existing.save();
      }
      throw new ConflictException(
        'User is already a member of this organization',
      );
    }

    const membership = new this.memberModel({
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(orgId),
      role,
      isActive: true,
      joinedAt: new Date(),
      permissions: DEFAULT_PERMISSIONS[role],
    });
    await membership.save();
    await this.orgModel
      .findByIdAndUpdate(orgId, { $inc: { memberCount: 1 } })
      .exec();
    return membership;
  }

  async removeMember(
    orgId: string,
    removerId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.assertRole(removerId, orgId, OrgRole.ADMIN);

    const targetMembership = await this.getMembership(targetUserId, orgId);
    if (targetMembership.role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    const removerMembership = await this.getMembership(removerId, orgId);
    if (
      ROLE_HIERARCHY[targetMembership.role] >=
      ROLE_HIERARCHY[removerMembership.role]
    ) {
      throw new ForbiddenException(
        'Cannot remove a member with equal or higher role',
      );
    }

    targetMembership.isActive = false;
    await targetMembership.save();
    await this.orgModel
      .findByIdAndUpdate(orgId, { $inc: { memberCount: -1 } })
      .exec();
  }

  async updateMemberRole(
    orgId: string,
    updaterId: string,
    targetUserId: string,
    newRole: OrgRole,
  ): Promise<OrgMembershipDocument> {
    await this.assertRole(updaterId, orgId, OrgRole.ADMIN);

    if (newRole === OrgRole.OWNER) {
      throw new ForbiddenException(
        'Cannot assign owner role. Use transfer ownership.',
      );
    }

    const membership = await this.getMembership(targetUserId, orgId);
    membership.role = newRole;
    membership.permissions = DEFAULT_PERMISSIONS[newRole];
    return membership.save();
  }

  async getMembers(
    orgId: string,
    page = 1,
    limit = 20,
  ): Promise<{ members: OrgMembershipDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = {
      organizationId: new Types.ObjectId(orgId),
      isActive: true,
    };
    const [members, total] = await Promise.all([
      this.memberModel
        .find(filter)
        .populate('userId', 'name email avatar')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.memberModel.countDocuments(filter).exec(),
    ]);
    return { members, total };
  }

  async getMembership(
    userId: string,
    orgId: string,
  ): Promise<OrgMembershipDocument> {
    const membership = await this.memberModel
      .findOne({
        userId: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(orgId),
        isActive: true,
      })
      .exec();
    if (!membership)
      throw new NotFoundException('User is not a member of this organization');
    return membership;
  }

  async getUserRole(userId: string, orgId: string): Promise<OrgRole | null> {
    const membership = await this.memberModel
      .findOne({
        userId: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(orgId),
        isActive: true,
      })
      .exec();
    return membership?.role || null;
  }

  // ─── Team Management ───

  async createTeam(
    orgId: string,
    userId: string,
    dto: CreateTeamDto,
  ): Promise<TeamDocument> {
    await this.assertRole(userId, orgId, OrgRole.ADMIN);

    const slug = this.generateSlug(dto.name);
    const team = new this.teamModel({
      organizationId: new Types.ObjectId(orgId),
      name: dto.name,
      description: dto.description,
      slug,
      memberIds: (dto.memberIds || []).map((id) => new Types.ObjectId(id)),
      color: dto.color || '#3b82f6',
    });
    return team.save();
  }

  async updateTeam(
    orgId: string,
    teamId: string,
    userId: string,
    dto: UpdateTeamDto,
  ): Promise<TeamDocument> {
    await this.assertRole(userId, orgId, OrgRole.ADMIN);

    const update: Record<string, any> = {};
    if (dto.name) update.name = dto.name;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.color) update.color = dto.color;
    if (dto.memberIds)
      update.memberIds = dto.memberIds.map((id) => new Types.ObjectId(id));
    if (dto.leadId) update.leadId = new Types.ObjectId(dto.leadId);

    const updated = await this.teamModel
      .findByIdAndUpdate(teamId, { $set: update }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Team not found');
    return updated;
  }

  async deleteTeam(
    orgId: string,
    teamId: string,
    userId: string,
  ): Promise<void> {
    await this.assertRole(userId, orgId, OrgRole.ADMIN);
    await this.teamModel.findByIdAndDelete(teamId).exec();
    // Remove team from all memberships
    await this.memberModel
      .updateMany(
        { organizationId: new Types.ObjectId(orgId) },
        { $pull: { teamIds: new Types.ObjectId(teamId) } },
      )
      .exec();
  }

  async getTeams(orgId: string): Promise<TeamDocument[]> {
    return this.teamModel
      .find({ organizationId: new Types.ObjectId(orgId), isActive: true })
      .populate('memberIds', 'name email avatar')
      .populate('leadId', 'name email avatar')
      .exec();
  }

  // ─── Authorization Helpers ───

  async assertRole(
    userId: string,
    orgId: string,
    minimumRole: OrgRole,
  ): Promise<void> {
    const membership = await this.memberModel
      .findOne({
        userId: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(orgId),
        isActive: true,
      })
      .exec();

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    if (ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minimumRole]) {
      throw new ForbiddenException(
        `Requires ${minimumRole} role or higher. Current role: ${membership.role}`,
      );
    }
  }

  async transferOwnership(
    orgId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<void> {
    await this.assertRole(currentOwnerId, orgId, OrgRole.OWNER);

    const newOwnerMembership = await this.getMembership(newOwnerId, orgId);
    const currentOwnerMembership = await this.getMembership(
      currentOwnerId,
      orgId,
    );

    newOwnerMembership.role = OrgRole.OWNER;
    newOwnerMembership.permissions = DEFAULT_PERMISSIONS[OrgRole.OWNER];
    await newOwnerMembership.save();

    currentOwnerMembership.role = OrgRole.ADMIN;
    currentOwnerMembership.permissions = DEFAULT_PERMISSIONS[OrgRole.ADMIN];
    await currentOwnerMembership.save();

    await this.orgModel
      .findByIdAndUpdate(orgId, { ownerId: new Types.ObjectId(newOwnerId) })
      .exec();

    this.logger.log(
      `Ownership transferred: org ${orgId} from ${currentOwnerId} to ${newOwnerId}`,
    );
  }

  // ─── Analytics ───

  async getOrgStats(orgId: string): Promise<{
    memberCount: number;
    teamCount: number;
    plan: OrgPlan;
    status: OrgStatus;
  }> {
    const org = await this.findById(orgId);
    const teamCount = await this.teamModel
      .countDocuments({
        organizationId: new Types.ObjectId(orgId),
        isActive: true,
      })
      .exec();

    return {
      memberCount: org.memberCount,
      teamCount,
      plan: org.plan,
      status: org.status,
    };
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ orgs: OrganizationDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [orgs, total] = await Promise.all([
      this.orgModel
        .find()
        .populate('ownerId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.orgModel.countDocuments().exec(),
    ]);
    return { orgs, total };
  }

  // ─── Helpers ───

  private generateSlug(text: string): string {
    return (
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now().toString(36)
    );
  }
}
