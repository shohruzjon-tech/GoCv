import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from './schemas/template.schema.js';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto.js';
import { TemplateStatus } from '../common/enums/template.enum.js';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
  ) {}

  async create(dto: CreateTemplateDto): Promise<TemplateDocument> {
    const slug = this.generateSlug(dto.name);
    const template = new this.templateModel({ ...dto, slug });
    return template.save();
  }

  async findAll(filters?: {
    category?: string;
    isPremium?: boolean;
    status?: string;
  }): Promise<TemplateDocument[]> {
    const query: Record<string, any> = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.isPremium !== undefined) query.isPremium = filters.isPremium;
    query.status = filters?.status || TemplateStatus.ACTIVE;

    return this.templateModel
      .find(query)
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  async findById(id: string): Promise<TemplateDocument> {
    const template = await this.templateModel.findById(id).exec();
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async findBySlug(slug: string): Promise<TemplateDocument> {
    const template = await this.templateModel.findOne({ slug }).exec();
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<TemplateDocument> {
    const updated = await this.templateModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Template not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const result = await this.templateModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Template not found');
  }

  async incrementUsage(id: string): Promise<void> {
    await this.templateModel
      .findByIdAndUpdate(id, { $inc: { usageCount: 1 } })
      .exec();
  }

  // Get templates accessible by plan
  async findByPlan(plan: string): Promise<TemplateDocument[]> {
    const query: Record<string, any> = {
      status: TemplateStatus.ACTIVE,
    };

    if (plan === 'free') {
      query.isPremium = false;
      query.isEnterprise = false;
    } else if (plan === 'premium') {
      query.isEnterprise = false;
    }
    // Enterprise can access all

    return this.templateModel.find(query).sort({ sortOrder: 1 }).exec();
  }

  // Admin: list all with pagination
  async findAllAdmin(
    page = 1,
    limit = 20,
  ): Promise<{ templates: TemplateDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [templates, total] = await Promise.all([
      this.templateModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ sortOrder: 1, createdAt: -1 })
        .exec(),
      this.templateModel.countDocuments().exec(),
    ]);
    return { templates, total };
  }

  async seedDefaults(): Promise<void> {
    const count = await this.templateModel.countDocuments().exec();
    if (count > 0) return;

    this.logger.log('Seeding default templates...');

    const defaultTemplates: Partial<Template>[] = [
      {
        name: 'Minimal Clean',
        slug: 'minimal-clean',
        description: 'A clean, minimalist CV template with focus on content.',
        category: 'minimal' as any,
        htmlTemplate: this.getMinimalTemplate(),
        isPremium: false,
        sortOrder: 1,
        tags: ['clean', 'simple', 'professional'],
        colorThemes: [
          {
            name: 'Classic',
            primaryColor: '#1a1a2e',
            secondaryColor: '#6366f1',
            backgroundColor: '#ffffff',
            textColor: '#334155',
          },
          {
            name: 'Ocean',
            primaryColor: '#0f172a',
            secondaryColor: '#0ea5e9',
            backgroundColor: '#ffffff',
            textColor: '#334155',
          },
        ],
        supportedFonts: ['Inter', 'Plus Jakarta Sans', 'DM Sans'],
        defaultFont: 'Inter',
      },
      {
        name: 'Corporate Professional',
        slug: 'corporate-professional',
        description:
          'Professional template suited for corporate and business roles.',
        category: 'corporate' as any,
        htmlTemplate: this.getCorporateTemplate(),
        isPremium: false,
        sortOrder: 2,
        tags: ['business', 'formal', 'corporate'],
        colorThemes: [
          {
            name: 'Navy',
            primaryColor: '#1e3a5f',
            secondaryColor: '#3b82f6',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
          },
          {
            name: 'Charcoal',
            primaryColor: '#1f2937',
            secondaryColor: '#6b7280',
            backgroundColor: '#ffffff',
            textColor: '#111827',
          },
        ],
        supportedFonts: ['Inter', 'Source Sans 3', 'Merriweather'],
        defaultFont: 'Source Sans 3',
      },
      {
        name: 'Creative Portfolio',
        slug: 'creative-portfolio',
        description:
          'Bold, creative template for designers and creative professionals.',
        category: 'creative' as any,
        htmlTemplate: this.getCreativeTemplate(),
        isPremium: true,
        sortOrder: 3,
        tags: ['creative', 'design', 'portfolio', 'colorful'],
        colorThemes: [
          {
            name: 'Vibrant',
            primaryColor: '#7c3aed',
            secondaryColor: '#ec4899',
            backgroundColor: '#fafafa',
            textColor: '#1a1a2e',
          },
          {
            name: 'Sunset',
            primaryColor: '#f97316',
            secondaryColor: '#ef4444',
            backgroundColor: '#fffbeb',
            textColor: '#1c1917',
          },
        ],
        supportedFonts: ['Plus Jakarta Sans', 'Space Grotesk', 'Outfit'],
        defaultFont: 'Plus Jakarta Sans',
      },
      {
        name: 'Tech Developer',
        slug: 'tech-developer',
        description:
          'Modern template designed for software engineers and tech professionals.',
        category: 'tech' as any,
        htmlTemplate: this.getTechTemplate(),
        isPremium: true,
        sortOrder: 4,
        tags: ['tech', 'developer', 'engineer', 'modern'],
        colorThemes: [
          {
            name: 'Dark Code',
            primaryColor: '#0f172a',
            secondaryColor: '#22d3ee',
            backgroundColor: '#f8fafc',
            textColor: '#0f172a',
          },
          {
            name: 'GitHub',
            primaryColor: '#24292f',
            secondaryColor: '#2ea44f',
            backgroundColor: '#ffffff',
            textColor: '#24292f',
          },
        ],
        supportedFonts: ['JetBrains Mono', 'Inter', 'Fira Code'],
        defaultFont: 'Inter',
      },
      {
        name: 'Executive Suite',
        slug: 'executive-suite',
        description:
          'Prestigious template for C-level executives and senior leadership.',
        category: 'executive' as any,
        htmlTemplate: this.getExecutiveTemplate(),
        isPremium: true,
        isEnterprise: true,
        sortOrder: 5,
        tags: ['executive', 'leadership', 'premium', 'elegant'],
        colorThemes: [
          {
            name: 'Gold Standard',
            primaryColor: '#1a1a2e',
            secondaryColor: '#b8860b',
            backgroundColor: '#fefdf8',
            textColor: '#1a1a2e',
          },
          {
            name: 'Silver Elite',
            primaryColor: '#1e293b',
            secondaryColor: '#94a3b8',
            backgroundColor: '#ffffff',
            textColor: '#0f172a',
          },
        ],
        supportedFonts: ['Playfair Display', 'Lora', 'Cormorant Garamond'],
        defaultFont: 'Playfair Display',
      },
    ];

    await this.templateModel.insertMany(
      defaultTemplates.map((t) => ({
        ...t,
        status: TemplateStatus.ACTIVE,
        layoutConfig: {
          columns: 1,
          sidebarPosition: 'none',
          headerStyle: 'full-width',
          sectionSpacing: 'normal',
        },
      })),
    );

    this.logger.log(`Seeded ${defaultTemplates.length} default templates`);
  }

  // Template HTML generators
  private getMinimalTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: {{fontFamily}}, system-ui, sans-serif; color: {{textColor}}; background: {{backgroundColor}}; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
    .header { margin-bottom: 32px; border-bottom: 2px solid {{primaryColor}}; padding-bottom: 24px; }
    .header h1 { font-size: 32px; font-weight: 700; color: {{primaryColor}}; letter-spacing: -0.5px; }
    .header .subtitle { color: {{secondaryColor}}; font-size: 16px; margin-top: 4px; }
    .contact { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; font-size: 13px; color: #64748b; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: {{secondaryColor}}; margin-bottom: 16px; }
    .item { margin-bottom: 16px; }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; }
    .item-title { font-weight: 600; color: {{primaryColor}}; }
    .item-subtitle { color: #64748b; font-size: 14px; }
    .item-date { font-size: 13px; color: #94a3b8; }
    .item-desc { font-size: 14px; margin-top: 4px; }
    .skills { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill { background: {{secondaryColor}}10; color: {{secondaryColor}}; padding: 4px 12px; border-radius: 4px; font-size: 13px; }
    @media print { body { -webkit-print-color-adjust: exact; } .container { padding: 24px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{fullName}}</h1>
      <div class="subtitle">{{headline}}</div>
      <div class="contact">
        {{#if email}}<span>{{email}}</span>{{/if}}
        {{#if phone}}<span>{{phone}}</span>{{/if}}
        {{#if location}}<span>{{location}}</span>{{/if}}
        {{#if website}}<a href="{{website}}">{{website}}</a>{{/if}}
      </div>
    </div>
    {{#if summary}}
    <div class="section">
      <h2>Summary</h2>
      <p class="item-desc">{{summary}}</p>
    </div>
    {{/if}}
    {{#each sections}}
    <div class="section">
      <h2>{{this.title}}</h2>
      {{#each this.content.items}}
      <div class="item">
        <div class="item-header">
          <div><span class="item-title">{{this.title}}{{this.degree}}</span> <span class="item-subtitle">— {{this.company}}{{this.institution}}</span></div>
          <span class="item-date">{{this.startDate}} – {{this.endDate}}</span>
        </div>
        <p class="item-desc">{{this.description}}</p>
      </div>
      {{/each}}
      {{#if this.content.categories}}
      <div class="skills">
        {{#each this.content.categories}}
        {{#each this.skills}}
        <span class="skill">{{this}}</span>
        {{/each}}
        {{/each}}
      </div>
      {{/if}}
    </div>
    {{/each}}
  </div>
</body>
</html>`;
  }

  private getCorporateTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: {{fontFamily}}, system-ui, sans-serif; color: {{textColor}}; background: {{backgroundColor}}; }
    .page { max-width: 850px; margin: 0 auto; }
    .top-bar { background: {{primaryColor}}; color: #fff; padding: 40px 48px; }
    .top-bar h1 { font-size: 36px; font-weight: 700; }
    .top-bar .title { font-size: 18px; opacity: 0.9; margin-top: 4px; }
    .top-bar .contacts { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 16px; font-size: 14px; opacity: 0.85; }
    .body { padding: 32px 48px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 18px; font-weight: 700; color: {{primaryColor}}; border-left: 4px solid {{secondaryColor}}; padding-left: 12px; margin-bottom: 16px; }
    .entry { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
    .entry:last-child { border-bottom: none; }
    .entry-row { display: flex; justify-content: space-between; }
    .entry h3 { font-size: 16px; font-weight: 600; color: {{primaryColor}}; }
    .entry .org { font-size: 14px; color: {{secondaryColor}}; }
    .entry .date { font-size: 13px; color: #9ca3af; }
    .entry p { font-size: 14px; margin-top: 6px; line-height: 1.6; }
    .entry ul { margin-top: 6px; padding-left: 20px; font-size: 14px; }
    .entry li { margin-bottom: 4px; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-tag { background: {{primaryColor}}0D; color: {{primaryColor}}; border: 1px solid {{primaryColor}}20; padding: 4px 14px; border-radius: 6px; font-size: 13px; }
    @media print { .top-bar { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="top-bar">
      <h1>{{fullName}}</h1>
      <div class="title">{{headline}}</div>
      <div class="contacts">
        {{#if email}}<span>✉ {{email}}</span>{{/if}}
        {{#if phone}}<span>☎ {{phone}}</span>{{/if}}
        {{#if location}}<span>📍 {{location}}</span>{{/if}}
      </div>
    </div>
    <div class="body">
      {{#if summary}}
      <div class="section"><h2>Professional Summary</h2><p style="font-size:14px;line-height:1.7">{{summary}}</p></div>
      {{/if}}
      {{#each sections}}
      <div class="section">
        <h2>{{this.title}}</h2>
        {{#each this.content.items}}
        <div class="entry">
          <div class="entry-row"><div><h3>{{this.title}}{{this.degree}}</h3><div class="org">{{this.company}}{{this.institution}}</div></div><div class="date">{{this.startDate}} – {{this.endDate}}</div></div>
          {{#if this.description}}<p>{{this.description}}</p>{{/if}}
          {{#if this.highlights}}<ul>{{#each this.highlights}}<li>{{this}}</li>{{/each}}</ul>{{/if}}
        </div>
        {{/each}}
        {{#if this.content.categories}}<div class="skills-grid">{{#each this.content.categories}}{{#each this.skills}}<span class="skill-tag">{{this}}</span>{{/each}}{{/each}}</div>{{/if}}
      </div>
      {{/each}}
    </div>
  </div>
</body>
</html>`;
  }

  private getCreativeTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: {{fontFamily}}, system-ui, sans-serif; color: {{textColor}}; background: {{backgroundColor}}; }
    .cv { max-width: 860px; margin: 0 auto; display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
    .sidebar { background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); color: #fff; padding: 48px 28px; }
    .avatar { width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.2); margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 700; }
    .sidebar h1 { font-size: 22px; text-align: center; margin-bottom: 4px; }
    .sidebar .tagline { text-align: center; font-size: 14px; opacity: 0.85; margin-bottom: 28px; }
    .sidebar-section { margin-bottom: 24px; }
    .sidebar-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin-bottom: 12px; }
    .sidebar-section p, .sidebar-section a { font-size: 13px; opacity: 0.9; display: block; margin-bottom: 6px; text-decoration: none; color: inherit; }
    .skill-bar { margin-bottom: 8px; }
    .skill-bar .label { font-size: 12px; margin-bottom: 4px; }
    .skill-bar .bar { height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; }
    .skill-bar .fill { height: 4px; background: #fff; border-radius: 2px; }
    .main { padding: 48px 36px; }
    .main .section { margin-bottom: 32px; }
    .main .section h2 { font-size: 20px; font-weight: 700; color: {{primaryColor}}; margin-bottom: 16px; position: relative; padding-bottom: 8px; }
    .main .section h2::after { content: ''; position: absolute; bottom: 0; left: 0; width: 40px; height: 3px; background: linear-gradient(90deg, {{primaryColor}}, {{secondaryColor}}); border-radius: 2px; }
    .timeline-item { position: relative; padding-left: 20px; margin-bottom: 20px; border-left: 2px solid {{primaryColor}}20; }
    .timeline-item::before { content: ''; position: absolute; left: -5px; top: 6px; width: 8px; height: 8px; border-radius: 50%; background: {{secondaryColor}}; }
    .timeline-item h3 { font-size: 15px; font-weight: 600; color: {{primaryColor}}; }
    .timeline-item .meta { font-size: 13px; color: {{secondaryColor}}; margin-bottom: 6px; }
    .timeline-item p { font-size: 14px; line-height: 1.6; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="cv">
    <div class="sidebar">
      <div class="avatar">{{initials}}</div>
      <h1>{{fullName}}</h1>
      <div class="tagline">{{headline}}</div>
      <div class="sidebar-section">
        <h3>Contact</h3>
        {{#if email}}<p>{{email}}</p>{{/if}}
        {{#if phone}}<p>{{phone}}</p>{{/if}}
        {{#if location}}<p>{{location}}</p>{{/if}}
        {{#if website}}<a href="{{website}}">{{website}}</a>{{/if}}
      </div>
      {{#each skillsSection.content.categories}}
      <div class="sidebar-section">
        <h3>{{this.name}}</h3>
        {{#each this.skills}}<div class="skill-bar"><div class="label">{{this}}</div><div class="bar"><div class="fill" style="width:85%"></div></div></div>{{/each}}
      </div>
      {{/each}}
    </div>
    <div class="main">
      {{#if summary}}<div class="section"><h2>About Me</h2><p style="font-size:14px;line-height:1.7">{{summary}}</p></div>{{/if}}
      {{#each mainSections}}
      <div class="section">
        <h2>{{this.title}}</h2>
        {{#each this.content.items}}
        <div class="timeline-item">
          <h3>{{this.title}}{{this.degree}}</h3>
          <div class="meta">{{this.company}}{{this.institution}} · {{this.startDate}} – {{this.endDate}}</div>
          {{#if this.description}}<p>{{this.description}}</p>{{/if}}
        </div>
        {{/each}}
      </div>
      {{/each}}
    </div>
  </div>
</body>
</html>`;
  }

  private getTechTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: {{fontFamily}}, system-ui, sans-serif; color: {{textColor}}; background: {{backgroundColor}}; }
    .page { max-width: 820px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid {{primaryColor}}; margin-bottom: 28px; }
    .header-left h1 { font-size: 30px; font-weight: 800; color: {{primaryColor}}; font-family: monospace; }
    .header-left h1 span { color: {{secondaryColor}}; }
    .header-left .title { color: #64748b; font-size: 16px; margin-top: 4px; }
    .header-right { text-align: right; font-size: 13px; color: #64748b; line-height: 1.8; }
    .header-right a { color: {{secondaryColor}}; text-decoration: none; }
    .section { margin-bottom: 28px; }
    .section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
    .section-head .icon { font-family: monospace; color: {{secondaryColor}}; font-size: 14px; }
    .section-head h2 { font-size: 16px; font-weight: 700; color: {{primaryColor}}; }
    .exp-item { margin-bottom: 18px; padding: 16px; background: {{primaryColor}}05; border-radius: 8px; border: 1px solid {{primaryColor}}10; }
    .exp-item .top { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .exp-item h3 { font-size: 15px; font-weight: 600; color: {{primaryColor}}; }
    .exp-item .company { color: {{secondaryColor}}; font-size: 14px; }
    .exp-item .date { font-size: 12px; color: #94a3b8; font-family: monospace; }
    .exp-item p { font-size: 14px; line-height: 1.6; }
    .exp-item ul { padding-left: 18px; margin-top: 6px; font-size: 13px; }
    .exp-item li { margin-bottom: 4px; }
    .tech-stack { display: flex; flex-wrap: wrap; gap: 6px; }
    .tech { background: {{secondaryColor}}15; color: {{secondaryColor}}; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-family: monospace; border: 1px solid {{secondaryColor}}25; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <h1><span>&lt;</span>{{fullName}}<span>/&gt;</span></h1>
        <div class="title">{{headline}}</div>
      </div>
      <div class="header-right">
        {{#if email}}<div>{{email}}</div>{{/if}}
        {{#if phone}}<div>{{phone}}</div>{{/if}}
        {{#if github}}<div><a href="{{github}}">GitHub</a></div>{{/if}}
        {{#if linkedin}}<div><a href="{{linkedin}}">LinkedIn</a></div>{{/if}}
        {{#if location}}<div>{{location}}</div>{{/if}}
      </div>
    </div>
    {{#if summary}}<div class="section"><div class="section-head"><span class="icon">//</span><h2>README.md</h2></div><p style="font-size:14px;line-height:1.7">{{summary}}</p></div>{{/if}}
    {{#each sections}}
    <div class="section">
      <div class="section-head"><span class="icon">$</span><h2>{{this.title}}</h2></div>
      {{#each this.content.items}}
      <div class="exp-item">
        <div class="top"><div><h3>{{this.title}}{{this.degree}}</h3><div class="company">{{this.company}}{{this.institution}}</div></div><div class="date">{{this.startDate}} → {{this.endDate}}</div></div>
        {{#if this.description}}<p>{{this.description}}</p>{{/if}}
        {{#if this.highlights}}<ul>{{#each this.highlights}}<li>{{this}}</li>{{/each}}</ul>{{/if}}
      </div>
      {{/each}}
      {{#if this.content.categories}}<div class="tech-stack">{{#each this.content.categories}}{{#each this.skills}}<span class="tech">{{this}}</span>{{/each}}{{/each}}</div>{{/if}}
    </div>
    {{/each}}
  </div>
</body>
</html>`;
  }

  private getExecutiveTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: {{fontFamily}}, Georgia, serif; color: {{textColor}}; background: {{backgroundColor}}; }
    .page { max-width: 800px; margin: 0 auto; padding: 56px 48px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { font-size: 36px; font-weight: 400; letter-spacing: 4px; text-transform: uppercase; color: {{primaryColor}}; }
    .header .divider { width: 60px; height: 2px; background: {{secondaryColor}}; margin: 16px auto; }
    .header .title { font-size: 16px; color: {{secondaryColor}}; letter-spacing: 2px; text-transform: uppercase; }
    .header .contact { margin-top: 16px; font-size: 13px; color: #64748b; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .section { margin-bottom: 36px; }
    .section h2 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; color: {{secondaryColor}}; border-bottom: 1px solid {{secondaryColor}}40; padding-bottom: 8px; margin-bottom: 20px; }
    .exec-item { margin-bottom: 20px; }
    .exec-item .row { display: flex; justify-content: space-between; align-items: baseline; }
    .exec-item h3 { font-size: 16px; font-weight: 600; color: {{primaryColor}}; }
    .exec-item .org { font-style: italic; color: #64748b; font-size: 15px; }
    .exec-item .date { font-size: 13px; color: #94a3b8; }
    .exec-item p { font-size: 14px; line-height: 1.7; margin-top: 8px; }
    .exec-item ul { margin-top: 8px; padding-left: 20px; font-size: 14px; line-height: 1.7; }
    .competencies { display: flex; flex-wrap: wrap; gap: 12px; }
    .competency { border: 1px solid {{secondaryColor}}40; padding: 6px 16px; font-size: 13px; color: {{primaryColor}}; letter-spacing: 0.5px; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>{{fullName}}</h1>
      <div class="divider"></div>
      <div class="title">{{headline}}</div>
      <div class="contact">
        {{#if email}}<span>{{email}}</span>{{/if}}
        {{#if phone}}<span>{{phone}}</span>{{/if}}
        {{#if location}}<span>{{location}}</span>{{/if}}
      </div>
    </div>
    {{#if summary}}<div class="section"><h2>Executive Summary</h2><p style="font-size:14px;line-height:1.8">{{summary}}</p></div>{{/if}}
    {{#each sections}}
    <div class="section">
      <h2>{{this.title}}</h2>
      {{#each this.content.items}}
      <div class="exec-item">
        <div class="row"><div><h3>{{this.title}}{{this.degree}}</h3><div class="org">{{this.company}}{{this.institution}}</div></div><div class="date">{{this.startDate}} – {{this.endDate}}</div></div>
        {{#if this.description}}<p>{{this.description}}</p>{{/if}}
        {{#if this.highlights}}<ul>{{#each this.highlights}}<li>{{this}}</li>{{/each}}</ul>{{/if}}
      </div>
      {{/each}}
      {{#if this.content.categories}}<div class="competencies">{{#each this.content.categories}}{{#each this.skills}}<span class="competency">{{this}}</span>{{/each}}{{/each}}</div>{{/if}}
    </div>
    {{/each}}
  </div>
</body>
</html>`;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
