# fis-postpackager-iconfont
参考[fis-preprocessor-iconfont](https://github.com/haledeng/fis-preprocessor-iconfont)。

fis-preprocessor-iconfont 只是简单将所有字体的content相关的css放入到每个css文件中，本构建要处理`按需加载，即页面引用了哪些icon，引入相应的css content`。

### 安装
```
npm install -g fis-postpackager-iconfont
```


### 背景

项目中使用iconfont时，需要先用工具将 SVG 转化成 font 字体文件，同时解决引入的问题，整个流程比较繁琐。


### 目标
在 html 标签上挂载和 svg 同名（或者有映射关系）的类名，构建解决：
+ SVG 转化 字体文件
+ css 的引入问题
通过上面的方式，可以使`iconfont 的使用对开发透明` 。

### 使用方式
fis-conf.js 配置
```
// settings
'iconfont': {
    libs: ['zepto', 'common', 'qqapi'],
    ignores: ['tvp'],
    classPrefix: 'i-',
    svgPath: '../svg',
    output: 'fonts/iconfont',
    ttfCdn: 'http://' + projConf.cdnRoot.img + '/' + projConf.subPath
}
```



