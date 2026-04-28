# NestJS Backend Design Principles

This document outlines the core design and development principles for our NestJS backend API. Following these guidelines ensures consistency, security, scalability, and maintainability across the backend services.

## 1. Module Architecture

Our backend follows NestJS's modular architecture pattern for better code organization and maintainability.

### Module Structure:
```
/src
├── app.module.ts           # Root module
├── main.ts                 # Application bootstrap
├── config/                 # Configuration management
│   ├── configuration.ts    # Config object structure
│   └── validation.ts       # Environment validation
├── common/                 # Shared resources
│   ├── decorators/         # Custom decorators
│   ├── dto/                # Common DTOs
│   ├── exceptions/         # Custom exceptions
│   ├── guards/             # Auth and role guards
│   ├── interceptors/       # Request/response interceptors
│   └── utils/              # Utility functions
├── modules/                # Feature modules
│   ├── auth/               # Authentication module
│   ├── resume/             # Resume management
│   ├── job/                # Job management
│   ├── ai/                 # AI integration
│   └── documents/          # Document processing
└── schemas/                # MongoDB schemas
```

### Module Best Practices:
- Keep modules focused on a single domain/feature
- Use module boundaries to enforce separation of concerns
- Export only what needs to be shared with other modules
- Create dedicated DTOs for each module
- Implement module-specific services and controllers
- Use `@Global()` decorator sparingly - only for true cross-cutting concerns

## 2. Constants and Utilities

Proper use of constants and utilities reduces code duplication and improves maintainability.

### Constants Management:
- **Module Constants**: Create `[module].constants.ts` files for module-specific constants
- **Object Keys**: Define all object keys as constants to avoid magic strings
- **Enum Usage**: Use TypeScript enums for fixed sets of values
- **Configuration Constants**: Store configuration values in constants files

### Constants Best Practices:
```typescript
// job.constants.ts
export const JOB_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['.pdf', '.docx'] as const;
```

### Utility Functions:
- **Common Utils**: Place in `/src/common/utils/` for cross-module utilities
- **Module Utils**: Create module-specific utils in `[module]/utils/`
- **Pure Functions**: Keep utility functions pure and testable
- **Type Safety**: Always provide proper TypeScript types

### Utils Best Practices:
```typescript
// common/utils/string.utils.ts
export const sanitizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
```

## 3. Dependency Injection & Providers

NestJS's DI container is the backbone of the application architecture.

### Service Layer Patterns:
- **Single Responsibility**: Each service should have one clear purpose
- **Stateless Services**: Services must be stateless and thread-safe
- **Dependency Injection**: Always use constructor injection
- **Interface Segregation**: Create specific interfaces for service contracts
- **Repository Pattern**: Separate data access logic from business logic

### Provider Best Practices:
```typescript
// Good: Clear dependencies, single responsibility
@Injectable()
export class ResumeService {
  constructor(
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    private readonly aiService: AiService,
    private readonly parserService: ParserService,
  ) {}
}

// Bad: Too many responsibilities
@Injectable()
export class SuperService {
  // Handles everything - avoid this!
}
```

## 4. Data Validation & DTOs

Robust validation is crucial for API security and reliability.

### DTO Guidelines:
- Use `class-validator` decorators for all input validation
- Create separate DTOs for Create, Update, and Response operations
- Implement custom validators for complex business rules
- Use `class-transformer` for data transformation
- Enable `whitelist` and `forbidNonWhitelisted` in ValidationPipe

### Validation Best Practices:
```typescript
// Create DTO with comprehensive validation
export class CreateResumeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience: ExperienceDto[];
}

// Update DTO with partial fields
export class UpdateResumeDto extends PartialType(CreateResumeDto) {}
```

## 5. Error Handling & Exceptions

Consistent error handling improves debugging and user experience.

### Exception Handling:
- Use NestJS built-in exceptions (`BadRequestException`, `NotFoundException`, etc.)
- Create custom exceptions for domain-specific errors
- Implement global exception filters for consistent error responses
- Log errors with appropriate severity levels
- Never expose sensitive information in error messages

### Error Response Format:
```typescript
{
  statusCode: 400,
  message: "Validation failed",
  error: "Bad Request",
  details: [...] // Optional validation details
}
```

## 6. Database & MongoDB Integration

Efficient database operations are critical for performance.

### Mongoose Best Practices:
- Define indexes on frequently queried fields
- Use lean queries (`.lean()`) when documents won't be modified
- Implement pagination for list endpoints
- Use MongoDB transactions for atomic operations
- Avoid N+1 queries with proper population strategies
- Implement soft deletes when data retention is required

### Schema Design:
```typescript
@Schema({ timestamps: true, collection: 'resumes' })
export class Resume {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: Object })
  content: Record<string, any>;

  @Prop({ default: false })
  isDeleted: boolean;
}
```

## 7. Authentication & Security

Security must be built into every layer of the application.

### Authentication:
- Use JWT tokens with appropriate expiration times
- Implement refresh token rotation for enhanced security
- Store sensitive data in environment variables
- Use bcrypt with appropriate salt rounds for password hashing
- Implement rate limiting on authentication endpoints

### Security Best Practices:
- Enable CORS with specific origins
- Use Helmet.js for security headers
- Validate and sanitize all user inputs
- Implement request rate limiting
- Use HTTPS in production
- Never log sensitive information (passwords, tokens, API keys)
- Implement proper session management

## 8. API Design & Controllers

Well-designed APIs are intuitive and maintainable.

### RESTful Conventions:
```typescript
@Controller('resumes')
export class ResumeController {
  @Get()           // GET /resumes
  @Get(':id')      // GET /resumes/:id
  @Post()          // POST /resumes
  @Put(':id')      // PUT /resumes/:id
  @Patch(':id')    // PATCH /resumes/:id
  @Delete(':id')   // DELETE /resumes/:id
}
```

### Controller Best Practices:
- Keep controllers thin - delegate business logic to services
- Use proper HTTP status codes
- Implement pagination, filtering, and sorting for list endpoints
- Use DTOs for request/response validation
- Document endpoints with Swagger decorators
- Handle file uploads with proper validation and size limits

## 9. Configuration Management

Centralized configuration ensures consistency across environments.

### Configuration Best Practices:
- Use `@nestjs/config` for environment management
- Validate environment variables at startup
- Group related configurations
- Never commit secrets to version control
- Use different .env files for different environments
- Implement configuration schemas with Joi validation

### Configuration Structure:
```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  ai: {
    googleKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
});
```

## 10. Performance Optimization

Optimize for scalability and response times.

### Performance Guidelines:
- Use database connection pooling
- Optimize database queries with proper indexing
- Implement pagination for large datasets
- Use BullMQ for scheduled tasks and background jobs
- Monitor memory usage and prevent leaks
- Implement request/response compression
- Use streaming for large file operations
- Use `.lean()` queries when documents won't be modified
- Avoid N+1 queries with proper population strategies

## 11. AI Prompts Management

All AI-related prompts must be organized and maintained consistently.

### Prompt Organization:
- **Location**: All prompts MUST live under `/src/modules/ai/prompts/`
- **File Structure**: Each prompt file should export both system and user prompts
- **Naming Convention**: Use descriptive names: `[feature]-[action].prompt.ts`

### Prompt Best Practices:
```typescript
// resume-optimization.prompt.ts
export const getSystemPrompt = () => `
You are an expert resume optimizer.
Always respond in valid JSON format.
`;

export const getUserPrompt = ({
  resumeContent,
  jobDescription,
  keywords,
}: {
  resumeContent: string;
  jobDescription: string;
  keywords: string[];
}) => `
Optimize this resume for the following job:

Resume:
{{resumeContent}}

Job Description:
{{jobDescription}}

Target Keywords:
{{keywords}}

Provide optimization suggestions.
`;
```

### Template Variables:
- Use `{{variableName}}` syntax for template variables
- Pass all dynamic content as function parameters
- Never hardcode values that might change

### JSON Response Prompts:
- Be explicit about expected JSON structure
- Include example responses in system prompts
- Validate response format in the service layer

### Prompt Guidelines:
```typescript
// For JSON responses, be explicit:
export const getSystemPrompt = () => `
Respond with a JSON object in this exact format:
{
  "score": number (0-100),
  "suggestions": string[],
  "keywords": {
    "found": string[],
    "missing": string[]
  }
}
`;
```

### Agentic Flow Pattern:
All prompts must follow a consistent agentic flow to ensure reliable and predictable AI responses:

```typescript
// Standard agentic flow structure
export const getSystemPrompt = () => `
You are an expert [role/persona].

Your task is to [specific objective].

Follow these steps:
1. Analyze the input data
2. Apply your expertise
3. Generate structured output

Constraints:
- [Constraint 1]
- [Constraint 2]

Output format:
[Specify exact format]
`;

export const getUserPrompt = (params: InputParams) => `
Context:
{{context}}

Task:
{{task}}

Input Data:
{{data}}

Requirements:
{{requirements}}

Please proceed with the analysis.
`;
```

### Agentic Flow Best Practices:
- **Define Clear Role**: Start system prompt with expert persona
- **Specify Objective**: Clearly state what the AI should accomplish
- **Step-by-Step Process**: Break down complex tasks into steps
- **Set Constraints**: Define boundaries and limitations
- **Consistent Structure**: Use the same flow pattern across all prompts
- **Chain of Thought**: Encourage reasoning before conclusion
- **Validation Steps**: Include self-check instructions where needed

### Example Implementation:
```typescript
// resume-optimization.prompt.ts
export const getSystemPrompt = () => `
You are an expert ATS (Applicant Tracking System) specialist and professional resume writer.

Your task is to optimize resumes to pass ATS filters while maintaining authenticity.

Follow these steps:
1. Parse the resume content and job description
2. Identify matching and missing keywords
3. Analyze the alignment between resume and job requirements
4. Generate optimization suggestions
5. Validate suggestions maintain truthfulness

Constraints:
- Never fabricate experience or skills
- Maintain professional tone
- Preserve original achievements and metrics
- Focus on keyword integration without stuffing

Output format:
Return a JSON object with score, suggestions, and keyword analysis.
`;
```

## 12. Documentation

Good documentation reduces onboarding time and improves maintainability.

### Documentation Requirements:
- Use Swagger/OpenAPI for API documentation
- Document complex business logic with comments
- Maintain up-to-date README files
- Document environment variables
- Create API usage examples
- Document deployment procedures

### Code Documentation:
```typescript
/**
 * Optimizes a resume for a specific job posting
 * @param resumeId - The ID of the resume to optimize
 * @param jobId - The ID of the target job
 * @returns Optimized resume with ATS score
 * @throws NotFoundException if resume or job not found
 */
async optimizeResume(resumeId: string, jobId: string): Promise<OptimizedResume> {
  // Implementation
}
```

## 13. Development Workflow

Consistent development practices improve team productivity.

### Git Workflow:
- Use feature branches for new development
- Follow conventional commit messages
- Require PR reviews before merging
- Run tests in CI/CD pipeline
- Use semantic versioning for releases

### Code Quality Checklist:
- [ ] No ESLint warnings
- [ ] Proper error handling
- [ ] Input validation implemented
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Database migrations included (if needed)