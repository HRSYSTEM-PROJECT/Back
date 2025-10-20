import { Injectable, Inject } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) {}

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const result = await this.cloudinary.uploader.upload(file.path, {
      folder: 'avatars', // opcional: carpeta en Cloudinary
    });
    return result.secure_url;
  }
}
