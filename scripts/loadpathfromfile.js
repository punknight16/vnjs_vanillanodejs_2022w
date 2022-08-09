var fs = require('fs');

exports.loadpathfromfile = (routePath, url, method)=>{
	const routes_str = fs.readFileSync(routePath, "utf8")
	const routes_obj = JSON.parse(routes_str);
	if(!routes_obj.hasOwnProperty(method.toLowerCase()) ||
		!routes_obj[method.toLowerCase()].hasOwnProperty(url.toLowerCase())){
		return '.'+url;
	} else {
		return routes_obj[method.toLowerCase()][url.toLowerCase()].assetPath;
	}
}
	
