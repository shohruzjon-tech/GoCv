import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CvVersion, CvVersionDocument } from './schemas/cv-version.schema.js';
import { Cv, CvDocument } from './schemas/cv.schema.js';

@Injectable()
export class CvVersionService {
  private readonly logger = new Logger(CvVersionService.name);

  constructor(
    @InjectModel(CvVersion.name) private versionModel: Model<CvVersionDocument>,
    @InjectModel(Cv.name) private cvModel: Model<CvDocument>,
  ) {}

  // ─── Create Version Snapshot ───

  async createVersion(
    cvId: string,
    userId: string,
    changeType: string,
    changeDescription?: string,
    label?: string,
  ): Promise<CvVersionDocument> {
    const cv = await this.cvModel.findById(cvId).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized to version this CV');
    }

    // Get next version number
    const lastVersion = await this.versionModel
      .findOne({ cvId: new Types.ObjectId(cvId), isBranch: false })
      .sort({ version: -1 })
      .exec();
    const nextVersion = (lastVersion?.version || 0) + 1;

    const snapshot = {
      title: cv.title,
      summary: cv.summary,
      personalInfo: cv.personalInfo,
      sections: cv.sections,
      theme: cv.theme,
      templateId: cv.templateId,
      aiGeneratedHtml: cv.aiGeneratedHtml,
    };

    // Calculate diff from previous version
    const diff = lastVersion
      ? this.calculateDiff(lastVersion.snapshot, snapshot)
      : {
          fieldsChanged: ['initial'],
          sectionsAdded: [],
          sectionsRemoved: [],
          sectionsModified: [],
        };

    const version = new this.versionModel({
      cvId: new Types.ObjectId(cvId),
      userId: new Types.ObjectId(userId),
      version: nextVersion,
      label: label || `v${nextVersion}`,
      snapshot,
      changeDescription,
      changeType,
      diff,
      parentVersionId: lastVersion?._id,
      sizeBytes: Buffer.byteLength(JSON.stringify(snapshot), 'utf8'),
    });

    const saved = await version.save();
    this.logger.log(
      `CV version ${nextVersion} created for CV ${cvId} [${changeType}]`,
    );
    return saved;
  }

  // ─── List Versions ───

  async getVersions(
    cvId: string,
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ versions: CvVersionDocument[]; total: number }> {
    const cv = await this.cvModel.findById(cvId).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const filter = { cvId: new Types.ObjectId(cvId), isBranch: false };
    const skip = (page - 1) * limit;
    const [versions, total] = await Promise.all([
      this.versionModel
        .find(filter)
        .sort({ version: -1 })
        .skip(skip)
        .limit(limit)
        .select('-snapshot.aiGeneratedHtml')
        .exec(),
      this.versionModel.countDocuments(filter).exec(),
    ]);

    return { versions, total };
  }

  // ─── Get Specific Version ───

  async getVersion(
    cvId: string,
    versionNumber: number,
    userId: string,
  ): Promise<CvVersionDocument> {
    const cv = await this.cvModel.findById(cvId).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const version = await this.versionModel
      .findOne({ cvId: new Types.ObjectId(cvId), version: versionNumber })
      .exec();
    if (!version)
      throw new NotFoundException(`Version ${versionNumber} not found`);
    return version;
  }

  // ─── Restore Version ───

  async restoreVersion(
    cvId: string,
    versionNumber: number,
    userId: string,
  ): Promise<CvDocument> {
    const version = await this.getVersion(cvId, versionNumber, userId);

    // Create a version snapshot of current state before restoring
    await this.createVersion(
      cvId,
      userId,
      'restore',
      `Restored from v${versionNumber}`,
    );

    // Apply the version snapshot to the CV
    const updated = await this.cvModel
      .findByIdAndUpdate(
        cvId,
        {
          $set: {
            title: version.snapshot.title,
            summary: version.snapshot.summary,
            personalInfo: version.snapshot.personalInfo,
            sections: version.snapshot.sections,
            theme: version.snapshot.theme,
            templateId: version.snapshot.templateId,
            aiGeneratedHtml: version.snapshot.aiGeneratedHtml,
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) throw new NotFoundException('CV not found after restore');

    this.logger.log(`CV ${cvId} restored to version ${versionNumber}`);
    return updated;
  }

  // ─── Branching ───

  async createBranch(
    cvId: string,
    userId: string,
    branchName: string,
  ): Promise<CvVersionDocument> {
    const cv = await this.cvModel.findById(cvId).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const lastVersion = await this.versionModel
      .findOne({ cvId: new Types.ObjectId(cvId), isBranch: false })
      .sort({ version: -1 })
      .exec();

    const snapshot = {
      title: cv.title,
      summary: cv.summary,
      personalInfo: cv.personalInfo,
      sections: cv.sections,
      theme: cv.theme,
      templateId: cv.templateId,
      aiGeneratedHtml: cv.aiGeneratedHtml,
    };

    const branch = new this.versionModel({
      cvId: new Types.ObjectId(cvId),
      userId: new Types.ObjectId(userId),
      version: (lastVersion?.version || 0) + 1,
      label: branchName,
      snapshot,
      changeDescription: `Branch created: ${branchName}`,
      changeType: 'branch',
      parentVersionId: lastVersion?._id,
      branchName,
      isBranch: true,
      sizeBytes: Buffer.byteLength(JSON.stringify(snapshot), 'utf8'),
    });

    const saved = await branch.save();
    this.logger.log(`Branch "${branchName}" created for CV ${cvId}`);
    return saved;
  }

  async getBranches(
    cvId: string,
    userId: string,
  ): Promise<CvVersionDocument[]> {
    const cv = await this.cvModel.findById(cvId).exec();
    if (!cv) throw new NotFoundException('CV not found');
    if (cv.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    return this.versionModel
      .find({ cvId: new Types.ObjectId(cvId), isBranch: true })
      .sort({ createdAt: -1 })
      .select('-snapshot.aiGeneratedHtml')
      .exec();
  }

  // ─── Compare Versions ───

  async compareVersions(
    cvId: string,
    versionA: number,
    versionB: number,
    userId: string,
  ): Promise<{
    versionA: CvVersionDocument;
    versionB: CvVersionDocument;
    diff: Record<string, any>;
  }> {
    const a = await this.getVersion(cvId, versionA, userId);
    const b = await this.getVersion(cvId, versionB, userId);

    return {
      versionA: a,
      versionB: b,
      diff: this.calculateDiff(a.snapshot, b.snapshot),
    };
  }

  // ─── Diff Calculation ───

  private calculateDiff(
    oldSnapshot: Record<string, any>,
    newSnapshot: Record<string, any>,
  ): {
    fieldsChanged: string[];
    sectionsAdded: string[];
    sectionsRemoved: string[];
    sectionsModified: string[];
  } {
    const fieldsChanged: string[] = [];
    const sectionsAdded: string[] = [];
    const sectionsRemoved: string[] = [];
    const sectionsModified: string[] = [];

    // Compare top-level fields
    for (const key of ['title', 'summary', 'templateId']) {
      if (
        JSON.stringify(oldSnapshot[key]) !== JSON.stringify(newSnapshot[key])
      ) {
        fieldsChanged.push(key);
      }
    }

    if (
      JSON.stringify(oldSnapshot.personalInfo) !==
      JSON.stringify(newSnapshot.personalInfo)
    ) {
      fieldsChanged.push('personalInfo');
    }

    if (
      JSON.stringify(oldSnapshot.theme) !== JSON.stringify(newSnapshot.theme)
    ) {
      fieldsChanged.push('theme');
    }

    // Compare sections
    const oldSections = oldSnapshot.sections || [];
    const newSections = newSnapshot.sections || [];
    const oldTypes = new Set<string>(oldSections.map((s: any) => s.type));
    const newTypes = new Set<string>(newSections.map((s: any) => s.type));

    for (const type of newTypes) {
      if (!oldTypes.has(type)) sectionsAdded.push(type);
    }
    for (const type of oldTypes) {
      if (!newTypes.has(type)) sectionsRemoved.push(type);
    }
    for (const type of newTypes) {
      if (oldTypes.has(type)) {
        const oldSection = oldSections.find((s: any) => s.type === type);
        const newSection = newSections.find((s: any) => s.type === type);
        if (JSON.stringify(oldSection) !== JSON.stringify(newSection)) {
          sectionsModified.push(type);
        }
      }
    }

    return { fieldsChanged, sectionsAdded, sectionsRemoved, sectionsModified };
  }

  // ─── Cleanup ───

  async getStorageUsage(userId: string): Promise<{
    totalVersions: number;
    totalSizeBytes: number;
  }> {
    const result = await this.versionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalVersions: { $sum: 1 },
          totalSizeBytes: { $sum: '$sizeBytes' },
        },
      },
    ]);

    return result[0] || { totalVersions: 0, totalSizeBytes: 0 };
  }
}
