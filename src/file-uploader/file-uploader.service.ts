var crypto = require('crypto');
const manager = require('node-selectel-manager')({
    login: '79212_parser',
    password: 'IzsNO:S0L#'
});

enum Format {
    JPG = 'FFD8FF'
}
export class FileUploaderService {
    public async uploadFile(name: string, data: Buffer) {
        const str = data.toString('hex')



        var fileName = crypto.createHash('sha256').update(data).digest('hex');
        console.log(fileName); // 9b74c9897bac770ffc029102a200c5de

        let exe = ''
        if(str.includes(Format.JPG.toLowerCase())){
            exe = 'jpg'
        }

        console.log(exe)




         await manager.uploadFile(data, 'simple/hall-photos/' + fileName + '.' + exe)
    }
}