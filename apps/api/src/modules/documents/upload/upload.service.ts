import { Injectable, BadRequestException } from '@nestjs/common';
import { ParserService } from '@modules/resume/parser.service';
import { ResumeManagerService } from '@modules/resume/resume-manager.service';

@Injectable()
export class UploadService {
  constructor(
    private parserService: ParserService,
    private resumeManagerService: ResumeManagerService,
  ) {}

  async processResumeUpload(
    userId: string,
    file: Express.Multer.File,
    title?: string,
    category?: string,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Please upload PDF, DOCX, or TXT files.',
      );
    }

    // Parse the resume file — let errors propagate with their original messages
    const extractedData = await this.parserService.parseResume(
      file.buffer,
      file.mimetype,
      userId,
    );

    const resumeTitle = title || `Resume - ${new Date().toLocaleDateString()}`;

    const resume = await this.resumeManagerService.createBase(userId, {
      ...extractedData,
      title: resumeTitle,
      category: category || 'General',
      source: 'upload',
    });

    return {
      success: true,
      resume: resume.toObject(),
    };
  }
}
