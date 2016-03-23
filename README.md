# fis-postpackager-iconfont
**兼容fis3**



### 安装
```
npm install fis-postpackager-iconfont -g

```


### 背景

项目中使用iconfont时，需要将 SVG 转化成 font 字体文件，同时解决字体css的引入的问题，整个流程比较繁琐。


### 目标
在 html 标签上挂载和 svg 同名（或者有映射关系）的类名，构建解决：
+ SVG 转化 字体文件
+ css 的引入问题
通过上面的方式，可以使`iconfont 的使用对开发透明` 。
最终生成的字体存放在一个可配置的目录下，同时字体的css引入直接插入到html中, 在html中使用 `<!--ICONFONT_PLACEHOLDER-->`，占位符指明最终css的插入位置，如未执行，则会插入在  `</head>之前`

### 使用方式

```
// settings
postpackager: fis.plugin('iconfont', {
    //可选，遍历js时，可以忽略的基础库
    ignore: ['zepto', 'badjs', 'mod', 'bj-report', 'tools', 'db.js'],
    //可选，匹配的icon前缀，即类名是i-xxx, optional, 默认是 i-
    classPrefix: 'i-',
    // 本地svg路径，方便生成字体文件，这里可以使用脚本同步iconfont平台上的svg
    // 默认指向 fis3-postpackager-iconfont 安装目录下的svgs文件夹
    //（安装插件是，自动执行脚本，同步iconfont.imweb.io平台上的svg文件）,
    // 若fis3-postpackager-iconfont安装目录下的svgs目录中有svg，这里可以不需要配置；
    // 否者，需要手动同步svg到项目目录，然后配置svgPath
    svgPath: '../svgs',
    // 必须，字体的产出路径
    output: 'modules/common/fonts',
    //可选， css 是否inline到页面, 默认已link方式引入
    cssInline: true,
    //可选， 字体content使用的伪类，只能填after或者before，默认为after
    pseClass: 'before', 
    // h5里面可以将ttf文件base64引入
    base64: false,
    ignoreSrc: [], // glob 表达式，指定哪些文件不需要遍历，在引用组件时，有可能组件本身已经处理了iconfont。
	nonBaseCss: true // 不导入iconfont基础css样式，默认值为false，一般不需要设置
})

// 最简配置
postpackager: fis.plugin('iconfont', {
    svgPath: '../svgs',
    output: 'modules/common/fonts'
})

```

##### fis2 配置
```
fis.config.merge({
    modules: {
        postpackager: ['iconfont']
    }
});
fis.config.merge({
    settings: {
        postpackager: {
            iconfont: {
                // 配置同上
               output: 'modules/common/fonts' 
            }
        }
    }
});
```



