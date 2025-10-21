// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete
// } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { AbsenceService } from './absence.service';
// import { CreateAbsenceDto } from './dto/create-absence.dto';
// import { UpdateAbsenceDto } from './dto/update-absence.dto';

// @ApiTags('Absence')
// @Controller('absence')
// export class AbsenceController {
//   constructor(private readonly absenceService: AbsenceService) {}

//   @Post()
//   @ApiOperation({ summary: 'Registrar nueva ausencia' })
//   @ApiResponse({ status: 201, description: 'Ausencia registrada exitosamente' })
//   create(@Body() createAbsenceDto: CreateAbsenceDto) {
//     return this.absenceService.create(createAbsenceDto);
//   }

//   @Get()
//   @ApiOperation({ summary: 'Obtener todas las ausencias' })
//   findAll() {
//     return this.absenceService.findAll();
//   }

//   @Get('employee/:employeeId')
//   @ApiOperation({ summary: 'Obtener ausencias de un empleado específico' })
//   findByEmployee(@Param('employeeId') employeeId: string) {
//     return this.absenceService.findByEmployee(employeeId);
//   }

//   @Get(':id')
//   @ApiOperation({ summary: 'Obtener una ausencia por ID' })
//   findOne(@Param('id') id: string) {
//     return this.absenceService.findOne(id);
//   }

//   @Patch(':id')
//   @ApiOperation({ summary: 'Actualizar una ausencia' })
//   update(@Param('id') id: string, @Body() updateAbsenceDto: UpdateAbsenceDto) {
//     return this.absenceService.update(id, updateAbsenceDto);
//   }

//   @Delete(':id')
//   @ApiOperation({ summary: 'Eliminar una ausencia' })
//   remove(@Param('id') id: string) {
//     return this.absenceService.remove(id);
//   }
// }

//multiempresa (guard clerk)
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AbsenceService } from './absence.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
import { AuthUser } from 'src/decoradores/auth-user.decoratos';
import type { AuthenticatedUser } from 'src/interfaces/authenticated-user.interface';

@UseGuards(ClerkAuthGuard)
@ApiTags('Absence')
@Controller('absence')
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar nueva ausencia' })
  @ApiResponse({ status: 201, description: 'Ausencia registrada exitosamente' })
  create(@Body() dto: CreateAbsenceDto, @AuthUser() user: AuthenticatedUser) {
    return this.absenceService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las ausencias' })
  findAll(@AuthUser() user: AuthenticatedUser) {
    return this.absenceService.findAll(user);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Obtener ausencias de un empleado específico' })
  findByEmployee(
    @Param('employeeId') employeeId: string,
    @AuthUser() user: AuthenticatedUser
  ) {
    return this.absenceService.findByEmployee(employeeId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una ausencia por ID' })
  findOne(@Param('id') id: string, @AuthUser() user: AuthenticatedUser) {
    return this.absenceService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una ausencia' })
  update(
    @Param('id') id: string,
    @Body() updateAbsenceDto: UpdateAbsenceDto,
    @AuthUser() user: AuthenticatedUser
  ) {
    return this.absenceService.update(id, updateAbsenceDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una ausencia' })
  remove(@Param('id') id: string, @AuthUser() user: AuthenticatedUser) {
    return this.absenceService.remove(id, user);
  }

  //get de ranking de ausencias
  @Get('ausencias/ranking')
  async getAusenciasRanking(
    @AuthUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.absenceService.getAusenciasRanking(
      user,
      startDate,
      endDate,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );
  }
}
