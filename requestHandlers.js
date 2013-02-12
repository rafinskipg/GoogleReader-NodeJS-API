var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable");

function start(response) {
  console.log("Request handler 'start' was called.");

  var body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/upload" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="file" name="upload" multiple="multiple">'+
    '<input type="submit" value="Upload file" />'+
    '</form>'+
    '</body>'+
    '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function upload(response, request) {
  console.log("Request handler 'upload' was called.");

  var form = new formidable.IncomingForm();
  console.log("about to parse");
  form.parse(request, function(error, fields, files) {
    console.log("parsing done");

    /* Possible error on Windows systems:
       tried to rename to an already existing file */
    fs.rename(files.upload.path, "/tmp/test.png", function(err) {
      if (err) {
        fs.unlink("/tmp/test.png");
        fs.rename(files.upload.path, "/tmp/test.png");
      }
    });
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("received image:<br/>");
    response.write("<img src='/show' />");
    response.end();
  });
}

function show(response) {
  console.log("Request handler 'show' was called.");
  fs.readFile("/tmp/test.png", "binary", function(error, file) {
    if(error) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(error + "\n");
      response.end();
    } else {
      response.writeHead(200, {"Content-Type": "image/png"});
      response.write(file, "binary");
      response.end();
    }
  });
}

var greader = require("./google-reader")

function login(response){
	console.log("Request handler 'LOGIN' was called.");
	
	console.log(greader.googleReaderApi);
	if(greader.reader.hasAuth() == true){
		var token = greader.reader.getToken();
	}else{
		greader.reader.login('rafinskipg@gmail.com', 'kulunguelele69', successCallback, failCallback);
	}
	
	response.writeHead(200, {"Content-Type": "text/html"});
    
    response.end();
}


function successCallback(){
	console.log('OK LOGIN ---------------');
	greader.reader.loadFeeds(printFeeds);
}
function failCallback(){
	console.log(' LOGIN ---------------');
}
function printFeeds(feeds){
 putaMADRE = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+ feeds+
    '<body>'+
    '<form action="/upload" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="file" name="upload" multiple="multiple">'+
    '<input type="submit" value="Upload file" />'+
    '</form>'+
    '</body>'+
    '</html>';

    return putaMADRE;
}
var putaMADRE= '';
function feeds(response){
	console.log("Request handler 'getFeeds' was called.");
	
	console.log(greader.googleReaderApi);
	if(greader.reader.hasAuth() == true){
		var token = greader.reader.getToken();
	}else{
		 greader.reader.login( 'xxx@gmail.com', 'xxxx', successCallback, failCallback);
		
		//var body = greader.reader.loadFeeds(printFeeds);
		
		//
	}
	
	response.writeHead(200, {"Content-Type": "text/html"});
	//response.write(JSON.stringify(body));
	response.write('no');
	response.end();
    
}
exports.feeds = feeds;
exports.login = login;
exports.start = start;
exports.upload = upload;
exports.show = show;