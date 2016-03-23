/*
 生成字体文件，
 生成字体 content
 */
'use strict';
var fs = require('fs'),
    path = require('path'),
    fontCarrier = require('font-carrier');


// 十进制 转 16进制
function decimal2Hex(n) {
    var hex = n.toString(16);
    hex = '000'.substr(0, 3 - hex.length) + hex;
    return hex;
}

// 生成 icon 对应的 content
function generateIconContent(n) {
    return '&#xf' + decimal2Hex(n);
}

function mkdir(dir) {
    if (!fs.existsSync(dir)) {
        mkdir(path.dirname(dir));
        fs.mkdirSync(dir);
    }
}

/*
 * generate font files
 * 字体文件 md5
 */
exports.genarateFonts = function(opt, icons) {
    var svgPath = opt._svgPath,
        // output = opt.fontsOutput,
        font = fontCarrier.create(),
        svgsObj = {},
        filePath,
        iconContent;
    icons.forEach(function(icon, index) {
        filePath = path.join(svgPath, icon + '.svg');
        if (fs.existsSync(filePath)) {
            iconContent = generateIconContent(index);
            svgsObj[iconContent] = fs.readFileSync(filePath).toString();
        } else {
            fis.log.warning(filePath + ' ------ svg file does not exist!');
        }

    });

    font.setSvg(svgsObj);

    var outFontsContent = font.output({}),
        outFileName = 'iconfont';

    return {
        content: outFontsContent,
        subpath: opt.output + '/' + outFileName
    };
};

/*
 * 根据icon生成对应的字体
 * 需要判断实际的svg（正则匹配到了不是icon的表达式）文件是否存在，否则会有多余样式
 */
exports.generateCss = function(opt, iconNames, start, step) {
    var self = this,
        pseudoClass = ~['after', 'before'].indexOf(opt.pseClass) ? opt.pseClass : 'after',
        start = start || 0,
        step = step || 1;

    var content = [],
        iconContent;
    // 字体的引用和每个css的引入路径有关系

    content.push('@font-face { ');
    content.push('font-family: "mfont";');
    content.push('src: url("' + opt._fontCdn.eot + '");'); // ie9
    content.push('src: url("' + opt._fontCdn.eot + '?#iefix") format("embedded-opentype"),'); // ie6-8
    content.push('url("' + opt._fontCdn.woff + '") format("woff"),'); // chrome、firefox
    content.push('url("' + opt._fontCdn.ttf + '") format("truetype");}'); // chrome、firefox、opera、Safari, Android, iOS 4.2+

    if(!opt.nonBaseCss) {
        content.push('.icon-font{font-family:"mfont";font-size:16px;font-style:normal;font-weight: normal;font-variant: normal;text-transform: none;line-height: 1;position: relative;-webkit-font-smoothing: antialiased;}');
    }

    iconNames.forEach(function(iconName) {
        iconContent = generateIconContent(start++);
        if (typeof iconContent !== 'undefined' && fs.existsSync(path.join(opt._svgPath, iconName + '.svg'))) {
            iconContent = iconContent.replace('&#xf', '\\f');
            content.push('.i-' + iconName + ':' + pseudoClass + '{content: "' + iconContent + '";}');
        }
    });
    return content.join('\r\n');
};


function file2Base64(str) {
    return new Buffer(str).toString('base64');
}


exports.generateBase64Css = function(opt, iconNames, ttf, start, step) {
    var fontBase64 = file2Base64(ttf);

    var self = this,
        pseudoClass = ~['after', 'before'].indexOf(opt.pseClass) ? opt.pseClass : 'after',
        start = start || 0,
        step = step || 1;
        
    var content = [],
        iconContent;
    content.push('@font-face { ');
    content.push('font-family: "mfont";');
    content.push('src: url("data:application/octet-stream;base64,' + fontBase64 + '") format("truetype");}');

    if(!opt.nonBaseCss) {
        content.push('.icon-font{font-family:"mfont";font-size:16px;font-style:normal;font-weight: normal;font-variant: normal;text-transform: none;line-height: 1;position: relative;-webkit-font-smoothing: antialiased;}');
    }

    iconNames.forEach(function(iconName) {
        iconContent = generateIconContent(start++);
        if (typeof iconContent !== 'undefined' && fs.existsSync(path.join(opt._svgPath, iconName + '.svg'))) {
            iconContent = iconContent.replace('&#xf', '\\f');
            content.push('.i-' + iconName + ':' + pseudoClass + '{content: "' + iconContent + '";}');
        }
    });
    return content.join('\r\n');
}


exports.exportCssFile = function(iconNames, pseClass, path) {
    var content = this.generateCss(iconNames, pseClass);
    fs.writeFileSync(path, content, 'utf-8');
}
