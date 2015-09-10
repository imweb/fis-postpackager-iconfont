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
    isFis3 = fisVersion == 3,
    seperator = isFis3 ? (fis.get('project.md5Connector') || '.')  : '.';

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

// 获取fis config中的信息
// fis3 获取css cdn和ttf cdn
// useHash
// 字体和css cdn前缀
function getFis3ConfigInfo() {
    var globMatches = fis.config.getMatches(),
        globMatch,
        globMatchStr,
        settings = {},
        properties;
    // 根据配置的match获取cdn前缀
    // 就近查找
    for(var i = globMatches.length - 1; i > 0; i--) {
        globMatch = globMatches[i];
        globMatchStr = globMatch.pattern.toString();
        // 有些正则传到glob里面有报错
        if(~globMatchStr.indexOf('css') || ~globMatchStr.indexOf('::image') || ~globMatchStr.indexOf('ttf')) {
            properties = globMatch.properties;
            if(properties.domain) {
                if(_.glob(globMatchStr, '*.css') && !settings.cssCdn) {
                    settings.cssCdn = properties.domain;
                }
                if(_.glob(globMatchStr, '.ttf') && !settings.ttfCdn) {
                    settings.ttfCdn = properties.domain;
                }
            }

            if(properties.useHash) {
                if(_.glob(globMatchStr, '*.css') && !settings.cssHash) {
                    settings.cssHash = properties.useHash;
                } 
                if(_.glob(globMatchStr, '.ttf') && !settings.ttfHash) {
                    settings.ttfHash = properties.useHash;
                } 
            }
        }
    }

    return settings;
}

// 获取fis config中的信息
// fis2 获取css cdn和ttf cdn
// useHash
// 字体和css cdn前缀
function getFis2ConfigInfo() {
    var settings = {};
    var domains = fis.config.get('roadmap.domain');
    for(var key in domains) {
        if (domains.hasOwnProperty(key)) {
            if(_.glob(key, '.css')) {
                settings.cssCdn = domains[key];
            }

            if(_.glob(key, '.ttf')) {
                settings.ttfCdn = domains[key];
            }
        }
    }
    settings.cssHash = true;
    settings.ttfHash = true;
    return settings;
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



module.exports = function (ret, conf, settings, opt) {

    var files = ret.src,
        res = ret.map.res;

    var projectPath = fis.project.getProjectPath(),
        iconPrefix = settings.classPrefix || 'i-',
        iconReg = new RegExp('icon-font\\\s' + iconPrefix + '([a-zA-Z0-9\\\-_]*)', 'mg'),
        cleanIconReg = new RegExp('icon-font\\\s' + iconPrefix, 'g');


    var defaultSvgPath = path.join(path.dirname(__dirname), 'svgs'),
        configSvgPath = settings.svgPath ? path.join(projectPath, settings.svgPath) : '';

    settings.svgPath = configSvgPath || defaultSvgPath;



    // fis.log.info('请确保 svg 已经存在本地，可以存在以下路径：\n\t 1. 插件 fis3-postpackager-iconfont 目录下，不要配置svgPath路径；\n\t 2. 项目目录下，请在插件的 "svgPath" 中进行配置');

    if(!settings.svgPath) {
        fis.log.error('插件 fis3-postpackager-iconfont 中属性 svgPath --- 必须配置（本地svg路径，方便产出字体）！');
    }

    if(!fs.existsSync(configSvgPath) && configSvgPath) {
        fis.log.error('目录 --' + configSvgPath + '-- 不存在, 请不要配置 fis3-postpackager-iconfont 插件的 "svgPath" 属性');
    }

    if(!fs.existsSync(defaultSvgPath) && settings.svgPath === defaultSvgPath) {     
        fis.log.error('插件 fis3-postpackager-iconfont 目录下 svgs 目录不存在 --' + defaultSvgPath + '-- 不存在');
    }

    if(!settings.output) {
        fis.log.error('插件 fis3-postpackager-iconfont 中属性 output --- 必须配置（字体的产出路径）！');
    }

    // console.log(fis.config.media(fis.project.currentMedia())._sortedMatches);

    // 默认的字体文件名是iconfont.ttf
    // 字体文件名没有md5
    // console.log(sources[0].deploy/*.to*/);
    // 可能有多个deploy
    
    var fontOutPath;
    if(isFis3) {
        var sources = _.toArray(files);
        fontOutPath = path.join(projectPath, sources[0].deploy.to || sources[0].deploy[0].to);
    } else {
        fontOutPath = path.join( path.dirname(projectPath), opt.dest);
    }
    
     
    settings.fontsOutput = path.join(fontOutPath, settings.output);

    //  所有svg 的字体文件都生成了，实际上没有必要
    // icon.genarateFonts(settings);

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
            
        } else if (file.isCssLike) {
            // 获取其他css的cdn前缀
            // if(!settings.cssCdn) {
            //     settings.cssCdn = file.domain;
            // }
        }
    });

    
    // settings.cssCdn = settings.cssCdn || cssCdn;
    
    /*
    * 整个项目中的icon
    * font和css中的content都是根据这个数组生成出来的，
    * 数组里面即便有多余的icon（实际不是icon），也能确保css和font对应上
    * css中的content和font中svg对应的key值都是用数据的index生成的，是一致的。
     */ 
    allIconList = uniqList(allIconList);


    settings = _.merge(settings, isFis3 ? getFis3ConfigInfo() : getFis2ConfigInfo());

    settings._seperator = seperator;
    console.log(settings);
    /*
    * 按需生成字体文件
     */
    var fontsFile = icon.genarateFonts(settings, allIconList);

    var cssContent = icon.generateCss(settings, allIconList, settings.pseClass),
        ttfPath;

    ttfPath = settings.ttfCdn + '/' + fontsFile;



    cssContent = cssContent.replace(/\{\{\$path\}\}/mg, ttfPath);

    var cssFileHash = 'font.css';
    // file md5
    if(settings.cssHash) {
        cssFileHash = 'font' + seperator + _.md5(cssContent) + '.css';
    }


    var cssFileUrl = path.join(settings.fontsOutput, cssFileHash);
    fs.writeFileSync(cssFileUrl, cssContent, 'utf-8');



    var file = fis.file(cssFileUrl);
    
    // 外链方式引入
    var inlineCss = '<link rel="stylesheet" type="text/css" href="' + (settings.cssCdn || '.') + '/' + path.join(settings.output, cssFileHash).replace(/\\/g, '/') + '" />\r\n';
    
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
