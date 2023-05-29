const {mathjax} = require('mathjax-full/js/mathjax.js');
const {TeX} = require('mathjax-full/js/input/tex.js');
const {SVG} = require('mathjax-full/js/output/svg.js');
const {liteAdaptor} = require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler} = require('mathjax-full/js/handlers/html.js');
const {AssistiveMmlHandler} = require('mathjax-full/js/a11y/assistive-mml.js');
const {AllPackages} = require('mathjax-full/js/input/tex/AllPackages.js');
const fs = require('fs')

require('mathjax-full/js/util/entities/all.js');

const em = 16
const ex = 8
const PACKAGES = AllPackages.sort().join(', ')


function parse_math(source_html, target_html) {
    const adaptor = liteAdaptor({fontSize: em});
    AssistiveMmlHandler(RegisterHTMLHandler(adaptor));

    const tex = new TeX({
        packages: PACKAGES.split(/\s*,\s*/),
        inlineMath: [['$', '$']],
        displayMath: [['$$', '$$']]
    });
    const svg = new SVG({fontCache: 'global', exFactor: ex / em});

    const htmlFile = require('fs').readFileSync(source_html, 'utf8');
    const html = mathjax.document(htmlFile, {InputJax: tex, OutputJax: svg});

    html.render();

    if (Array.from(html.math).length === 0) {
        adaptor.remove(html.outputJax.svgStyles);
        const cache = adaptor.elementById(adaptor.body(html.document), 'MJX-SVG-global-cache');
        if (cache) adaptor.remove(cache);
    }

    const renderedHTML = adaptor.outerHTML(adaptor.root(html.document));
    fs.writeFileSync(target_html, renderedHTML)
}


module.exports = {
    parse_math
};