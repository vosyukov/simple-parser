import { Injectable } from "@nestjs/common";
import {HttpService} from "@nestjs/axios";
import {firstValueFrom} from "rxjs";
import {load} from 'cheerio'
import {FileUploaderService} from "../file-uploader/file-uploader.service";
import {Cron} from "@nestjs/schedule";

const BASE_URL = 'https://studiogo.ru'

export interface Photospace {
    // photos: string[]
    hallName: string,
    studioName: string,
    // description: string,
    // rules: string,
    // address: string
}

@Injectable()
export class ParserStudioGoService {
    constructor(private httpService: HttpService, private readonly fileUploaderService:FileUploaderService) {

    }

    @Cron('0 0 * * 0')
    handleCron() {
        this.startParse()
    }

    public async startParse():Promise<void> {
        for(let i = 1; i < 3000; i++){
            const url = `${BASE_URL}/studios/${i}`
            try{
                await this.parseStudio( url)
            }
            catch (err){
                console.error(err)
            }

        }
    }

    public async parseStudio(url: string): Promise<void> {
        const {data, status} = await firstValueFrom(this.httpService.get(url, { maxRedirects: 0, validateStatus: () => true }))

        if(status === 200) {
            const $ = load(data)
            const name = $('div[class=company-summary-title]').find('h1').text().trim()
            const cityName = $('div[class=company-summary__location]').text().split(',')[0].trim()
            const hallUrls = $(`.island-wrap:contains("Залы")`).find('a').map(function() { return $(this).attr('href')}).get().filter(i => i !=='#').map(i=>BASE_URL+i.trim())//.map(function() { return $(this).find('a').attr('href')}).get().map(i=>i.trim())


            const {data: city} = await this.httpService.post('https://api2.wb-bot.fun/city/addCity', {name: cityName}).toPromise()
            const {data: studio} = await this.httpService.post('https://api2.wb-bot.fun/studio/addStudio', {name, sourceLink: url, cityId: city.id}).toPromise()

            const promises = []
            for(const url of hallUrls){
                promises.push(this.parserPhotospace( city.id, studio.id, url))
            }

            try{

                await Promise.all(promises)
            }catch (err){
                console.log(err, url)
            }
        }
    }

    public async parserPhotospace(cityId: string, studioId: string, url: string): Promise<Photospace | null> {

        const {data, status} = await firstValueFrom(this.httpService.get(url, { validateStatus: () => true }))

        if(status === 200){
            const $ = load(data)

            const hallName = $('div[class=company-summary-title]').find('h1').text().trim()
            const photosUrl = $('.snippet-phototill__image').map(function() { return $(this).attr('data-options')}).get().map(i => JSON.parse(i).src)
            const hallFeatures = $('.snippet-feature__item').map(function() { return $(this).find('h4').text().trim()}).get()
            const area = parseFloat($('.snippet-panel__item:contains("Площадь зала")').find('.snippet-panel__item-value').text().trim())
            const price = Number(parseInt(String($('.company-summary__main-price').text().trim()).replace(/[^\d]/g, '')))
            const ceilingHeight = Number($('.snippet-panel__item:contains("Высота потолка")').find('.snippet-panel__item-value').text().trim().split(' ')[1])
            const address = $('div[class=company-summary__location]').text().trim()

            // console.log(hallName, photosUrl, area, price, ceilingHeight, address, hallFeatures)
            console.log(url)
            console.log(price)
            const promises = []

            for(const url of photosUrl){
                promises.push(this.parsePhoto(url))
            }

            const imgIds = await Promise.all(promises)

            const {data: features} = await this.httpService.post('https://api2.wb-bot.fun/feature/create', {features: hallFeatures}).toPromise()

            const obj = {name:hallName, photoIds: imgIds, description:"d", studioId, sourceLink: url, area, ceilingHeight, price, featureIds: features.ids, address, cityId}
            console.log(obj)
            const response = await this.httpService.post('https://api2.wb-bot.fun/hall/addHall', obj).toPromise()

            console.log(response.data)


            return
        }

        return null
    }

    public async parsePhoto(url: string): Promise<string> {
        try {
            const {data} = await this.httpService.get(url, {responseType: 'arraybuffer'}).toPromise()

            const response = await this.httpService.post('https://api2.wb-bot.fun/file-storage/uploadFile', {
                name: url.split('/').pop(),
                data: data.toString('base64')
            }).toPromise()

            return response.data.id
        }catch (err){
            console.error(err)
            throw err
        }
    }

    public async wait(seconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(()=>resolve(), seconds * 1000))
    }
}