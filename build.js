
/*
*  本文件只做内部使用，它用无效，主要同步svg文件到本地
 */
var step = require('step'),
    http = require('http'),
    fs = require('fs'),
    path = require('path'),
    AdmZip = require('adm-zip');

// proxy
var svgOptions = {
    host: 'proxy.tencent.com',
    port: '8080',
    path: 'http://iconfont.imweb.io/download/$svgs',
    method: 'GET'
};

var svgPath = './svgs/';

function getSvgs(flag) {
    var data = [],
        dataLen = 0;
    var req = http.request(svgOptions, function (res) {

        res.on('data', function (chunk) {
            // chunk is buffer
            // The idea is to create an array of buffers and concatenate them into a new one
            // at the end. This is due to the fact that buffers cannot be resized.
            data.push(chunk);
            dataLen += chunk.length;
        });

        res.on('end', function () {
            var buf = new Buffer(dataLen);
            // 形成一个完整的buffer对象
            for (var i = 0, len = data.length, pos = 0; i < len; i++) {
                data[i].copy(buf, pos);
                pos += data[i].length;
            }
            var zip = new AdmZip(buf);
            if(!fs.existsSync(svgPath)) {
                fs.mkdirSync(svgPath);
            }
            zip.extractAllTo(svgPath, true);
        });

        // download error
        req.on('error', function() {
            process.stdout.write('\n ' + '[WARNI]'.yellow + '同步iconfont.imweb.io平台svg出错，请手动同步\n'); 
        });
    });
    req.end();
}


step(getSvgs, function(err) {
    process.exit( error ? 1 : 0 );
})


