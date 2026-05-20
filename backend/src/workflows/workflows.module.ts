import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkflowsController } from './workflows.controller';

@Module({
  imports: [ConfigModule],
  controllers: [WorkflowsController],
})
export class WorkflowsModule {}
