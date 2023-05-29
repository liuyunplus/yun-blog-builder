const fs = require('fs');
const path = require('path');


function generatePostMap(postMetaList) {
    //按时间倒序排序
    postMetaList.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    //按年份进行分组
    let postYearMap = postMetaList.reduce((map, postMeta) => {
        postMeta.id = postMeta.date.replaceAll("-", "")
        let year = parseInt(postMeta.date.split("-")[0])
        if (map[year]) {
            map[year].push(postMeta);
        } else {
            map[year] = [postMeta];
        }
        return map;
    }, {})
    return postYearMap;
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