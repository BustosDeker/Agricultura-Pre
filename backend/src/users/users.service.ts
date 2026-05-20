import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['ADMIN', 'GESTOR', 'OPERADOR'])
  @IsOptional()
  rol?: 'ADMIN' | 'GESTOR' | 'OPERADOR';
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsOptional()
  activo?: boolean;

  @IsEnum(['ADMIN', 'GESTOR', 'OPERADOR'])
  @IsOptional()
  rol?: 'ADMIN' | 'GESTOR' | 'OPERADOR';
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, rol: true, activo: true, created_at: true },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, created_at: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException('El email ya está registrado');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.usuario.create({
      data: { ...dto, password: hashed },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, created_at: true },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.usuario.update({
      where: { id },
      data: dto,
      select: { id: true, nombre: true, email: true, rol: true, activo: true, updated_at: true },
    });
  }
}
