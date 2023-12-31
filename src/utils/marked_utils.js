const {marked} = require('marked');


function parseMarkdown(markdownString) {
    let codes = new Map();
    let formulas = new Map();
    // 将代码替换成占位符
    markdownString = replaceCode(markdownString, codes)
    // 将公式替换成占位符
    markdownString = replaceMath(markdownString, formulas)
    // 将markdown解析为html
    let html = marked(markdownString, {headerIds: false, mangle: false});

    // 恢复公式
    for (const [placeholder, formula] of formulas) {
        html = html.replace(placeholder, () => formula);
    }
    // 恢复代码块
    for (const [placeholder, code] of codes) {
        html = html.replace(placeholder, () => code);
    }

    return html;
}


function replaceCode(markdownString, codes) {
    // 将字符串中的所有特殊正则表达式字符转义，使它们在正则表达式中被当作普通字符处理。
    const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let placeholderId = 0;
    const generatePlaceholder = () => `CODE_PLACEHOLDER_${placeholderId++}`;

    // 代码块
    let blockCodeTag = escapeRegExp("```")
    const blockCodeRegex = new RegExp(`(${escapeRegExp(blockCodeTag)})([\\s\\S]*?)\\1`, 'g');
    markdownString = markdownString.replace(blockCodeRegex,
        (match, delimiter, code) => {
            const placeholder = generatePlaceholder();
            codes.set(placeholder, match);
            return placeholder;
        }
    );
    // 行内代码
    let escapeTag = escapeRegExp("\\")
    let inlineCodeTag = escapeRegExp("`")
    const inlineCodeRegex = new RegExp(`(?<!${escapeTag})(${inlineCodeTag})(.*?)(?<!${escapeTag})\\1`, 'g');
    markdownString = markdownString.replace(inlineCodeRegex,
        (match, delimiter, formula) => {
            const placeholder = generatePlaceholder();
            codes.set(placeholder, match);
            return placeholder;
        }
    );

    return markdownString
}


function replaceMath(markdownString, formulas) {
    // 将字符串中的所有特殊正则表达式字符转义，使它们在正则表达式中被当作普通字符处理。
    const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let placeholderId = 0;
    const generatePlaceholder = () => `MATH_FORMULA_PLACEHOLDER_${placeholderId++}`;
    // 匹配块公式并替换为占位符
    let blockMathTag = escapeRegExp("$$")
    const blockMathRegex = new RegExp(`(${escapeRegExp(blockMathTag)})([\\s\\S]*?)\\1`, 'g');
    markdownString = markdownString.replace(blockMathRegex,
        (match, delimiter, formula) => {
            const placeholder = generatePlaceholder();
            formulas.set(placeholder, delimiter + formula + delimiter);
            return placeholder;
        }
    );
    // 匹配行内公式并替换为占位符
    let escapeTag = escapeRegExp("\\")
    let inlineMathTag = escapeRegExp("$")
    const inlineMathRegex = new RegExp(`(?<!${escapeTag})(${inlineMathTag})(.*?)(?<!${escapeTag})\\1`, 'g');
    markdownString = markdownString.replace(inlineMathRegex,
        (match, delimiter, formula) => {
            const placeholder = generatePlaceholder();
            formulas.set(placeholder, delimiter + formula + delimiter);
            return placeholder;
        }
    );

    return markdownString
}

module.exports = {
    parseMarkdown
};