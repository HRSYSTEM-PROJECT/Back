import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { PlanService } from './plan/plan.service';
import { RolService } from './rol/rol.service';
import { DepartamentoService } from './departamento/departamento.service';
import { PositionService } from './position/position.service';

//-------------------------------------------------//
@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    private readonly planService: PlanService,
    private readonly rolService: RolService,
    private readonly departmentService: DepartamentoService,
    private readonly positionService: PositionService
  ) {}

  //-------Precarga de Planes y Roles-------//
  async onApplicationBootstrap() {
    console.log('Realizando precarga de datos...');

    try {
      // Llamada a plan/seeder
      console.log(`Precargando planes...`);
      await this.planService.seeder();
      console.log(`Planes precargados exitosamente`);

      // Llamada a rol/seeder
      console.log(`Precargando roles...`);
      await this.rolService.seeder();
      console.log(`Roles precargados exitosamente`);

      // Llamada a departamento/seeder
  //     console.log(`Precargando departamentos...`);
  //     await this.departmentService.seeder();
  //     console.log(`Departamentos precargados exitosamente`);

  //     // Llamada a position/seeder
  //     console.log(`Precargando posiciones de empleados...`);
  //     await this.positionService.seeder();
  //     console.log(`Posiciones de empleados precargados exitosamente`);
     } catch (error) {
       console.error(
         'Una de las llamadas falló. La siguiente llamada no se ejecutó si la anterior falló.',
         error
       );
     }
   
    }
  //-------------Mensaje de Bienvenida-------------//

  getHello(): string {
    return 'BIENVENIDOS A HR SYSTEM';
  }
}

