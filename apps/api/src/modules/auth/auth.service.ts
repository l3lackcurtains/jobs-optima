import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '@schemas/user.schema';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import {
  AIProvider,
  ALLOWED_MODELS,
  isValidModel,
  isValidProvider,
} from '@modules/ai/ai.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signUp(
    signUpDto: SignUpDto,
  ): Promise<{ accessToken: string; user: any }> {
    const { email, password, firstName, lastName } = signUpDto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const accessToken = this.generateToken(String(user._id));

    return {
      accessToken,
      user: {
        id: String(user._id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(String(user._id));

    return {
      accessToken,
      user: {
        id: String(user._id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async getUserProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async getAiSettings(
    userId: string,
  ): Promise<{ aiProvider: string | null; aiApiKey: string | null; aiModel: string | null }> {
    const user = await this.userModel
      .findById(userId)
      .select('aiProvider aiApiKey aiModel')
      .lean()
      .exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      aiProvider: user.aiProvider ?? null,
      aiApiKey: user.aiApiKey ?? null,
      aiModel: user.aiModel ?? null,
    };
  }

  async updateAiSettings(
    userId: string,
    dto: { aiProvider?: string; aiApiKey?: string; aiModel?: string },
  ): Promise<{ aiProvider: string | null; aiApiKey: string | null; aiModel: string | null }> {
    // Validate provider/model so bad values can't reach the AI SDK later.
    // Empty strings are treated as "clear" — they reset the field to null.
    if (dto.aiProvider && !isValidProvider(dto.aiProvider)) {
      throw new BadRequestException({
        code: 'INVALID_AI_PROVIDER',
        message: `Unsupported AI provider "${dto.aiProvider}". Choose one of: ${Object.values(AIProvider).join(', ')}.`,
      });
    }

    if (dto.aiModel) {
      // Determine the provider this model belongs to: prefer the one in the
      // request, fall back to the user's saved provider.
      let providerForModel: AIProvider | undefined;
      if (dto.aiProvider && isValidProvider(dto.aiProvider)) {
        providerForModel = dto.aiProvider;
      } else {
        const existing = await this.userModel
          .findById(userId)
          .select('aiProvider')
          .lean()
          .exec();
        if (existing?.aiProvider && isValidProvider(existing.aiProvider)) {
          providerForModel = existing.aiProvider;
        }
      }
      if (!providerForModel) {
        throw new BadRequestException({
          code: 'PROVIDER_REQUIRED',
          message:
            'Pick a provider before selecting a model.',
        });
      }
      if (!isValidModel(providerForModel, dto.aiModel)) {
        throw new BadRequestException({
          code: 'INVALID_AI_MODEL',
          message: `Model "${dto.aiModel}" is not supported for ${providerForModel}.`,
          allowedModels: ALLOWED_MODELS[providerForModel],
        });
      }
    }

    const update: Record<string, string | null> = {};

    if (dto.aiProvider !== undefined) update.aiProvider = dto.aiProvider || null;
    if (dto.aiApiKey !== undefined) update.aiApiKey = dto.aiApiKey || null;
    if (dto.aiModel !== undefined) update.aiModel = dto.aiModel || null;

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('aiProvider aiApiKey aiModel')
      .lean()
      .exec();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      aiProvider: user.aiProvider ?? null,
      aiApiKey: user.aiApiKey ?? null,
      aiModel: user.aiModel ?? null,
    };
  }

  private generateToken(userId: string): string {
    const payload = { sub: userId };
    return this.jwtService.sign(payload);
  }
}
