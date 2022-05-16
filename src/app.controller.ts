import {Controller, Get} from "@nestjs/common";

@Controller('/')
export class AppController {
    @Get('check')
    public check(){
        return true
    }
}