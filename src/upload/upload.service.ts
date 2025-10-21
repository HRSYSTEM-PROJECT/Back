// upload.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) {}

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        { folder: 'avatars' },
        (error, result) => {
          if (!result || !result.secure_url) {
  return reject(new Error('No se pudo subir la imagen a Cloudinary'));
}
resolve(result.secure_url);

        }
      );

      Readable.from(file.buffer).pipe(stream);
    });
  }
}
