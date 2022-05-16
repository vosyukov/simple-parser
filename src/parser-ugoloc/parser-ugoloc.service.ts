import { Injectable } from "@nestjs/common";
import {HttpService} from "@nestjs/axios";
import {firstValueFrom} from "rxjs";
import {load} from 'cheerio'
import {FileUploaderService} from "../file-uploader/file-uploader.service";
import {Cron} from "@nestjs/schedule";


export interface Photospace {
    // photos: string[]
    hallName: string,
    studioName: string,
    // description: string,
    // rules: string,
    // address: string
}

@Injectable()
export class ParserUgolocService {
    constructor(private httpService: HttpService, private readonly fileUploaderService:FileUploaderService) {

    }

    @Cron('0 0 * * 0')
    handleCron() {
        this.startParse()
    }

    public async startParse():Promise<void> {
        for(let i = 1; i < 3000; i++){
            try{
                await this.parseStudio("Москва", `https://ugoloc.ru/moscow/studios/show/${i}`)
            }
            catch (err){
                console.error(err.message, `https://ugoloc.ru/moscow/studios/show/${i}`)
            }

        }
    }

    public async parseStudio(cityName: string, url: string): Promise<void> {
        const {data, status} = await firstValueFrom(this.httpService.get(url, { maxRedirects: 0, validateStatus: () => true }))

        if(status === 200) {
            const $ = load(data)
            const name = $('div[class=location-info__title]').text().trim()
            const hallUrls = $('.location-pavilions__wrapper').map(function() { return $(this).find('a').attr('href')}).get().map(i=>i.trim())


            const {data: city} = await this.httpService.post('https://api2.wb-bot.fun/city/addCity', {name: cityName}).toPromise()
            const response = await this.httpService.post('https://api2.wb-bot.fun/studio/addStudio', {name, sourceLink: url, cityId: city.id}).toPromise()

            const promises = []
            for(const url of hallUrls){
                promises.push(this.parserPhotospace( city.id, response.data.id, url))
            }

            try{

                await Promise.all(promises)
            }catch (err){
                console.log(err.message, url)
            }
        }
    }

    public async parserPhotospace(cityId: string, studioId: string, url: string): Promise<Photospace | null> {

        const {data, status} = await firstValueFrom(this.httpService.get(url, { validateStatus: () => true }))

        if(status === 200){
            const $ = load(data)

            const [, hallName] = $('div[class=location-info__title]').text().split('•').map(item => item.trim())
            const photosUrl = $('.location-gallary__item').map(function() { return $(this).find('img').attr('src')}).get()
            const hallFeatures = $('.location-equipments__item').map(function() { return $(this).text().trim()}).get()
            const area = Number($('.location-specifications__row:contains("Площадь, м2")').find('span.location-specifications__right-value').text().trim()) ?? undefined
            const price = Number($('.location-booking__price').find('#someid').text().trim() || 0)
            const ceilingHeight = Number($('.location-specifications__row:contains("Потолок, м")').find('span.location-specifications__right-value').text().trim()) ?? undefined
            const address = $('.location-info__address').text().trim().replace(' •',',').replace('  ',' ').replace('м. м.','м.')


            const promises = []

            for(const url of photosUrl){
                promises.push(this.parsePhoto(url))
            }

            const imgIds = await Promise.all(promises)

            const {data: features} = await this.httpService.post('https://api2.wb-bot.fun/feature/create', {features: hallFeatures}).toPromise()

            const obj = {name:hallName, photoIds: imgIds, description:"d", studioId, sourceLink: url, area, ceilingHeight, price, featureIds: features.ids, address, cityId}
            const response = await this.httpService.post('https://api2.wb-bot.fun/hall/addHall', obj).toPromise()


            return
        }

        return null
    }

    public async parsePhoto(url: string): Promise<string> {

        const {data} = await this.httpService.get(url, {responseType: 'arraybuffer'}).toPromise()

        const response = await this.httpService.post('https://api2.wb-bot.fun/file-storage/uploadFile', {name:url.split('/').pop() , data: data.toString('base64')}).toPromise()

        return response.data.id
    }

    public async wait(seconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(()=>resolve(), seconds * 1000))
    }
}