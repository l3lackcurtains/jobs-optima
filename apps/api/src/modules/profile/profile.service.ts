import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from '@schemas/profile.schema';
import { Resume, ResumeDocument } from '@schemas/resume.schema';
import { UpdateProfileSchemaDto } from './dto/update-profile-schema.dto';
import { FindProfilesDto } from './dto/find-profiles.dto';
import { CreateProfileFromResumeDto } from './dto/create-profile-from-resume.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
  ) {}


  async createFromResume(
    userId: string,
    createProfileFromResumeDto: CreateProfileFromResumeDto,
  ): Promise<Profile> {
    const { profileName, resumeId } = createProfileFromResumeDto;

    // Fetch the resume
    const resume = await this.resumeModel
      .findOne({
        _id: new Types.ObjectId(resumeId),
        userId: new Types.ObjectId(userId),
        isOptimized: false, // Only allow base resumes
      })
      .exec();

    if (!resume) {
      throw new NotFoundException('Base resume not found');
    }

    // Extract profile data from resume with proper structure
    const profileData: any = {
      profileName,
      // Required contactInfo object
      contactInfo: {
        name: resume.contactInfo?.name || 'Unknown',
        location: resume.contactInfo?.location || 'Unknown',
        email: resume.contactInfo?.email || 'unknown@example.com',
        phone: resume.contactInfo?.phone || '000-000-0000', // Provide default phone if missing
        linkedin: resume.contactInfo?.linkedin,
        github: resume.contactInfo?.github,
        personalWebsite: resume.contactInfo?.personalWebsite,
        // Parse location into detailed fields if possible
        city: resume.contactInfo?.location?.split(',')[0]?.trim() || '',
        state: resume.contactInfo?.location?.split(',')[1]?.trim() || '',
        country: 'United States',
      },
      // Required skills object
      skills: {
        technicalSkills: resume.skills?.technicalSkills || [],
        developmentPracticesMethodologies: resume.skills?.developmentPracticesMethodologies || [],
        personalSkills: resume.skills?.personalSkills || [],
        softSkills: resume.skills?.personalSkills || [], // Map personal skills to soft skills
      },
      category: resume.category || 'General',
      workAuthorization: 'Authorized',
      linkedResumeId: new Types.ObjectId(resumeId),
      lastImportedFromResume: new Date(),
    };

    // Map work experience with proper structure - filter out invalid entries
    if (resume.experience?.length) {
      profileData.experience = resume.experience
        .filter((exp) => exp.company && exp.title && exp.dates) // Only include entries with required fields
        .map((exp) => ({
          company: exp.company,
          title: exp.title,
          location: exp.location || 'Not specified',
          dates: exp.dates,
          responsibilities: exp.responsibilities || [],
        }));
    } else {
      profileData.experience = [];
    }

    // Map education with proper structure - filter out invalid entries
    if (resume.education?.length) {
      profileData.education = resume.education
        .filter((edu) => edu.institution && edu.dates) // Only include entries with required fields
        .map((edu) => ({
          institution: edu.institution,
          degree: edu.degree || 'Not specified',
          location: edu.location || 'Not specified',
          dates: edu.dates,
          achievements: edu.achievements || [],
        }));
    } else {
      profileData.education = [];
    }

    // Map projects if available - filter out invalid entries
    if (resume.projects?.length) {
      profileData.projects = resume.projects
        .filter((proj) => proj.name && proj.technologies && proj.description) // Only include entries with required fields
        .map((proj) => ({
          name: proj.name,
          technologies: proj.technologies,
          description: proj.description,
          // url and role are optional fields in Profile but don't exist in Resume
          url: undefined,
          role: undefined,
        }));
    } else {
      profileData.projects = [];
    }

    // Note: Resume doesn't have summary or objective fields
    // These can be added to the profile later through profile editing

    // Create the profile with proper structure
    const profile = new this.profileModel({
      ...profileData,
      userId: new Types.ObjectId(userId),
    });

    return profile.save();
  }

  async findAll(
    userId: string,
    findProfilesDto: FindProfilesDto,
  ): Promise<{
    data: Profile[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const { page = 1, limit = 10, isActive, isDefault, search } = findProfilesDto;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId: new Types.ObjectId(userId) };

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (isDefault !== undefined) {
      query.isDefault = isDefault;
    }

    if (search) {
      query.$or = [
        { profileName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const [profiles, total] = await Promise.all([
      this.profileModel
        .find(query)
        .sort({ isDefault: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-contactInfo._id -experience._id -projects._id -education._id -skills._id')
        .lean()
        .exec(),
      this.profileModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Profile> {
    const profile = await this.profileModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .select('-contactInfo._id -experience._id -projects._id -education._id -skills._id')
      .lean()
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async update(
    id: string,
    userId: string,
    updateProfileDto: UpdateProfileSchemaDto,
  ): Promise<Profile> {
    // Check if this is being set as default
    if (updateProfileDto.isDefault) {
      // Unset any existing default profile (except the current one)
      await this.profileModel.updateMany(
        {
          userId: new Types.ObjectId(userId),
          isDefault: true,
          _id: { $ne: new Types.ObjectId(id) },
        },
        { isDefault: false },
      );
    }

    // Get the existing profile first
    const existingProfile = await this.profileModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!existingProfile) {
      throw new NotFoundException('Profile not found');
    }

    // Clean up the update data - filter out incomplete nested objects
    const cleanedUpdateDto: any = { ...updateProfileDto };

    // Handle contactInfo updates - merge with existing data
    if (cleanedUpdateDto.contactInfo) {
      // Ensure we don't lose required fields
      cleanedUpdateDto.contactInfo = {
        ...existingProfile.contactInfo,
        ...cleanedUpdateDto.contactInfo,
      };
      
      // Validate required fields are present
      if (!cleanedUpdateDto.contactInfo.name) {
        cleanedUpdateDto.contactInfo.name = existingProfile.contactInfo?.name || 'Unknown';
      }
      if (!cleanedUpdateDto.contactInfo.email) {
        cleanedUpdateDto.contactInfo.email = existingProfile.contactInfo?.email || 'unknown@example.com';
      }
      if (!cleanedUpdateDto.contactInfo.phone) {
        cleanedUpdateDto.contactInfo.phone = existingProfile.contactInfo?.phone || '000-000-0000';
      }
      if (!cleanedUpdateDto.contactInfo.location) {
        cleanedUpdateDto.contactInfo.location = existingProfile.contactInfo?.location || 'Unknown';
      }
    }

    // Handle skills updates - merge with existing data
    if (cleanedUpdateDto.skills) {
      cleanedUpdateDto.skills = {
        technicalSkills: cleanedUpdateDto.skills.technicalSkills || existingProfile.skills?.technicalSkills || [],
        developmentPracticesMethodologies: cleanedUpdateDto.skills.developmentPracticesMethodologies || existingProfile.skills?.developmentPracticesMethodologies || [],
        personalSkills: cleanedUpdateDto.skills.personalSkills || existingProfile.skills?.personalSkills || [],
        softSkills: cleanedUpdateDto.skills.softSkills || existingProfile.skills?.softSkills || [],
      };
    }

    // Filter experience array - only keep items with all required fields
    if (cleanedUpdateDto.experience) {
      cleanedUpdateDto.experience = cleanedUpdateDto.experience
        .map((exp: any) => ({
          title: exp.title || '',
          company: exp.company || '',
          location: exp.location || 'Not specified',
          dates: exp.dates || '',
          responsibilities: exp.responsibilities || [],
        }))
        .filter((exp: any) => exp.title && exp.company && exp.dates);
    }

    // Filter education array - only keep items with all required fields
    if (cleanedUpdateDto.education) {
      cleanedUpdateDto.education = cleanedUpdateDto.education
        .map((edu: any) => ({
          institution: edu.institution || '',
          degree: edu.degree || 'Not specified',
          location: edu.location || 'Not specified',
          dates: edu.dates || '',
          achievements: edu.achievements || [],
        }))
        .filter((edu: any) => edu.institution && edu.dates);
    }

    // Filter projects array - only keep items with all required fields
    if (cleanedUpdateDto.projects) {
      cleanedUpdateDto.projects = cleanedUpdateDto.projects
        .map((proj: any) => ({
          name: proj.name || '',
          technologies: proj.technologies || '',
          description: proj.description || '',
          url: proj.url,
          role: proj.role,
        }))
        .filter((proj: any) => proj.name && proj.technologies && proj.description);
    }

    const profile = await this.profileModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
        },
        { $set: cleanedUpdateDto },
        { new: true, runValidators: true },
      )
      .select('-contactInfo._id -experience._id -projects._id -education._id -skills._id')
      .lean()
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const profile = await this.profileModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Prevent deletion of default profile if it's the only one
    if (profile.isDefault) {
      const profileCount = await this.profileModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      if (profileCount === 1) {
        throw new BadRequestException('Cannot delete the only active profile');
      }

      // If there are other profiles, set one as default
      const nextProfile = await this.profileModel
        .findOne({
          userId: new Types.ObjectId(userId),
          isActive: true,
          _id: { $ne: new Types.ObjectId(id) },
        })
        .sort({ updatedAt: -1 })
        .exec();

      if (nextProfile) {
        nextProfile.isDefault = true;
        await nextProfile.save();
      }
    }

    await this.profileModel
      .findOneAndDelete({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    return { message: 'Profile deleted successfully' };
  }

  async getDefaultProfile(userId: string): Promise<Profile | null> {
    return this.profileModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isDefault: true,
        isActive: true,
      })
      .exec();
  }

  async setAsDefault(id: string, userId: string): Promise<Profile> {
    // Unset any existing default profile
    await this.profileModel.updateMany(
      { userId: new Types.ObjectId(userId), isDefault: true },
      { isDefault: false },
    );

    const profile = await this.profileModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
        },
        { isDefault: true },
        { new: true },
      )
      .exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async incrementUsageCount(id: string, userId: string): Promise<void> {
    await this.profileModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
        },
        {
          $inc: { usageCount: 1 },
          lastUsedAt: new Date(),
        },
      )
      .exec();
  }
}