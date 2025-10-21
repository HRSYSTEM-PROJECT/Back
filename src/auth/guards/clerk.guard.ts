import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';
import { CLERK_SECRET_KEY } from 'src/config/envs';
import { UserService } from 'src/user/user.service';
import { Role } from 'src/rol/enums/role.enum';

//-------------------------------------------------//
//-------------------------------------------------//
//-------------------------------------------------//
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization; //"Bearer token"

    //Validaciones
    if (!authHeader) return false;

    const bearer: string = authHeader.split(' ')[0]; // "token"
    if (!bearer) return false;
    if (bearer !== 'Bearer') return false;

    const token: string = authHeader.split(' ')[1]; // "token"
    if (!token) return false;

    try {
      //Verificar token de Clerk
      const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });

      //Extraer el Id de Clerk
      const clerkUserId = payload.sub;

      if (!clerkUserId) return false;

      //User DB
      const userDB = await this.userService.findByClerkId(clerkUserId);

      if (!userDB) return false;

      // Determinar el companyId de forma segura
      let finalCompanyId: string;
      const userRole = userDB.role.name; // 'super_admin', 'company_owner', etc.

      // 🛑 Lógica modificada: Si el usuario es Super Admin, o no tiene empresa,
      // asignamos una cadena vacía. En caso contrario, asignamos el ID.
      if (userRole === Role.SUPER_ADMIN || !userDB.company) {
        // Si el Super Admin intenta obtener el ID, obtendrá una cadena vacía.
        // Esto satisface a la interfaz (string) y probablemente fallará en
        // los servicios que esperan un ID real, lo cual es correcto
        // para las rutas de Company Owner.
        finalCompanyId = '';
      } else {
        // Para Company Owner, HR Manager, etc., que tienen empresa
        finalCompanyId = userDB.company.id;
      }

      //Info del token más DB
      request.user = {
        clerkId: clerkUserId,
        id: userDB.id,
        email: userDB.email,
        name: userDB.first_name,
        rol: userDB.role.name,
        companyId: finalCompanyId,
        roles: [userDB.role.name]
      };

      return true;
    } catch (error) {
      console.log('Error en CLerkAuthGuard:', error);
      return false;
    }
  }
}
