import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child from 'child_process';
import * as Constant from './Constant.js';



/**
 * 创建并写入目标文件
 */
export function writeFile(path, content) {
    ensureFolderExist(path);
    fs.writeFileSync(path, content)
}

/**
 * 解析绝对路径
 * @returns 
 */
export function parseAbsolutePath(filePath) {
    if (/^~\//.test(filePath)) {
        filePath = filePath.replace(/^~/, os.homedir());
    }
    if (!/^\//.test(filePath)) {
        throw new Error("路径不正确");
    }
    return filePath;
}

/**
 * 若目录不存在就创建目录
 */
export function ensureFolderExist(filePath) {
    filePath = parseAbsolutePath(filePath);
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureFolderExist(dirname);
    fs.mkdirSync(dirname);
}

/**
 * 处理其他资源
 */
export function handleResources() {
    child.exec(`lessc ${Constant.SOURCE_CSS_PATH}/style.less ${Constant.TARGET_CSS_PATH}/style.css`);
    child.exec(`mv ${Constant.SOURCE_FONT_PATH} ${Constant.TARGET_FONT_PATH}`);
}