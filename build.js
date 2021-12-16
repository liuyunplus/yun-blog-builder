import { marked } from 'marked';
import * as fs from 'fs';
import * as path from 'path';
import handlebars from 'handlebars';


const BLOG_ROOT_PATH = "/Users/yliu2/Blog";
const DIR_NAME = path.resolve();

/**
 * 解析文章基础信息
 * @returns 
 */
function parseMetaData(content) {
  const meta = {}
  const lines = content.split(/\r?\n/);
  const first = lines[0]
  if (first == "---") {
    for(let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line == "---") {
        break
      }
      let key = line.substr(0, line.indexOf(':'));
      let value = line.substr(line.indexOf(':') + 1).trim()
      // 去除首尾两端的引号
      value = value.replace(/^ *\'|\' *$/g, '')
      meta[key] = value
    }
  }
  return meta;
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
    const blogText = fs.readFileSync(filePath, 'utf8');
    const blogMeta = parseMetaData(blogText);
    markdownToHtml(blogMeta, blogText)
    metaList.push(blogMeta);
  }
});

renderHomePage(metaList)