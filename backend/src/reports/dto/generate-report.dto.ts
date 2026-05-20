import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GenerateReportDto {
  @IsEnum(['OPERACIONAL', 'GESTION', 'PREDICCION', 'RIEGO'])
  tipo: string;

  @IsString()
  @IsOptional()
  lote_id?: string;

  @IsString()
  @IsOptional()
  finca_id?: string;

  @IsString()
  @IsOptional()
  fecha_inicio?: string;

  @IsString()
  @IsOptional()
  fecha_fin?: string;
}
