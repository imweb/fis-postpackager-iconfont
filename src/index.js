/*
* iconfont fis3
* 依赖具体的项目目录结构
* 字体生成到modules/common/fonts目录下面
* 对应的css直接插入到了页面中
* 目前的目录结构
* -src
* -----|lego_modules
* -----|modules
* -----|pages
* ----------|index
* ---------------|main.js
* ----------|test
* ---------------|main.js
* -----partials
* -----index.html
* -----test.html
* -----fis-conf.js
* -----package.json
 */


/*
* 1. 遍历项目下所有的html, tpl, js 文件中的icon
* 2. 生成字体文件
* 3. 生成css文件，
* 4. 所有项目根目录下的html以inline或者link方式引入样式
*
* 每个html文件都引入了项目下的所有icon相关的样式，非按需加载方式
*  cdn 编译
 */
'use strict';

var path = require('path'),
    fs = require('fs'),
    _ = fis.util,
    icon = require('./iconfont.js');

var iconfontTag = new RegExp('<!--ICONFONT_PLACEHOLDER-->');

var fisVersion = fis.version.split('.')[0],
    isFis3 = fisVersion === 3;

// 数组去重
function uniqList(arr) {
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
* 匹配文本中的icon
 */
function getIconMatches (content, iconReg, cleanIconReg) {
    var matches = content.match(iconReg);
    if(matches){
        for(var i=0; i<matches.length; i++){
            matches[i] = matches[i].replace(cleanIconReg, '');
        }
    }
    return matches || [];
}


// ret.pkg生成虚拟文件，产出由fis本身处理
module.exports = function (ret, conf, settings, opt) {

    var files = ret.src,
        res = ret.map.res;

    var projectPath = fis.project.getProjectPath(),
        iconPrefix = settings.classPrefix || 'i-',
        iconReg = new RegExp('icon-font\\\s' + iconPrefix + '([a-zA-Z0-9\\\-_]*)', 'mg'),
        cleanIconReg = new RegExp('icon-font\\\s' + iconPrefix, 'g');

    // svg在插件目录下，安装插件时，就installsvg
    // var defaultSvgPath = path.join(path.dirname(__dirname), 'svgs');
    var configSvgPath = settings.svgPath ? path.join(projectPath, settings.svgPath) : '';

    settings._svgPath = configSvgPath;


    if(!fs.existsSync(configSvgPath)) {
        fis.log.error('目录 --' + configSvgPath + '-- 不存在, 请配置正确的 fis-postpackager-iconfont 插件的 "svgPath" 属性');
    }


    var ignoreLibList = settings.ignore ||  ['zepto', 'badjs', 'mod', 'bj-report', 'tools', 'db'];

    var pages = [],
        ext,
        content,
        eachFileIconList = [],
        allIconList = []; 
        // whole project icon list
    _.map(files, function(subpath, file) {
        ext = _.ext(file.toString());
        content = file.getContent();
        // src 目录下的 html文件
        // ~['.html', '.js', '.tpl']
        // if(~['.html', '.tpl'].indexOf(ext.ext)) {
        if(file.isHtmlLike || ext.ext === '.tpl') {
            // html, tpl, vm
            eachFileIconList = getIconMatches(content, iconReg, cleanIconReg);
            if(eachFileIconList.length > 0) {
                allIconList = allIconList.concat(eachFileIconList);
            }
            
            // 需要添加css的页面
            // 项目根目录下面的html文件，认定为是业务页面，需要添加字体文件
            if(ext.dirname === projectPath ) {
                pages.push(file);
            }
        } else if(file.isJsLike && ~~ignoreLibList.indexOf(ext.filename)) {   
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
                allIconList = allIconList.concat(matches);
            }
            
        } 
    });

    
    
    /*
    * 整个项目中的icon
    * font和css中的content都是根据这个数组生成出来的，
    * 数组里面即便有多余的icon（实际不是icon），也能确保css和font对应上
    * css中的content和font中svg对应的key值都是用数据的index生成的，是一致的。
     */ 
    allIconList = uniqList(allIconList);

    if(isFis3) {
        fis.emit('iconfont:allIcons', allIconList);
    }
    
    /*
    * 按需生成字体文件
     */
    // var fontsFile = icon.genarateFonts(settings, allIconList);

    var fontObj = icon.genarateFonts(settings, allIconList),
        outFontsContent = fontObj.content;

    settings._fontCdn = {};
    // 这种pkg的处理方式有兼容问题，fis2中getUrl没有返回domain

    for(var type in outFontsContent){
        if(outFontsContent.hasOwnProperty(type)) {
            var fontPkg = fis.file(projectPath, fontObj.subpath + '.' + type);
            fontPkg.setContent(outFontsContent[type]);
            if(!isFis3 && opt.dest === 'dev') {
                // dev 模式下 useHash = false
                fontPkg.useHash = false;
            }
            ret.pkg[fontPkg.subpath] = fontPkg;
            // getUrl 参数为了兼容fis2
            settings._fontCdn[type] = fontPkg.getUrl(fontPkg.useHash, fontPkg.useDomain);
        }  
    }

    var cssContent = icon.generateCss(settings, allIconList);

    var cssFileHash = 'font.css';

    cssFileHash = path.join(settings.output, cssFileHash);

    // 这种方式 fis2有问题，dev模式下，useHash 都是true，导致 getUrl有问题
    var cssFile = fis.file(projectPath, cssFileHash);
    cssFile.setContent(cssContent);
    if(!isFis3 && opt.dest === 'dev') {
        // dev 模式下 useHash = false
        cssFile.useHash = false;
    }
    ret.pkg[cssFile.subpath] = cssFile;

    // 外链方式引入
    var inlineCss = '<link rel="stylesheet" type="text/css" href="' + cssFile.getUrl(cssFile.useHash, cssFile.useDomain) + '" />\r\n';
    
    if(settings.cssInline) {
        // inline 方式引入
        inlineCss = '<style>\r\n' + cssContent + '\r\n</style>';
    }


    /*
    * 页面页面引入css
     */
    pages.forEach(function(page) {
        var content = page.getContent();
        if(iconfontTag.test(content)) {
            content = content.replace(iconfontTag, inlineCss);
        } else {
            content = content.replace('</head>', '\t' + inlineCss + '$&');
        }      
        page.setContent(content);
    });
};
