const gulp = require('gulp');
const less = require('gulp-less');
const flatten = require('gulp-flatten');
const pug = require('pug');
const {glob} = require('glob');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');


const file_utils = require("./src/utils/file_utils");
const math_utils = require("./src/utils/math_utils");
const md_utils = require("./src/utils/md_utils");


function build_post(cb) {
    const files = glob.sync('post/**/config.json');
    for (const file of files) {
        const configData = JSON.parse(fs.readFileSync(file, 'utf-8'))
        const mdString = fs.readFileSync(`${path.dirname(file)}/index.md`, 'utf-8')
        const mdHtml = md_utils.parseMarkdown(mdString)
        const pageTmpl = pug.compileFile("src/page/post.pug");
        const pageHtml = pageTmpl({mdHtml: mdHtml, title: configData.title});
        const id = configData.date.replaceAll("-", "")
        file_utils.writeFileSync(`dist/page/${id}.html`, pageHtml)
    }
    cb()
}


function build_home(cb) {
    const files = glob.sync('post/**/config.json');
    const configList = []
    for (const file of files) {
        const config = JSON.parse(fs.readFileSync(file, 'utf-8'))
        configList.push(config);
    }
    const postList = file_utils.generatePostMap(configList);
    const homePage = pug.compileFile('src/page/index.pug');
    const html = homePage({postList: postList});
    file_utils.writeFileSync(`dist/index.html`, html)
    cb()
}


function build_about(cb) {
    const html = pug.compileFile('src/page/about.pug')();
    file_utils.writeFileSync(`dist/about.html`, html)
    cb()
}


function build_less(cb) {
    gulp.src('src/static/style/*.less')
        .pipe(less())
        .pipe(flatten())
        .pipe(gulp.dest('dist/css'))
    gulp.src('src/static/module/**/*')
        .pipe(gulp.dest('dist/module'))
    cb()
}


function modify_image_url(cb) {
    const files = glob.sync('dist/page/*.html');
    for (const file of files) {
        const html = fs.readFileSync(file, 'utf-8');
        const $ = cheerio.load(html);
        const filename = path.basename(file).replace(".html", "")
        $('img').each((index, element) => {
            const img = $(element);
            const oldSrc = img.attr('src');
            const fileName = path.basename(oldSrc);
            const newSrc = `../image/${filename}/${fileName}`
            img.attr('src', newSrc);
        });
        fs.writeFileSync(file, $.html());
    }
    cb()
}


function move_assets(cb) {
    // 移动文章图片
    const files = glob.sync('post/**/config.json');
    for (const file of files) {
        const config = JSON.parse(fs.readFileSync(file, 'utf-8'))
        const source_dir = `${path.dirname(file)}/image/`
        const target_dir = `dist/image/${config.date.replaceAll("-", "")}/`
        if (fse.pathExistsSync(source_dir)) {
            fse.copySync(source_dir, target_dir);
        }
    }
    // 移动其他图片
    gulp.src('src/static/image/*')
        .pipe(gulp.dest('dist/image'))
    // 移动字体文件
    gulp.src('src/static/font/*.ttf')
        .pipe(gulp.dest('dist/font'))
    gulp.src('src/static/font/*.woff2')
        .pipe(gulp.dest('dist/font'))
    cb()
}


function parse_math(cb) {
    const files = glob.sync('dist/page/*.html');
    for (const file of files) {
        math_utils.parse_math(file, file);
    }
    cb()
}

exports.build = gulp.series(build_less, build_post, build_home, build_about, move_assets,
    modify_image_url, parse_math);