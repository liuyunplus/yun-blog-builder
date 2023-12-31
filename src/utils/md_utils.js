const markdownIt = require('markdown-it');
const markdownItMathjax = require('markdown-it-mathjax');

const md = markdownIt({
    html: true,
    linkify: true,
    typographer: true,
});
md.use(markdownItMathjax({
    beforeInlineMath: "$",
    afterInlineMath: "$",
    beforeDisplayMath: "$$",
    afterDisplayMath: "$$"
}));
md.disable('replacements')

function parseMarkdown(markdownString) {
    markdownString = markdownString.replace("\\$", "\\\\$")
    return md.render(markdownString)
}

module.exports = {
    parseMarkdown
};