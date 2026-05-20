import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmsModule } from './farms/farms.module';
import { PlotsModule } from './plots/plots.module';
import { CropsModule } from './crops/crops.module';
import { SensorsModule } from './sensors/sensors.module';
import { IrrigationModule } from './irrigation/irrigation.module';
import { PredictionsModule } from './predictions/predictions.module';
import { ReportsModule } from './reports/reports.module';
import { AlertsModule } from './alerts/alerts.module';
import { ClimateModule } from './climate/climate.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FarmsModule,
    PlotsModule,
    CropsModule,
    SensorsModule,
    IrrigationModule,
    PredictionsModule,
    ReportsModule,
    AlertsModule,
    ClimateModule,
    DashboardModule,
    WorkflowsModule,
  ],
})
export class AppModule {}
