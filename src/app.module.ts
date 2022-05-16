import { Module } from '@nestjs/common';
import {ParserUgolocModule} from "./parser-ugoloc/parser-ugoloc.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ParserStudioGoModule} from "./parser-studio-go/parser-studio-go.module";
import {ScheduleModule} from "@nestjs/schedule";


@Module({
  imports: [ParserUgolocModule, ParserStudioGoModule, TypeOrmModule.forRoot(), ScheduleModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
