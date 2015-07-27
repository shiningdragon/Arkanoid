
// Lets host our site using node and express
var express = require('express');

var server = express();
server.use(express.static(__dirname));  // this just makes all our content servable - use sub folders if you need more control

var port = 80;
server.listen(port, function () {
    console.log('server listening on port ' + port);
});