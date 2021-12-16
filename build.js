import { marked } from 'marked';
import * as fs from 'fs';
import * as path from 'path';
import handlebars from 'handlebars';


const BLOG_ROOT_PATH = "/Users/liuyun/Blog";
const DIR_NAME = path.resolve();

/**
 * 解析文章基础信息
 * @returns 
 */
function parseMetaData(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let result = {}
  let lines = content.split(/\n/);
  if (lines[0] == "---") {
    let meta = {}
    let index = 1;
    for(index; index < lines.length; index++) {
      const line = lines[index]
      if (line == "---") {
        break
      }
      let key = line.substr(0, line.indexOf(':'));
      let value = line.substr(line.indexOf(':') + 1).trim()
      // 去除首尾两端的引号
      value = value.replace(/^ *\'|\' *$/g, '')
      meta[key] = value
    }
    result["meta"] = meta;
    // 去掉头部信息
    lines.splice(0, index + 1);
    result["body"] = lines.join("\n");
  }
  return result;
}

function markdownToHtml(meta, content) {
  let blogTmpl = fs.readFileSync('template/template-blog.html', 'utf8')
  const template = handlebars.compile(blogTmpl);
  let html = marked.parse(content)
  let blogHtml = template({data: html});
  const title = meta["title"]
  const result = fs.writeFileSync(BLOG_ROOT_PATH + "/blog/" + title + ".html", blogHtml)
  return result
}


function renderHomePage(blogList) {
  let homeTmpl = fs.readFileSync('template/template-home.html', 'utf8')
  const template = handlebars.compile(homeTmpl);
  let homeHtml = template({blogList: blogList});
  const result = fs.writeFileSync(BLOG_ROOT_PATH + "/index.html", homeHtml)
  return result
}


let metaList = []
fs.readdirSync("./blog").forEach(function (name) {
  var filePath = `${DIR_NAME}/blog/${name}`;
  var stat = fs.statSync(filePath);
  if (stat.isFile()) {
    let result = parseMetaData(filePath);
    let blogMeta = result["meta"]
    let blogText = result["body"]
    if (Object.keys(blogMeta).length == 0) {
      return;
    }
    markdownToHtml(blogMeta, blogText)
    metaList.push(blogMeta);
  }
});


let sortedMetaList = metaList.sort(function(a, b){
  let date1 = new Date(Date.parse(a["date"]))
  let date2 = new Date(Date.parse(b["date"]))
  return date1 < date2;
})

renderHomePage(metaList)