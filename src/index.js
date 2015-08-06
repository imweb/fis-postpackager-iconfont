/*
* http://fis.baidu.com
 */
'use strict';

var path = require('path'),
    fs = require('fs'),
    icon = require('./iconfont.js');

module.exports = function (ret, conf, settings) {

    var projectPath = fis.project.getProjectPath(),
        iconPrefix = settings.classPrefix,
        iconReg = new RegExp('[\\\s\\\'\\\"]' + iconPrefix + '([a-zA-Z0-9\\\-_]*)', 'mg'),
        cleanIconReg = new RegExp('[\\\s\\\'\\\"]' + iconPrefix, 'g');
    // 遍历svg，生成字体文件
    icon.genarateFonts(settings);


    // html 所有 tpl 依赖项分析
    fis.util.map(ret.src, function (subpath, file) {

        var fileName = path.basename(file.toString());
        if(/*path.extname(fileName) === '.html'*/fileName.indexOf('index.html') > -1){
            fileName = path.basename(fileName, '.html');
            var asyncList = file.extras && file.extras.async || [];
            var pageDepMap = {};
            var libDict = {},
                ignoreDict = {};
            (settings.libs || []).forEach(function(lib){
                libDict[lib] = true;
            });

            (settings.ignores || []).forEach(function(ignore){
                ignoreDict[ignore] = true;
            });
            var opts = {
                libs: libDict,
                ignores: ignoreDict
            };

            asyncList.forEach(function(asyncId){
                if(!opts.libs[asyncId]){
                    if(!pageDepMap[asyncId]){
                        pageDepMap[asyncId] = calFileDepsFromId(asyncId, opts);
                    }
                }
            });

            var tplDeps = getTplAndJsFromHtml(pageDepMap),
                tplList = [],
                jsList = [];
            for(var i in tplDeps){
                tplList = tplList.concat(tplDeps[i].tpl || []);
                jsList = jsList.concat(tplDeps[i].js || []);
            }
            
            tplList = uniqList(tplList);
            jsList = uniqList(jsList);

            var iconList = getIconFromHtmlAndDepTpl(file, tplList),
                jsIconList = getIconFromJs(jsList),
                content = file.getContent();

            iconList = iconList.concat(jsIconList);
            iconList = uniqList(iconList);

            if(iconList.length > 0) {
                var cssContent = icon.generateCss(iconList, settings.pseClass);
                cssContent = cssContent.replace('{{$path}}', settings.ttfCdn + '/' + settings.output + '.ttf');
                content = content.replace('</head>', '<style>\r\n' + cssContent + '\r\n</style>\r\n$&');
                file.setContent(content);
            }
        }
    });

    // 处理文件依赖
    function calFileDepsFromId(id, opts){
        var pageRes = {};
        var queue = [id], deps = {}, asyncDeps = [],
            cssDeps = {};
        while(queue.length){
            var curId = queue.pop();
            if(pageRes[curId]){
                continue;
            }
            if(!ret.ids[curId]){
                !opts.ignores[curId] && fis.log.notice(curId + ' is not exists!');
                continue;
            }
            var curFile = ret.ids[curId];
            if(curFile.isCssLike){
                // todo handle css
                cssDeps[curId] = curFile;
                continue;
            }
            if(!curFile.isJsLike){
                continue;
            }
            deps[curId] = curFile;
            if(curFile.requires && curFile.requires.length){
                curFile.requires.forEach(function(depId){
                    if(depId!=curId && !deps[depId]){
                        queue.unshift(depId);
                    }
                });
            }
            if(curFile.extras && curFile.extras.async && curFile.extras.async.length){
                curFile.extras.async.forEach(function(asyncDepId){
                    if(asyncDepId!=curId && !deps[asyncDepId] && !asyncDeps[asyncDepId]){
                        var asyncFile = ret.ids[asyncDepId];

                        if(!asyncFile){
                            !opts.ignores[asyncDepId] && fis.log.notice(asyncDepId + ' is not exists!');
                            return;
                        }
                        asyncDeps.push(asyncDepId);
                        if(asyncFile.requires && asyncFile.requires.length){
                            asyncFile.requires.forEach(function(asyncDepId) {
                                var asyncDepFile = ret.ids[asyncDepId];
                                if(!asyncDepFile){
                                    !opts.ignores[asyncDepId] && fis.log.notice(asyncDepId + ' is not exists!');
                                    return;
                                }
                                //console.log(asyncDepId, asyncDepFile);
                                if (asyncDepFile.isCssLike) {
                                    cssDeps[asyncDepId] = asyncDepFile;
                                }
                                if (asyncDepFile.isJsLike) {
                                    asyncDeps.push(asyncDepId);
                                }
                            });
                        }
                    }
                });
            }
        }
        return {deps: deps, cssDeps: cssDeps, asyncDeps: asyncDeps};
    }

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

    // 匹配icon
    function getIconMatches (content) {
        var matches = content.match(iconReg);
        // var matches = content.match(/[\s\'\"]i-([^\s\'\"]*)/g);
        if(matches){
            for(var i=0; i<matches.length; i++){
                matches[i] = matches[i].replace(cleanIconReg, '');
            }
        }
        return matches;
    }
    
    // 从html文件及依赖的tpl中正则匹配icon
    function getIconFromHtmlAndDepTpl(file, depTpls) {
        var htmlContent = file.getContent(),
            tplFileName,
            tplFile,
            tplFileContent,
            matches,
            filePath,
            iconList = [];

        matches = getIconMatches(htmlContent);
        if(matches) {
            iconList = iconList.concat(matches);
        }
        

        for(var k=0,len=depTpls.length; k<len; k++) {
            tplFileName = depTpls[k];
            filePath = path.join(projectPath, 'modules', tplFileName);
            tplFile = fis.file.wrap(filePath);
            tplFileContent = tplFile.getContent();
            matches = getIconMatches(tplFileContent);
            if(matches) {
                iconList = iconList.concat(matches);
            }
        }
        return iconList;
    }


    // 获取 js 文件中的 iconfont 图标引用
    // 可以直接放弃基础库的查找
    function getIconFromJs(jsDeps) {
        var jsFileName,
            jsFile,
            jsFileContent,
            matches,
            jsFilePath,
            iconList = [];

        for(var k=0,len=jsDeps.length; k<len; k++) {
            jsFileName = jsDeps[k] + '.js';
            jsFilePath = path.join(projectPath, 'modules', jsFileName);
            if(!fs.existsSync(jsFilePath)) {
                jsFilePath = path.join(projectPath, 'modules', jsDeps[k], path.basename(jsFileName));
            }
            jsFile = fis.file.wrap(jsFilePath);
            jsFileContent = jsFile.getContent();
            matches = getIconMatches(jsFileContent);
            if(matches) {
                iconList = iconList.concat(matches);
            }
        }

        return iconList;
    }

    // 计算html依赖项目的tpl模版文件
    // 依赖的 js 也要处理
    function getTplAndJsFromHtml(deps) {
        var _deps,
            fileDeps,
            fileAsyncDeps,
            singleTplDeps = [],
            singleJsDeps = [],
            tplDepMaps = {};

        for(var fileName in deps) {  
            _deps = deps[fileName];
            fileDeps = _deps.deps;
            fileAsyncDeps = _deps.asyncDeps;

            // 这里分析出来的是 xxx.js 和 xxx.async.js
            
            tplDepMaps[fileName] = {};
            tplDepMaps[fileName].tpl = [];
            tplDepMaps[fileName].js = [];
            for(var fileDep in fileDeps){
                if(path.extname(fileDep) == '.tpl'){
                    singleTplDeps.push(fileDep);
                }else if(path.extname(fileDep) != '.scss') {
                    singleJsDeps.push(fileDep);
                }
            }  
            if(singleTplDeps.length > 0) {
                tplDepMaps[fileName].tpl = tplDepMaps[fileName].tpl.concat(singleTplDeps);
            }
            if(singleJsDeps.length > 0) {
                tplDepMaps[fileName].js = tplDepMaps[fileName].js.concat(singleJsDeps);
            }

            tplDepMaps[fileName].tpl = uniqList(tplDepMaps[fileName].tpl);
            tplDepMaps[fileName].js = uniqList(tplDepMaps[fileName].js);
        }
        return tplDepMaps;
    }
};