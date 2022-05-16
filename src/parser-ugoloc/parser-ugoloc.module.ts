import { Module } from "@nestjs/common";
import {ParserUgolocService} from "./parser-ugoloc.service";
import {HttpModule} from "@nestjs/axios";
import {FileUploaderModule} from "../file-uploader/file-uploader.module";

@Module({
    imports: [HttpModule, FileUploaderModule],
    providers: [ParserUgolocService]
})
export class ParserUgolocModule {
}