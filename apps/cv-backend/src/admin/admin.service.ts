import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { CvService } from '../cv/cv.service.js';
import { Role } from '../common/enums/role.enum.js';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private cvService: CvService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
  }

  private async seedDefaultAdmin() {
    const adminEmail =
      this.configService.get<string>('admin.email') || 'admin@cvbuilder.com';
    const adminPassword =
      this.configService.get<string>('admin.password') || 'Admin@123456';

    const existingAdmin = await this.usersService.findByEmail(adminEmail);
    if (!existingAdmin) {
      await this.usersService.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: Role.ADMIN,
        username: 'admin',
        isActive: true,
      });
      this.logger.log(`Default admin created: ${adminEmail}`);
    } else {
      this.logger.log('Default admin already exists');
    }
  }

  // --- User Management ---
  async getUsers(page = 1, limit = 20) {
    return this.usersService.findAll(page, limit);
  }

  async getUserById(id: string) {
    return this.usersService.findById(id);
  }

  async toggleUserActive(id: string, isActive: boolean) {
    if (!isActive) {
      // Deactivate all sessions when disabling user
      await this.sessionsService.deactivateAllForUser(id);
    }
    return this.usersService.setActive(id, isActive);
  }

  async deleteUser(id: string) {
    await this.sessionsService.deactivateAllForUser(id);
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  async changeUserRole(id: string, role: Role) {
    const user = await this.usersService.findById(id);
    if (!user) throw new Error('User not found');
    user.role = role;
    return user.save();
  }

  // --- Session Management ---
  async getSessions(page = 1, limit = 20) {
    return this.sessionsService.findAll(page, limit);
  }

  async getUserSessions(userId: string) {
    return this.sessionsService.findByUserId(userId);
  }

  async terminateSession(sessionId: string) {
    await this.sessionsService.deactivate(sessionId);
    return { message: 'Session terminated' };
  }

  async terminateAllUserSessions(userId: string) {
    await this.sessionsService.deactivateAllForUser(userId);
    return { message: 'All user sessions terminated' };
  }

  // --- CV Management ---
  async getAllCvs(page = 1, limit = 20) {
    return this.cvService.findAll(page, limit);
  }

  // --- Dashboard Stats ---
  async getDashboardStats() {
    const { total: totalUsers } = await this.usersService.findAll(1, 1);
    const { total: totalCvs } = await this.cvService.findAll(1, 1);
    const { total: totalSessions } = await this.sessionsService.findAll(1, 1);

    return {
      totalUsers,
      totalCvs,
      totalSessions,
    };
  }
}
