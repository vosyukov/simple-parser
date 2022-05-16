import { Module } from "@nestjs/common";
import {FileUploaderService} from "./file-uploader.service";


@Module({
    imports: [],
    providers: [FileUploaderService],
    exports:[FileUploaderService]
})
export class FileUploaderModule {}