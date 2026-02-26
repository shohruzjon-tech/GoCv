import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cv, CvDocument } from './schemas/cv.schema.js';
import {
  CreateCvDto,
  UpdateCvDto,
  AiGenerateCvDto,
  AiEditSectionDto,
} from './dto/cv.dto.js';
import { AiService } from '../ai/ai.service.js';
import { CvStatus } from '../common/enums/cv-status.enum.js';

@Injectable()
export class CvService {
  constructor(
    @InjectModel(Cv.name) private cvModel: Model<CvDocument>,
    private aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateCvDto): Promise<CvDocument> {
    const cv = new this.cvModel({
      ...dto,
      userId: new Types.ObjectId(userId),
      slug: this.generateSlug(dto.title),
    });
    return cv.save();
  }

  async findAllByUser(userId: string): Promise<CvDocument[]> {
    return this.cvModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<CvDocument> {
    const cv = await this.cvModel.findById(id).exec();
    if (!cv) throw new NotFoundException('CV not found');
    return cv;
  }

  async findBySlug(slug: string): Promise<CvDocument> {
    const cv = await this.cvModel
      .findOne({ slug, isPublic: true, status: CvStatus.PUBLISHED })
      .exec();
    if (!cv) throw new NotFoundException('CV not found');
    return cv;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCvDto,
  ): Promise<CvDocument> {
    const cv = await this.cvModel.findById(id).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized to edit this CV');
    }

    if (dto.slug) {
      dto.slug = this.generateSlug(dto.slug);
    }

    const updated = await this.cvModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('CV not found after update');
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const cv = await this.cvModel.findById(id).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized to delete this CV');
    }
    await this.cvModel.findByIdAndDelete(id).exec();
  }

  async generateWithAi(
    userId: string,
    dto: AiGenerateCvDto,
  ): Promise<CvDocument> {
    let existingCv: CvDocument | null = null;

    if (dto.cvId) {
      existingCv = await this.cvModel.findById(dto.cvId).exec();
      if (existingCv && existingCv.userId.toString() !== userId) {
        throw new ForbiddenException('Not authorized');
      }
    }

    const context =
      dto.context ||
      (existingCv
        ? {
            personalInfo: existingCv.personalInfo,
            sections: existingCv.sections,
            summary: existingCv.summary,
          }
        : undefined);

    const aiResult = await this.aiService.generateCv(dto.prompt, context);

    if (existingCv) {
      existingCv.sections = aiResult.sections;
      existingCv.personalInfo = aiResult.personalInfo;
      existingCv.summary = aiResult.summary;
      existingCv.theme = aiResult.theme;
      existingCv.aiGeneratedHtml = aiResult.html;
      existingCv.lastAiPrompt = dto.prompt;
      return existingCv.save();
    }

    const cv = new this.cvModel({
      userId: new Types.ObjectId(userId),
      title: `AI Generated CV - ${new Date().toLocaleDateString()}`,
      sections: aiResult.sections,
      personalInfo: aiResult.personalInfo,
      summary: aiResult.summary,
      theme: aiResult.theme,
      aiGeneratedHtml: aiResult.html,
      lastAiPrompt: dto.prompt,
      slug: this.generateSlug('ai-cv-' + Date.now()),
    });

    return cv.save();
  }

  async editSectionWithAi(
    cvId: string,
    userId: string,
    dto: AiEditSectionDto,
  ): Promise<CvDocument> {
    const cv = await this.cvModel.findById(cvId).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const existingSection = cv.sections.find((s) => s.type === dto.sectionType);
    const aiResult = await this.aiService.editSection(
      dto.prompt,
      dto.sectionType,
      dto.currentContent || existingSection?.content,
    );

    if (existingSection) {
      existingSection.content = aiResult;
    } else {
      cv.sections.push({
        type: dto.sectionType,
        title:
          dto.sectionType.charAt(0).toUpperCase() + dto.sectionType.slice(1),
        content: aiResult,
        order: cv.sections.length,
        visible: true,
      });
    }

    // Regenerate HTML
    const html = await this.aiService.generateCvHtml({
      personalInfo: cv.personalInfo,
      sections: cv.sections,
      summary: cv.summary,
      theme: cv.theme,
    });
    cv.aiGeneratedHtml = html;

    return cv.save();
  }

  async regenerateHtml(cvId: string, userId: string): Promise<CvDocument> {
    const cv = await this.cvModel.findById(cvId).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const html = await this.aiService.generateCvHtml({
      personalInfo: cv.personalInfo,
      sections: cv.sections,
      summary: cv.summary,
      theme: cv.theme,
    });

    cv.aiGeneratedHtml = html;
    return cv.save();
  }

  async publish(cvId: string, userId: string): Promise<CvDocument> {
    const cv = await this.cvModel.findById(cvId).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    cv.status = CvStatus.PUBLISHED;
    cv.isPublic = true;
    return cv.save();
  }

  async getPublicCv(slug: string): Promise<CvDocument> {
    return this.findBySlug(slug);
  }

  // Admin methods
  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ cvs: CvDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [cvs, total] = await Promise.all([
      this.cvModel
        .find()
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.cvModel.countDocuments().exec(),
    ]);
    return { cvs, total };
  }

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
