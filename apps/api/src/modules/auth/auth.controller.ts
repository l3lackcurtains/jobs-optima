import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    const user = await this.authService.getUserProfile(req.user.userId);
    return {
      user: {
        id: req.user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('ai-settings')
  async getAiSettings(@Request() req: AuthenticatedRequest) {
    return this.authService.getAiSettings(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('ai-settings')
  async updateAiSettings(
    @Request() req: AuthenticatedRequest,
    @Body() body: { aiProvider?: string; aiApiKey?: string; aiModel?: string },
  ) {
    return this.authService.updateAiSettings(req.user.userId, body);
  }
}
