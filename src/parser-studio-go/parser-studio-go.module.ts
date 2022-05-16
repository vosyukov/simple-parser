import { Module } from "@nestjs/common";
import {ParserStudioGoService} from "./parser-studio-go.service";
import {HttpModule} from "@nestjs/axios";
import {FileUploaderModule} from "../file-uploader/file-uploader.module";

@Module({
    imports: [HttpModule, FileUploaderModule],
    providers: [ParserStudioGoService]
})
export class ParserStudioGoModule {
}