import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import handlebars from 'handlebars';
import * as FileUtils from './FileUtils.js';


const DIR_NAME = path.resolve();


/**
 * 解析文章数据
 * @returns 
 */
function parsePostData(filePath) {
  let fileStat = fs.statSync(filePath);
  let fileName = path.basename(filePath)
  //如果不是Markdown文件，则不进行解析
  if (!fileStat.isFile || !/\.md$/.test(fileName)) {
    return null;
  }
  let postData = {}
  const fileContent = fs.readFileSync(filePath, 'utf8');
  //分割成每一行
  let lineList = fileContent.split(/\n/);
  let [postMeta, postText] = parsePostMeta(lineList);
  postData["postMeta"] = postMeta;
  postData["postText"] = postText;
  return postData;
}

/**
 * 解析文章元数据
 * @returns 
 */
function parsePostMeta(lineList) {
  let postMeta = {};
  let tagNum = 0;
  let lineNo = 0;
  for (let line of lineList) {
    lineNo++;
    if (line == "---") {
      tagNum++;
    }
    // 解析到第2个标记行时就不再向下解析
    if (tagNum == 2) {
      break;
    }
    let isMeta = (tagNum == 1 && line != "---");
    if (isMeta) {
      let metaName = line.substr(0, line.indexOf(':'));
      let metaValue = line.substr(line.indexOf(':') + 1).trim()
      // 去除首尾两端的引号
      metaValue = metaValue.replace(/^ *\'|\' *$/g, '')
      postMeta[metaName] = metaValue;
    }
  }
  //获取文章正文文本
  lineList.splice(0, lineNo);
  let postText = lineList.join("\n");
  return [postMeta, postText];
}

/**
 * 渲染文章页
 * @returns 
 */
function renderPostPage(postList) {
  for(let postData of postList) {
    //获取文章的元数据
    let postMeta = postData["postMeta"];
    //获取文章Markdown文本
    let postText = postData["postText"];
    //将Markdown文本转换成HTML
    let postHtml = marked.parse(postText)
    let renderTmpl = fs.readFileSync('template/template-blog.html', 'utf8')
    const template = handlebars.compile(renderTmpl);
    let renderedHtml = template({postMeta: postMeta, postHtml: postHtml});
    //写入目标文件
    FileUtils.writeFile(`blog/${postMeta["title"]}.html`, renderedHtml)
  }
  return true;
}

/**
 * 渲染首页
 * @returns 
 */
function renderHomePage(postList) {
  //按发布时间倒序排序
  postList = postList.sort(function(a, b){
    let date1 = new Date(Date.parse(a["postMeta"]["date"]))
    let date2 = new Date(Date.parse(b["postMeta"]["date"]))
    return date2 - date1;
  })
  let renderTmpl = fs.readFileSync('template/template-home.html', 'utf8')
  const template = handlebars.compile(renderTmpl);
  let renderedHtml = template({postList: postList});
  FileUtils.writeFile("index.html", renderedHtml)
  return true;
}

/**
 * 渲染关于我页面
 * @returns 
 */
function renderAboutPage() {
  const mdText = fs.readFileSync('about/index.md', 'utf8')
  let fragmentHtml = marked.parse(mdText)
  let renderTmpl = fs.readFileSync('template/template-about.html', 'utf8')
  const template = handlebars.compile(renderTmpl);
  let renderedHtml = template({html: fragmentHtml});
  FileUtils.writeFile("about/index.html", renderedHtml)
  return true;
}


function runBuild() {
  let postList = []
  fs.readdirSync("blog").forEach(function (filename) {
    let filePath = `${DIR_NAME}/blog/${filename}`;
    let postData = parsePostData(filePath);
    if (postData) {
      postList.push(postData);
    }
  });
  //渲染文章页
  renderPostPage(postList);
  //渲染首页
  renderHomePage(postList);
  //渲染关于我页面
  renderAboutPage();
  FileUtils.moveStyles();
}


runBuild();

