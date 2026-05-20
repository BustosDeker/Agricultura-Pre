import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService],
  exports: [ReportsService],
})
export class ReportsModule {}
