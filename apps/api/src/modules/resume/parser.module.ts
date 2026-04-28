import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { AiModule } from '@modules/ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [ParserService],
  exports: [ParserService],
})
export class ParserModule {}
