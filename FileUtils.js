import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child from 'child_process';

const TARGET_PATH = "~/Public/liuyunplus.github.io";
const DIR_NAME = path.resolve();

/**
 * 创建并写入目标文件
 */
export function writeFile(relativePath, content) {
    let absolutePath = parseAbsolutePath(TARGET_PATH + "/" + relativePath);
    ensureFolderExist(absolutePath);
    fs.writeFileSync(absolutePath, content)
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


export function moveStyles() {
    let sourcePath = `${DIR_NAME}/style/style.less`;
    let targetPath = parseAbsolutePath(`${TARGET_PATH}/style.css`);
    child.exec(`lessc ${sourcePath} ${targetPath}`);
}