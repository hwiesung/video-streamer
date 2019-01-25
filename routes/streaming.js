var express = require('express');
var router = express.Router();
var logger = require('../common/logger');
/* GET users listing. */
var config = require('config');
const retCode = require('../common/retCode');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: config.awsKey.access_key_id,
    secretAccessKey: config.awsKey.secret_access_key,
    region:'ap-northeast-2'
});

router.get('/:bucket/:key', function(req, res) {
    let bucket = req.params.bucket;
    let key = req.params.key;
    //console.log(req.headers);
    logger.info(bucket+'/'+key);
    const params = {
        Bucket: bucket,
        Key: key
    };

    s3.waitFor('objectExists', params, function(err, data) {
        if (err){
            console.log(err, err.stack); // an error occurred
            res.send(JSON.stringify({ret_code:retCode.NOT_EXIST_FILE, msg:'There is no file.'}));
            throw 'error'
        }

        const contentType = data.ContentType;
        const contentLength = data.ContentLength;
        const range = req.headers.range;

        console.log(range);

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : contentLength-1;
            const chunkSize = (end-start)+1;
            const header = {
                'Content-Range': `bytes ${start}-${end}/${contentLength}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, header);

            params.Range = range;
            s3.getObject(params).createReadStream().pipe(res);
        }
        else{
            const header = {
                'Content-Length': contentLength,
                'Content-Type': contentType,
            };
            
            res.set(header);
            res.send(200);
            //res.writeHead(200, header);
            //s3.getObject(params).createReadStream().pipe(res);
        }
    });
});

module.exports = router;
