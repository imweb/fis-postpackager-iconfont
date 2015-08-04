/*
 生成字体文件，
 生成字体 content
 */
'use strict';
var fs = require('fs'),
    path = require('path'),
    fontCarrier = require('font-carrier');


var svgCnt = 0;


/*
* generate font files
*/
function genarateFonts(opt){
    var svgPath = opt.svgPath,
        files = fs.readdirSync(svgPath),
        output = opt.output,
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

    if(!fs.existsSync(path.dirname(output))){
        fs.mkdirSync(output);
    }
    // 导出字体
    var content = font.output({
        path: output
    });

    return {
        iconContentMaps: iconContentMaps, // icon 名和 content 的 map
        iconContents: iconContents, // content 
        fontContent: content, // 字体文件{ttf: xxx, woff: xxx}
        iconNames: iconNames // icon名字，和svg 名字，类名有对应关系
    };
}


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

// 生成 icon 样式
// ttf 文件引入 cdn 问题
function generateCss(iconNames, maps){
    var content = [],
        iconContent;
    // 字体的引用和每个css的引入路径有关系
    content.push('@font-face { ');
    content.push('font-family: "mfont";');
    content.push('src: url("{{$path}}") format("truetype");}');
    content.push('.icon-font{font-family:"mfont";font-size:16px;font-style:normal;}');
    iconNames.forEach(function(iconName){
        iconContent = maps[iconName];
        if(iconContent){
            iconContent = iconContent.replace('&#xf', '\\f');
            content.push('.i-' + iconName + ':after{content: "' + iconContent + '";}');
        }
    });
    return content.join('\r\n');
}


module.exports = {
    init: genarateFonts,
    generateCss: generateCss
};