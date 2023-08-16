const fs = require('fs');
const path = require('path');


function generatePostMap(postMetaList) {
    //按时间倒序排序
    postMetaList.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    //按年份进行分组
    let postYearMap = new Map()
    for (const postMeta of postMetaList) {
        postMeta.id = postMeta.date.replaceAll("-", "")
        let year = parseInt(postMeta.date.split("-")[0])
        let posts = postYearMap.get(year) || []
        posts.push(postMeta)
        postYearMap.set(year, posts)
    }
    let postList = [...postYearMap].sort((a, b) => b[0] - a[0])
    return postList;
}


function writeFileSync(filePath, fileContent) {
    const directory = path.dirname(filePath);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(filePath, fileContent);
}


module.exports = {
    generatePostMap,
    writeFileSync
};