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
    logger.info(bucket+'/'+key);
    const params = {
        Bucket: bucket,
        Key: key
    };

    s3.getObject(params)
        .on('httpHeaders', function (statusCode, headers) {
            console.log(headers);
            res.set('Content-Length', headers['content-length']);
            res.set('Content-Type', headers['content-type']);
            this.response.httpResponse.createUnbufferedStream()
                .pipe(res);
        })
        .send();

});

module.exports = router;
