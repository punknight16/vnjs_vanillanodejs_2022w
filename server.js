var http = require('http');
var fs = require('fs');
var path = require('path');
var util = require('util');
var qs = require('querystring');
var EventEmitter = require('events');
const analyticsEmitter = new EventEmitter(); 
const postEmitter = new EventEmitter();

const { routePath, analyticsDir, MaxFileSize } = require('./config');
const { loadpathfromfile, loadscriptfromfile } = require('./scripts/loadpathfromfile');
const { startAnalytics, generatePageView } = require('./scripts/analytics');

let currentAnalyticsFile;
analyticsEmitter.on('start', (analyticsFile)=>{
	console.log("new Analytics file: ", analyticsFile);
        currentAnalyticsFile = analyticsFile;
});


var server = http.createServer().listen(8888, ()=>{
    console.log('Server running at http://127.0.0.1:8888/');
    startAnalytics(analyticsDir, (err, analyticsFile)=>{
	analyticsEmitter.emit("start", analyticsFile);
    });
});

 
server.on("request", (request, response)=>{
    //console.log(util.inspect(request));
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    console.log("ip :", ip);
    console.log("url: ", request.url);
    console.log("headers: ", request.headers);
    
     (function generateAnalytics(currentAnalyticsFile, ip, url, agent, method){
 	fs.stat(currentAnalyticsFile, (err, stats)=>{
	    if(stats.size > MaxFileSize){
    		startAnalytics(analyticsDir, (err, analyticsFile)=>{
		    analyticsEmitter.emit("start", analyticsFile);
		    generatePageView(currentAnalyticsFile, ip, url, agent, method);
     		});
	    } else {
	 	generatePageView(currentAnalyticsFile, ip, url, agent, method);
	    }
	});
    })(currentAnalyticsFile, ip, request.url, request.headers['user-agent'], request.method);

    const parsePostReq = (req, cb)=>{
	var body = '';
	req.setEncoding('utf8');
	req.on('data', function(chunk){body += chunk});
	req.on('end', function(){
	    var postData = qs.parse(body);
	    cb(postData);
	});
    }

    let filePath = (function getFilePath(url, method){ 
    	let assetPath = './assets' + url;
   	if (url == '/') {
   	    assetPath = './pages/index.html';
    	} else if (String(path.extname(assetPath)).toLowerCase() ==".html"){
		assetPath = './pages'+url;
	} else if (path.extname(assetPath)=="") {
	    assetPath = loadpathfromfile(routePath, url, method);
	}  
	return assetPath;
    })(request.url, request.method);
    

    const executeMiddleware = (req, cb)=>{ 
	const scriptPath = loadscriptfromfile(routePath, req.url, req.method);
	parsePostReq(req, (postData)=>{
	    require(scriptPath)(postData, (dataObj)=>{ 
		cb(dataObj);
	    });
	}); 
    } 
		
    var extname = String(path.extname(filePath)).toLowerCase();
    var mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    var contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath,'utf8', function(error, content) {
        if (error) {
            if(error.code == 'ENOENT') {
                fs.readFile('./pages/404.html', function(error, content) {
                    response.writeHead(404, { 'Content-Type': 'text/html' });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        }
        else {
	    executeMiddleware(request, (dataObj)=>{
		var mustache_tags =  content.match(/{{\s*[\w\.]+\s*}}/g);
		if(mustache_tags && mustache_tags.length > 0){
		    var dataObj_keys = mustache_tags.map(function(x) { return x.match(/[\w\.]+/)[0]; });
		    mustache_tags.map((el, index)=>{
			content = content.replace(el, dataObj[dataObj_keys[index]]);
		    });
		}
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
	    });
        }
    });
})
