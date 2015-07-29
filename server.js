
// Lets host our site using node and express
var express = require('express');

var server = express();
server.use(express.static(__dirname+ '/public'));  // this just makes all our content servable - use sub folders if you need more control

var port = process.env.PORT || 1337
server.listen(port, function () {
    console.log('server listening on port ' + port);
});