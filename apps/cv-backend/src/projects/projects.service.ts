import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto.js';
import { UploadService } from '../upload/upload.service.js';
import 'multer';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private uploadService: UploadService,
  ) {}

  async create(
    userId: string,
    dto: CreateProjectDto,
  ): Promise<ProjectDocument> {
    const project = new this.projectModel({
      ...dto,
      userId: new Types.ObjectId(userId),
      cvId: dto.cvId ? new Types.ObjectId(dto.cvId) : undefined,
    });
    return project.save();
  }

  async findAllByUser(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ order: 1, createdAt: -1 })
      .exec();
  }

  async findByCv(cvId: string): Promise<ProjectDocument[]> {
    return this.projectModel
      .find({ cvId: new Types.ObjectId(cvId), isVisible: true })
      .sort({ order: 1 })
      .exec();
  }

  async findById(id: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    const updated = await this.projectModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Project not found after update');
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Delete associated images from S3
    for (const image of project.images) {
      if (image.key) {
        await this.uploadService.deleteFile(image.key);
      }
    }

    await this.projectModel.findByIdAndDelete(id).exec();
  }

  async addImages(
    id: string,
    userId: string,
    files: Express.Multer.File[],
  ): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const uploadResults = await this.uploadService.uploadMultipleFiles(
      files,
      `projects/${id}`,
    );

    const newImages = uploadResults.map((result, index) => ({
      url: result.url,
      key: result.key,
      order: project.images.length + index,
    }));

    project.images.push(...newImages);
    return project.save();
  }

  async removeImage(
    id: string,
    userId: string,
    imageIndex: number,
  ): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const image = project.images[imageIndex];
    if (image?.key) {
      await this.uploadService.deleteFile(image.key);
    }

    project.images.splice(imageIndex, 1);
    return project.save();
  }

  async reorderImages(
    id: string,
    userId: string,
    order: number[],
  ): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const reordered = order.map((idx) => project.images[idx]).filter(Boolean);
    project.images = reordered;
    return project.save();
  }

  // Public: find visible projects for a user
  async findPublicByUserId(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel
      .find({ userId: new Types.ObjectId(userId), isVisible: true })
      .sort({ order: 1, createdAt: -1 })
      .exec();
  }
}
