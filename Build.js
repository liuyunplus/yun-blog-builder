import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import handlebars from 'handlebars';
import * as FileUtils from './FileUtils.js';
import * as Constant from './Constant.js';


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
    //解析到第2个标记行时就不再向下解析
    if (tagNum == 2) {
      break;
    }
    let isMeta = (tagNum == 1 && line != "---");
    if (isMeta) {
      let metaName = line.substr(0, line.indexOf(':'));
      let metaValue = line.substr(line.indexOf(':') + 1).trim()
      //去除首尾两端的引号
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
 * 获取渲染后的HTML
 * @returns 
 */
 function getRenderedHtml(tmplPath, data) {
  //注册Header模版
  let headerTmpl = fs.readFileSync(Constant.TEMPLATE_HEADER, 'utf8');
  handlebars.registerPartial('Header', headerTmpl);
  //注册Footer模版
  let footerTmpl = fs.readFileSync(Constant.TEMPLATE_FOOTER, 'utf8');
  handlebars.registerPartial('Footer', footerTmpl);

  //开始获取渲染模版
  let renderTmpl = fs.readFileSync(tmplPath, 'utf8');
  const template = handlebars.compile(renderTmpl);
  data["global"] = {
    rootPath: Constant.TARGET_SERVER
  };
  let renderedHtml = template(data);
  return renderedHtml;
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
    let renderedHtml = getRenderedHtml(Constant.TEMPLATE_BLOG, {postMeta: postMeta, postHtml: postHtml});
    //写入目标文件
    FileUtils.writeFile(`${Constant.TARGET_HTML_PATH}/${postMeta["title"]}.html`, renderedHtml)
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
  let renderedHtml = getRenderedHtml(Constant.TEMPLATE_HOME, {postList: postList});
  FileUtils.writeFile(`${Constant.TARGET_ROOT_PATH}/index.html`, renderedHtml)
  return true;
}

/**
 * 渲染关于我页面
 * @returns 
 */
function renderAboutPage() {
  const mdText = fs.readFileSync(`${Constant.SOURCE_ABOUT_PATH}/index.md`, 'utf8')
  let fragmentHtml = marked.parse(mdText)
  let renderedHtml = getRenderedHtml(Constant.TEMPLATE_ABOUT, {html: fragmentHtml});
  FileUtils.writeFile(`${Constant.TARGET_HTML_PATH}/about.html`, renderedHtml)
  return true;
}

/**
 * 渲染归档页面
 * @returns 
 */
function renderArchivePage(postList) {
  let renderedHtml = getRenderedHtml(Constant.TEMPLATE_ARCHIVE, {postList: postList});
  FileUtils.writeFile(`${Constant.TARGET_HTML_PATH}/archive.html`, renderedHtml)
  return true;
}

/**
 * 渲染分类页面
 * @returns 
 */
function renderCategoryPage(postList) {
  let categoryMap = {};
  for (let postData of postList) {
    //获取文章的元数据
    let category = postData["postMeta"]["categories"];
    let childList = categoryMap[category];
    if (childList) {
      childList.push(postData);
    } else {
      categoryMap[category] = [postData];
    }
  }
  //渲染分类详情页
  let categoryInfos = [];
  for(let category in categoryMap) {
    let postList = categoryMap[category];
    let renderedHtml = getRenderedHtml(Constant.TEMPLATE_ARCHIVE, {postList: postList});
    FileUtils.writeFile(`${Constant.TARGET_HTML_PATH}/category/${category}.html`, renderedHtml)
    categoryInfos.push({
      "categoryName": category,
      "categorySize": postList.length
    });
  }
  //渲染分类列表页
  let renderedHtml = getRenderedHtml(Constant.TEMPLATE_CATEGORY, {categoryInfos: categoryInfos});
  FileUtils.writeFile(`${Constant.TARGET_HTML_PATH}/category.html`, renderedHtml)
}


function runBuild() {
  let postList = []
  fs.readdirSync("post").forEach(function (fileName) {
    let filePath = `${Constant.SOURCE_POST_PATH}/${fileName}`;
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
  //渲染归档页面
  renderArchivePage(postList);
  //渲染分类页面
  renderCategoryPage(postList);
  //处理其他资源(css文件/字体文件等)
  FileUtils.handleResources();
}


runBuild();

