import {
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { clerkClient } from '@clerk/express';
import { UpdateClerkUserPayload } from './interfaces/update-clerk-user-payload';

@Injectable()
export class ClerkService {
  //----------Crea un nuevo usuario en CLerk---------//
  async createUser(email: string, password: string, name?: string) {
    try {
      const user = await clerkClient.users.createUser({
        emailAddress: [email],
        password: password,
        firstName: name
      });
      return user;
    } catch (error) {
      console.error('Error al crear usuario en Clerk:', error);

      throw new InternalServerErrorException(
        'Fallo en el registro de autenticación en Clerk.'
      );
    }
  }

  //---------------Actualiza un Usuario de Clerk ya existente---------//
  async updateUser(clerkId: string, payload: UpdateClerkUserPayload) {
    try {
      const updateBody: Record<string, any> = {};

      // Construye el cuerpo de la solicitud solo con los valores presentes
      if (payload.email) {
        // Clerk espera `emailAddress` como array
        updateBody.emailAddress = [payload.email];
      }

      if (payload.password) {
        updateBody.password = payload.password;
      }

      if (payload.name) {
        updateBody.firstName = payload.name;
      }

      // Si no hay nada que actualizar, retornamos el usuario sin hacer la llamada a Clerk.
      if (Object.keys(updateBody).length === 0) {
        console.log(
          `Usuario ${clerkId}: No se proporcionaron datos para actualizar.`
        );
        return await clerkClient.users.getUser(clerkId);
      }

      // Llamada a la API de Clerk con el payload filtrado
      const user = await clerkClient.users.updateUser(clerkId, updateBody);

      return user;
    } catch (error) {
      console.error(`Error al actualizar usuario ${clerkId} en Clerk:`, error);

      // Es mejor usar un mensaje más específico que "Fallo en el registro"
      throw new InternalServerErrorException(
        'Fallo al actualizar el perfil de usuario en Clerk.'
      );
    }
  }

  //------------------Eliminar un Usuario de Clerk--------------//
  async deleteUser(clerkId: string) {
    try {
      // Llamada al método deleteUser de Clerk
      const deletedUser = await clerkClient.users.deleteUser(clerkId);

      // Clerk devuelve el objeto del usuario que fue eliminado
      return deletedUser;
    } catch (error) {
      console.error(`Error al eliminar usuario ${clerkId} en Clerk:`, error);

      // Si el usuario no existe
      if (error.status === 404) {
        throw new NotFoundException(
          `Usuario con ID ${clerkId} no encontrado en Clerk.`
        );
      }

      // Para cualquier otro error (ej. problemas de conexión, permisos)
      throw new InternalServerErrorException(
        'Fallo al eliminar el perfil de usuario en Clerk.'
      );
    }
  }
}
