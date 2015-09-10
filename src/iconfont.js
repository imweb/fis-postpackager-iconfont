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
        mkdir(path.dirname(dir));
        fs.mkdirSync(dir);
    }
}

/*
* generate font files
*/
exports.genarateFonts = function (opt, icons) {
    var svgPath = opt.svgPath,
        output = opt.fontsOutput,
        font = fontCarrier.create(),
        svgsObj = {},
        filePath,
        iconContent;
    icons.forEach(function(icon, index){
        filePath = path.join(svgPath, icon + '.svg');
        if(fs.existsSync(filePath)) {
            iconContent = generateIconContent(index);
            svgsObj[iconContent] = fs.readFileSync(filePath).toString();
        } else {
            fis.log.warning(filePath + ' ------  svg 文件不存在，如果是构建误报，请忽略');
        }
    });

    // console.log(svgsObj);
    font.setSvg(svgsObj);

    mkdir(output);

    var outFontsContent = font.output({}),
        outFileName = 'iconfont';

    for(var type in outFontsContent){
        if(outFontsContent.hasOwnProperty(type)) {
            fs.writeFileSync(output + '/' + outFileName + '.' + type, outFontsContent[type]);
        }  
    }
    return opt.output + '/' + outFileName
};


// 生成 icon 样式
// ttf 文件引入 cdn 问题
exports.generateCss = function (iconNames, opt, start) {
    var self = this,
        start = start || 0,
        pseudoClass = opt.pseClass || 'after';

    var content = [],
        iconContent;

    content.push('@font-face { ');
    content.push('font-family: "mfont";');
    content.push('src: url("{{$path}}.eot");'); // ie9
    content.push('src: url("{{$path}}.eot?#iefix") format("embedded-opentype"),'); // ie6-8
    content.push('url("{{$path}}.woff") format("woff"),');  // chrome、firefox
    content.push('url("{{$path}}.ttf") format("truetype");}'); // chrome、firefox、opera、Safari, Android, iOS 4.2+
    content.push('.icon-font{font-family:"mfont";font-size:16px;font-style:normal;font-weight: normal;font-variant: normal;text-transform: none;line-height: 1;position: relative;-webkit-font-smoothing: antialiased;}');
    iconNames.forEach(function(iconName){
        iconContent = generateIconContent(start++);
        if (fs.existsSync(path.join(opt.svgPath, iconName + '.svg')) ) {
            iconContent = iconContent.replace('&#xf', '\\f');
            content.push('.i-' + iconName + ':' + pseudoClass + '{content: "' + iconContent + '";}');
        } 
    });
    return content.join('\r\n');
};
