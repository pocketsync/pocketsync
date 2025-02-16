import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class EmailTemplateService {
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private layout: Handlebars.TemplateDelegate;

  constructor(private configService: ConfigService) {
    this.initializeTemplates();
  }

  private getTemplatesPath(): string {
    // In production, the code runs from the dist directory
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const basePath = isDevelopment ? 'src' : 'dist/src';
    
    return path.join(process.cwd(), basePath, 'modules/email/templates');
  }

  private async initializeTemplates() {
    const templatesDir = this.getTemplatesPath();
    
    // Load and compile layout
    const layoutContent = await fs.readFile(
      path.join(templatesDir, 'layout.hbs'),
      'utf-8'
    );
    this.layout = Handlebars.compile(layoutContent);

    // Load and compile all template files
    const templateFiles = await fs.readdir(templatesDir);
    for (const file of templateFiles) {
      if (file !== 'layout.hbs' && file.endsWith('.hbs')) {
        const templateName = path.basename(file, '.hbs');
        const templateContent = await fs.readFile(
          path.join(templatesDir, file),
          'utf-8'
        );
        this.templates.set(templateName, Handlebars.compile(templateContent));
      }
    }
  }

  async render(templateName: string, context: any = {}): Promise<string> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    // Add global context variables
    const enrichedContext = {
      ...context,
      year: new Date().getFullYear(),
    };

    // Render template content
    const content = template(enrichedContext);

    // Render layout with content
    return this.layout({
      ...enrichedContext,
      body: content,
    });
  }
}