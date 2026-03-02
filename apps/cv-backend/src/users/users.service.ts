import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }
    const user = new this.userModel(userData);
    return user.save();
  }

  async update(
    id: string,
    updateData: UpdateUserDto,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { lastLoginAt: new Date() })
      .exec();
  }

  async setActive(id: string, isActive: boolean): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();
  }

  async setEmailVerified(
    id: string,
    isEmailVerified: boolean,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { isEmailVerified }, { new: true })
      .exec();
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.userModel.findByIdAndUpdate(id, { password: hashed }).exec();
  }

  async findAll(
    page = 1,
    limit = 20,
    filters?: {
      search?: string;
      role?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: string;
    },
  ): Promise<{ users: UserDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters?.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { username: regex }];
    }
    if (filters?.role && filters.role !== 'all') {
      query.role = filters.role;
    }
    if (filters?.status === 'active') {
      query.isActive = true;
    } else if (filters?.status === 'inactive') {
      query.isActive = false;
    } else if (filters?.status === 'verified') {
      query.isEmailVerified = true;
    } else if (filters?.status === 'unverified') {
      query.isEmailVerified = false;
    }

    const sortField = filters?.sortBy || 'createdAt';
    const sortDir = filters?.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortDir };

    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).sort(sort).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    return { users, total };
  }

  async validatePassword(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .exec();
    if (!user || !user.password) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async deleteUser(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
