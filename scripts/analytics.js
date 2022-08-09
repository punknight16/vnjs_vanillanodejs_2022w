var fs = require('fs');


exports.startAnalytics = function (dirPath, cb){
    var d = new Date().toISOString();
    var filename = `${d.slice(0,4)}${d.slice(5,7)}${d.slice(8,10)}-${d.slice(11,13)}${d.slice(14,16)}${d.slice(17,19)}.json`;
    let eventObj = {
        "date": new Date().toLocaleString(),
        "event": "bootup"
    };
    const filepath = dirPath + filename;
    const flat_str = `[${JSON.stringify(eventObj)},`;
    fs.writeFile(filepath, flat_str, (err, data)=>{
	console.log("analytics filepath created: ");
	return cb(null, filepath)
    })
}

exports.generatePageView = function(currentFile, ip, url, agent, method){
    let eventObj = {
        "date": new Date().toLocaleString(),
        "event": "pageview",
	"url": url,
	"ip": ip,
	"agent": agent,
	"method": method
    };
    var logStream = fs.createWriteStream(currentFile, {encoding: 'utf8', flags: 'a'});
    logStream.write(JSON.stringify(eventObj));
    logStream.end();
}

