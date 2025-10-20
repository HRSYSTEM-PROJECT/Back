import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { cloudinaryConfig } from 'src/config/cloudinary';

@Module({
  controllers: [UploadController],
  providers: [UploadService, cloudinaryConfig],
  exports: [UploadService]
})
export class UploadModule {}
