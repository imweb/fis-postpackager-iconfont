/*
* http://fis.baidu.com
 */


'use strict';

var path = require('path'),
    fs = require('fs'),
    icon = require('./iconfont.js');


// 数组去重
function uniqList(arr) {
    // 去重
    var ret = [],
        tmpl = {},
        item;
    for(var k=0,len=arr.length; k<len; k++){
        item = arr[k];
        if(!tmpl[item]){
            tmpl[item] = 1;
            ret.push(item);
        }
    }
    return ret;
}

/*
* 字体按需打包（现在所有的svg都打包了）
* css content优化
 */
module.exports = function (ret, conf, settings, opt) {

    var projectPath = fis.project.getProjectPath(),
        iconPrefix = settings.classPrefix,
        iconReg = new RegExp('icon-font\\\s' + iconPrefix + '([a-zA-Z0-9\\\-_]*)', 'mg'),
        cleanIconReg = new RegExp('icon-font\\\s' + iconPrefix, 'g');
    // 遍历svg，生成字体文件
    var fontOutPath = path.dirname(projectPath);

    if(!settings.svgPath) {
        fis.log.error('插件 fis3-postpackager-iconfont 中属性 svgPath --- 必须配置（本地svg路径，方便产出字体）！');
    }

    settings.svgPath = path.join(projectPath, settings.svgPath);

    fontOutPath = path.join(fontOutPath, opt.dest);
    settings.fontsOutput = path.join(fontOutPath, settings.output);
    // dev | dist 目录不存在
    if(!fs.existsSync(fontOutPath)) {
        fs.mkdirSync(fontOutPath);
    }

    var ignoreLibList = settings.ignore ||  ['zepto', 'badjs', 'mod', 'bj-report', 'tools', 'db'];

    var wholeProjectIcon = [],
        pages = [],
        content,
        eachFileIconList = [];

    // html 所有 tpl 依赖项分析
    fis.util.map(ret.src, function (subpath, file) {
        content = file.getContent();
        if(file.isHtmlLike || file.ext === '.tpl') {
            // html, tpl, vm
            eachFileIconList = getIconMatches(content);
            if(eachFileIconList.length > 0) {
                wholeProjectIcon = wholeProjectIcon.concat(eachFileIconList);
            }
            
            // 需要添加css的页面
            // 项目根目录下面的html文件，认定为是业务页面，需要添加字体文件
            if(file.dirname === projectPath ) {
                pages.push(file);
            }

        } else if(file.isJsLike && ~~ignoreLibList.indexOf(file.filename)) {     
            // 基础库忽略查找
            // js 中iconfont查找方式不同 addClass('i-xxx');
            
            var matches = content.match(/addClass\([\'\"]([^\'\"\s]*\s)?i-([^\'\"\s]*)/mg);
            if(matches){
                // iconfont 无法覆盖
                // 场景 html 标签上已经有 i-a
                // 依赖的js中有addClass('i-b')，这里没法确保覆盖
                matches.forEach(function(match, i) {
                    matches[i] = matches[i].replace(/addClass\([\'\"]([^\'\"\s]*\s)?i-/, '');
                });
                wholeProjectIcon = wholeProjectIcon.concat(matches);
            }
            
        }
    });

    wholeProjectIcon = uniqList(wholeProjectIcon);
    var fontOutPath = icon.genarateFonts(settings, wholeProjectIcon);
    
    var ttfPath,
        cssContent;
    if(wholeProjectIcon.length > 0) {
        cssContent = icon.generateCss(wholeProjectIcon, settings);
        // 指定pack，字体的引入才加上cdn前缀
        // 方便dev调试，字体引入跨域问题
        if(opt.pack) {
            ttfPath = settings.ttfCdn + '/' + fontOutPath;
        }
        cssContent = cssContent.replace(/\{\{\$path\}\}/mg, ttfPath);    
    }

    /*
    * 页面页面引入css
     */
    pages.forEach(function(page) {
        var content = page.getContent();
        content = content.replace('</head>', '<style>\r\n' + cssContent + '\r\n</style>\r\n$&');   
        page.setContent(content);
    });



    // 匹配icon
    function getIconMatches (content) {
        var matches = content.match(iconReg);
        if(matches){
            for(var i=0; i<matches.length; i++){
                matches[i] = matches[i].replace(cleanIconReg, '');
            }
        }
        return matches || [];
    }
};