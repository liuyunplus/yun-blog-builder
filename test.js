import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';


function ensureFolderExist(filePath) {
    if (/^~\//.test(filePath)) {
        filePath = filePath.replace(/^~/, os.homedir());
    }
    if (!/^\//.test(filePath)) {
        throw new Error("路径不正确");
    }
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureFolderExist(dirname);
    fs.mkdirSync(dirname);
}