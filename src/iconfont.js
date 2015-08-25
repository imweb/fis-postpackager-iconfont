/*
 生成字体文件，
 生成字体 content
 */
'use strict';
var fs = require('fs'),
    path = require('path'),
    fontCarrier = require('font-carrier');


var svgCnt = 0;


// 十进制 转 16进制
function decimal2Hex(n){
    var hex = n.toString(16);
    hex = '000'.substr(0, 3 - hex.length) + hex;
    return hex;
}

// 生成 icon 对应的 content
function generateIconContent(n){
    return '&#xf' + decimal2Hex(n);
}

function mkdir(dir) {
    if(!fs.existsSync(dir)) {
        mkdir(path.basename(dir));
        fs.mkdirSync(dir);
    } else {
        
    }
}

/*
* generate font files
*/
exports.genarateFonts = function (opt) {
    var self = this;

    var svgPath = opt.svgPath,
        files = fs.readdirSync(svgPath),
        output = opt.fontsOutput,
        font = fontCarrier.create(),
        svgsObj = {},
        iconNames = [],
        iconContents = [],
        fileName,
        iconContentMaps = {},
        iconContent;
    files.forEach(function(file){
        if(path.extname(file) == '.svg'){
            iconContent = generateIconContent(svgCnt++);
            fileName = path.basename(file, '.svg');
            iconNames.push(fileName);
            iconContents.push(iconContent);
            iconContentMaps[fileName] = iconContent;
            svgsObj[iconContent] = fs.readFileSync(path.join(svgPath, file)).toString();
        }
    });

    font.setSvg(svgsObj);

    var outputDir = path.dirname(output);
    // mkdir(outputDir);
    if(!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }
    // 导出字体
    var content = font.output({
        path: output
    });

    self.maps = {
        iconContentMaps: iconContentMaps, // icon 名和 content 的 map
        iconContents: iconContents, // content 
        fontContent: content, // 字体文件{ttf: xxx, woff: xxx}
        iconNames: iconNames // icon名字，和svg 名字，类名有对应关系
    };
    return self.maps; 
};

// 生成 icon 样式
// ttf 文件引入 cdn 问题
exports.generateCss = function (iconNames, pseClass) {
    var self = this,
        pseudoClass = pseClass || 'after',
        maps = self.maps.iconContentMaps || {};

    var content = [],
        iconContent;
    // 字体的引用和每个css的引入路径有关系
    content.push('@font-face { ');
    content.push('font-family: "mfont";');
    content.push('src: url("{{$path}}") format("truetype");}');
    content.push('.icon-font{font-family:"mfont";font-size:16px;font-style:normal;font-weight: normal;font-variant: normal;text-transform: none;line-height: 1;position: relative;-webkit-font-smoothing: antialiased;}');
    iconNames.forEach(function(iconName){
        iconContent = maps[iconName] || '';
        if (typeof iconContent !== 'undefined') {
            iconContent = iconContent.replace('&#xf', '\\f');
            content.push('.i-' + iconName + ':' + pseudoClass + '{content: "' + iconContent + '";}');
        }
    });
    // generateHtml(iconNames);
    return content.join('\r\n');
};


// 生成 demo 页面
function generateHtml(iconNames){
    var content = [];
    content.push('<!DOCTYPE html>\r\n<html lang="en">\r\n<head>\r\n<meta charset="UTF-8">\r\n<title>iconfont demo</title>');
    content.push('<link href="iconfont-embedded.css" rel="stylesheet" type="text/css" /> ');
    content.push('</head>\r\n<body>');

    iconNames.forEach(function (iconName) {
        content.push('<i class="icon-font i-' + iconName + '"></i>');
    });
    content.push('</body>\r\n</html>');

    fs.writeFileSync('./fonts/demo.html', content.join('\r\n'));
}