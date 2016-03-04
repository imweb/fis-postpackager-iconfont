/*
* iconfont test case
* author: helondeng
 */
var fs = require('fs'),
    path = require('path'),
    fis = require('fis3'),
    _ = fis.util,
    expect = require('chai').expect,
    _release = fis.require('command-release/lib/release.js'),
    _deploy = fis.require('command-release/lib/deploy.js'),
    iconfont = require('../src/');

var dev,
    dist;

function release(opts, cb) {
    opts = opts || {};

    _release(opts, function(error, info) {
        _deploy(info, cb);
    });
}


function setFisConfig(iconfont, deploy) {
    var iconConf = _.merge({
            // 遍历js时，可以忽略的基础库
            ignore: ['zepto', 'badjs', 'mod', 'bj-report', 'tools', 'db.js'],
            // 匹配的icon前缀，即类名是i-xxx
            classPrefix: 'i-',
            // 本地svg路径，方便生成字体文件，这里可以使用脚本同步iconfont平台上的svg
            svgPath: '../svgs',
            // 字体的产出路径
            output: 'modules/common/fonts',
            ignoreSrc: [
            '!/lego_modules/**'
            ],
            pseClass: 'before' // 伪类名
        }, iconfont || {}),
        deployConf = deploy;

    fis.match('**.{css,scss}', {
            domain: 'http://7.url.cn/icon'
        })
        .match('::image', {
            domain: 'http://9.url.cn/image'
        })
        .match('::package', {
            postpackager: wrapper(iconConf)
        })
        .match('*', {
            deploy: fis.plugin('local-deliver', deployConf)
        });
}

function wrapper(options) {
    return function(ret, pack, settings, opt) {
        // settings = _.assign({}, iconfont.defaultOptions);
        _.assign(settings, options);
        return iconfont.call(this, ret, pack, settings, opt);
    }
}

describe('fis-postpackager-iconfont', function() {
    var root = path.join(__dirname, 'src');

    fis.project.setProjectRoot(root);

    beforeEach(function() {
        dev = path.join(__dirname, 'dev');
        _.del(dev);

        dist = path.join(__dirname, 'dist');
        _.del(dist);

    });

    it('iconfont:link', function() {

        setFisConfig({}, {
            to: dev
        });

        // icon 数量
        fis.on('iconfont:allIcons', function(allIcons) {
            expect(allIcons.length).to.equal(3);
        });

        release({
            unique: true
        }, function() {
            // 文件是否生成
            expect(fs.existsSync(path.join(dev, 'modules/common/fonts', 'font.css'))).to.be.true;
            expect(fs.existsSync(path.join(dev, 'modules/common/fonts', 'iconfont.eot'))).to.be.true;
            expect(fs.existsSync(path.join(dev, 'modules/common/fonts', 'iconfont.svg'))).to.be.true;
            expect(fs.existsSync(path.join(dev, 'modules/common/fonts', 'iconfont.ttf'))).to.be.true;
            expect(fs.existsSync(path.join(dev, 'modules/common/fonts', 'iconfont.woff'))).to.be.true;

            // html中是否引入css
            expect(fs.readFileSync(path.join(dev, 'index.html')).toString().indexOf('http://7.url.cn/icon/modules/common/fonts/font.css') > -1).to.be.true;

            // css中是否生成字体
            var cssFileContent = fs.readFileSync(path.join(dev, 'modules/common/fonts', 'font.css')).toString();
            ['add', 'alert', 'back'].forEach(function(icon) {
                expect(cssFileContent.indexOf('i-' + icon + ':before') > -1).to.be.true;
            });

            console.log('css link');
        });
    });

    it('iconfont:inline', function() {
        setFisConfig({
            cssInline: true
        }, {
            to: dist
        });

        // icon 数量
        fis.on('iconfont:allIcons', function(allIcons) {
            expect(allIcons.length).to.equal(3);
        });

        release({
            unique: true
        }, function() {
            // 文件是否生成
            expect(fs.existsSync(path.join(dist, 'modules/common/fonts', 'font.css'))).to.be.true;
            expect(fs.existsSync(path.join(dist, 'modules/common/fonts', 'iconfont.eot'))).to.be.true;
            expect(fs.existsSync(path.join(dist, 'modules/common/fonts', 'iconfont.svg'))).to.be.true;
            expect(fs.existsSync(path.join(dist, 'modules/common/fonts', 'iconfont.ttf'))).to.be.true;
            expect(fs.existsSync(path.join(dist, 'modules/common/fonts', 'iconfont.woff'))).to.be.true;

            // html 内嵌字体样式
            var htmlFileContent = fs.readFileSync(path.join(dist, 'index.html')).toString();
            ['add', 'alert', 'back'].forEach(function(icon) {
                expect(htmlFileContent.indexOf('i-' + icon + ':before') > -1).to.be.true;
            });

            console.log('css inline');
        });
    });
});
