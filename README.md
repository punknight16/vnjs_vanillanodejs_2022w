# Vanilla NodeJS: A simple nodejs server that does not use NPM or Express
## Part I: Create Server

I'm really annoyed that I need to use the express.js framework to get any basic functionality in node.js. I really wish there was a simple tutorial out there that explained how powerful node.js was all on its own. I looked around briefly and found this article, but that was it. The server works out of the box, but there is no routing, no template engine, and no ability to handle POST requests. 

I reviewed some posts on stack overflow as to why everyone uses express.js, and the basic response was that it is beginner friendly. I find this to be a horrific answer because “beginners” are required to download a ton of packages to get any basic functionality. They don’t know what is going on, so they won’t be be able to troubleshoot when the server doesn’t work. 

I am starting this series to solve that problem. I want to build a simple NodeJS webserver that allows you to build on top of the clearly written, simple code without having to download any packages. If anything breaks, the file with the bad code will be clearly labeled, so when node.js throws the error, we will know exactly what subsystem is the problem.

So with this first article, I take the solid server that was created by someone else, and make some small modifications, so it can be built on. To get the initial server working we are just going to create the README.md, index.html, 1.html, server.js, and git files. Then, deploy those files to a self-hosted server. 
Once the server is up and running, “Deployment” is complete, and we can start thinking about “Maintaining”. To make the code maintainable, we refactor only in order to be able to add additional functions in outside scripts. The idea is that I picked this  First, this means breaking up code that is performing multiple tasks, so each block of code only performs one task. Second, this means adding wrappers around some native NodeJS functions, so additional functionality can be added without breaking the flow of the application.

Let’s get started…

Here is the initial server.js file:
```
var http = require('http');
var fs = require('fs');
var path = require('path');

http.createServer(function (request, response) {
    console.log('request ', request.url);

    var filePath = '.' + request.url;
    if (filePath == './') {
        filePath = './index.html';
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

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT') {
                fs.readFile('./404.html', function(error, content) {
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
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(8888);
console.log('Server running at http://127.0.0.1:8888/');

```

And here is the initial index.html file:
```
<html>
<head>
	<title>Vanilla NodeJS</title>
	<meta charset=“utf-8” />
	<link rel=“stylesheet” href=“styles.css”>
</head>
<body>
        <header><h1>Vanilla NodeJS</h1></header>
		<nav><ul>
			<li><a href=“./“>home</a></li>
			<li><a href=“./1.html”>part 1: deploy</a></li>
		</ul></nav>
		<hr />
		<main>
			<br /><br /><br /><br />
			<article>
				<p>Synopsis of part 1</p>
				<a href=“./1.html”>Link to article</a>
			</article>
			<br /><br /><br /><br />
		</main>
		<hr />
		<footer>
			<p>Send me a 
			<a href=“https://twitter.com”>tweet<a/>.
			</p>
		</footer>
</body>
</html>
```
You can also create one last html file just titled 1.html with a hello world in it, so all of the links work. 

### Deploying

Now that the files are made, I test the server on my local machine using “server node.js&” and then curl the server. Then I check the render and links using my local browser. Once it looks good, I’m ready to deploy.

I ssh into my Synology NAS and type “ps -aux” to see what processes I am already running. Some other useful commands include “uname -a”, “whoami”, and “pwd”, to fully understand the layout of the land. I head to the root directory and then “cat /etc/passw” to find out which users are available on my machine. I think it is good practice to create a user with less permissions and then run the server using that user. The “su” command should allow you to switch users, but for the life of me I can’t get it to work on the Synology so I have been using “sudo -u <user> <cmd>” instead.

I also set up a reverse proxy server to point to the process 8888. If you are running on a pi, this is done with nginx. I am using my Synology, which comes with a fancy ui that gives access to a built-in reverse proxy that I configured with some help from a YouTube video. After looking at the processes running in the shell, it seems like it also is an nginx server, but I’m not messing with it outside the ui.

### Refactoring and Maintaining
That was the first deploy, and it should work. Now, let’s refactor a little bit.
Setup a new git branch called dev with `branch dev` and `git checkout dev` or the simpler command `git checkout -b dev`.
We will change the structure of the server.js file just a little bit. Replace the http.createServer line with the following code, and delete the .listen and console.log at the end of the file.
```
var util = require('util');
var server = http.createServer().listen(8888, ()=>{
        console.log('Server running at http://127.0.0.1:8888/');
});

server.on("request", (request, response)=>{
    //console.log(util.inspect(request));
    //request.connection shows tcp connection
    console.log('ip: ', request.headers['x-forwarded-for'] || request.socket.remoteAddress);
    console.log('request ', request.url);
    console.log('headers ', request.headers);
```
Just changing this code at the top of the file does a few things. It breaks up the tasks of instantiating the server and event listening into two separate code blocks. I also added the util module to show how it can be useful for inspecting circular objects. The commented out console.log can be used to see what attributes are in the request object. I used this tool to find attributes that held the ip address of the incoming user and the headers.
I test this out on my local machine, and then perform a git commit and merge to master. My local machine isn’t running a reverse proxy, but the production machine is, so the IP address should come from the remoteAddress, but the remoteAddress will always be the reverse proxy. I added the headers code to show the IP address forwarded from the reverse proxy through the headers.

Then I create a new git branch called prod and re-deploy the app. The prod branch is super stable and only gets updated once a week from here on out. From here, our dev story is done, and we can destroy that branch with “git branch -d dev”. Our next dev branch will be created from the most up to date master, just like before. Dev is for me to play around with, and master is the most up-to-date source of truth.

A typical week may have 7 to 14 dev commits, 5-7 ‘git merge dev’ while on master, and 1 ‘git merge master’, while on prod.
One last, difficulty in Synology is that they kill processes on logout. To get them to not kill the process type “sudo -u <user> node server.js &”. This will output the terminal to a specific file called output.nohup as well. 

One last thing, when you are killing a "nohup" process that was created with sudo, you need to look into all processes and kill the route processes that are running nohup before restarting the server. This is a simple `ps -aux` to find the right process, and `kill -9 <pid>` to kill the process. If you are having trouble finding the process consider using piping with the grep command. Som

## Part II. Routing

If we look at the next part of the server.js file, it is a very basic router. It takes the request.url string and creates a filePath string.
```
var filePath = '.' + request.url;
    if (filePath == './') {
        filePath = './index.html';
    }
```
 We can refactor this code into a function: filePath = getfilepath(req), but the code is very clear as is, so I don’t necessarily want to destroy that code entirely in the refactor. If I modify it, we should still be able to understand what is happening. I think it makes sense here to put a self invoking function wrapper around the code.
```
	let filePath = (function getPath(req){
        let assetPath = '.' + req.url;
        if (assetPath == './') {
             assetPath = './index.html';
        }
        return assetPath;
    })(request.url);
```
 Here, we aren’t changing the code at all. We just wrapped a function call around the logic, and gave it a name. I think most people that understood the first block will also understand this block of code. Additionally, because it is separated out, we can add an else if statement with another function call.
```
let filePath = (function getFilePath(url, method){
        let assetPath = '.' + url;
        if (assetPath == './') {
            assetPath = './index.html';
        } else if (path.extname(assetPath)=="") {
            assetPath = loadpathfromfile(routePath, url, method);
        }
        return assetPath;
    })(request.url, request.method); 

```
Here, we added the method parameter because people can make “post” requests as well as “get” requests. This will eventually lead into running a script in association with the http request. Additionally, there is a little logic associated with additional routes such as the ./test route. The function call “loadpathfromfile” simply makes a syncronous call to a JSON file, and finds the route dynamically rather than having the route built in with an if statement.
```
var fs = require('fs');

exports.loadpathfromfile = (routePath, url, method)=>{
        const routes_str = fs.readFileSync(routePath, "utf8")
        const routes_obj = JSON.parse(routes_str);
        return routes_obj[method.toLowerCase()][url.toLowerCase()].assetPath;
}
```
The only other thing that I really want to do before ending this article is clean up the pages a little bit. We can set any assets with an extension already in the name to an /assets/ folder, and we can set all of the .html files to a pages/ folder, and then everything is just significantly cleaned up. 
```
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
        console.log("filePath: ", filePath);
``` 
To make sure everything is working well, create a styles.css file in the assets folder, and update index.html to correctly request the styles.css file. Then open the index.html file in the browser using the http address: http://localhost:8888 or whatever your domain name is.
## Part III: Testing

### Unit Testing
It is good practice to get in the habit of writing code using Test Driven Development. That means before writing code, write out what you want your function to do, then write a unit test to see if your function will return the thing you expect. I do this all the time for c, but javascript programmers are a little more lax. Let's write a very simple unit test for `getAnalytics`. We want to give a function an object of keys that we want to groupBy, and then count the number of objects that meet those parameters.

So our test might look something like this:

```
const { getAnalytics } = require('./scripts/analytics');

var analyticsData = [
	{"ip": "192.167.1.1", "agent": "curl", "url": "/"},
	{"ip": "192.167.1.2", "agent": "firefox", "url": "/"},
	{"ip": "192.167.1.3", "agent": "firefox", "url": "/test"},
	{"ip": "192.167.1.4", "agent": "safari", "url": "/"},
	{"ip": "192.167.1.5", "agent": "curl", "url": "/test"},
	{"ip": "192.167.1.6", "agent": "curl", "url": "/"},
];
var params = {"agent":"curl", "url":"/"};

const resultCount = getAnalytics(analyticsData, params);

(resultCount == 2) ? console.log("success") : console.log("failure");

```

That's it. I haven't actually written the getAnalytics code yet, but that is how TDD works. I know exactly what it needs to do.


### Integration Testing

At this point you should be very comfortable with curl, but typing “curl http://localhost:3000”, “curl http://localhost:3000/test” and “curl -d ‘test’ http://locahost:3000/“ over and over can get a little tedious. I actually forget to test every route pretty regularly, so it may be helpful to right a shell script to test each route.

Here is how I do that:
	
	First, I create a “_tests” folder. The underscore at the front indicates that the folder is not necessary to run the project, but also not hidden because the _tests are actually very useful. Next, within the _tests folder I create a shell script with the command “touch test.sh”. Finally, I add the header “#!/bin/sh” and then type any commands I would like run: Here is a simple example:
```
#!/bin/sh
ls
```
To execute the script just type:
```
bash test.sh 
```
In some cases, you may want to change the “chmod” settings to “777” or simply executable. This is mostly useful when you want to treat the script like it’s own program. Here is how to do that:
```
chmod +x test.sh 
./test.sh
```
Once every thing is working you can replace the ‘ls’, and write your “curl” statements, so they all execute each time.
```
#!/bin/sh

curl -I http://localhost:8888/
curl -I http://localhost:8888/unknown
curl -I http://localhost:8888/styles.css
```
The curl commands have the -I flag because I am just interested in whether the API works not in getting the actual data. There are really advance testing suites out there. This is vanilla as you are going to get. If your calls break the server.js that is a good thing because you actually found a bug without a user finding that bug.

### A/B Testing

The website may not be perfect at this point, but I feel like it is getting close enough that you can start showing it to people. The idea behind A/B testing is controlling traffic to your website through a formal experimental process. We run a formal experiment to test the impact of whatever feature or experiment we are working on. A formal experiment requires four classes of information: a hypothesis, a control group, an experimental group, and a metric/measurement. So let’s formalize how we will instantiate these four classes of information right now.

First, we need a hypothesis. The website is a blog right now, so we want to get people off of the index.html page and into our content. For a hypothesis to be true, the null hypothesis must also be possible. So let’s make a hypothes like this:

	“If the index.html page contains an exciting banner ad, then people are more likely to click on a link to our newest article.” 

And the null hypothesis will be:

“If the index.html page does NOT contain a banner, then people are more likely to click on a link to our newest article.” 

Next, we need a control group. The control group can be our website as it is. No extra functionality, and just a link to our first article 1.html. So let’s define our control group as:

“A landing page without an exciting banner ad, but still has links to our newest article.”
 
After that, we need to formally define our experimental group. This may seem obvious at first, but if we really want to prove our hypothesis as correct, then we need to clearly define the attributes or reasons our experimental group performs before the testing phase is started.

“A landing page with a banner ad that links to our newest article, where the banner ad contains a clickable link and an svg object with bright colors and some animation.”

Finally, we need to formally define how we will measure whether the hypothesis or null hypothesis is true. It seems pretty clear from the hypothesis statement, that all wee need is some way of measuring clicks on index.html without the banner ad and with the banner add and comparing those numbers with the views of our newest article. So a formal statement for measuring may be:

“Number of clicks on homepage linking to newest article / total number of views of article”

It’s taken a while to get here, but now that we have an A/B test in mind, and we know what needs to be programmed next to get our website up an running.  We need:
	•	A new article
	•	An index.html page that renders a banner 50% of the time
	•	A way of tracking and recording clicks on the index.html page
	•	A way of tracking and recording views of the article.html page


## Part 4: Analytics

I’m going to come out and say it. The easiest way to log views and clicks is to use Google Analytics or HotJar or one of the many other analytics tools out there. The second easiest way is to automatically trigger calls to a third party database that logs those clicks and page views. However, the point of this series to do everything “vanilla” (i.e. from scratch).

### Setting up a filesystem

File system storage is a bit more difficult to use than a database because the typical pattern is to load the entire file into memory, edit the file, and then store the edited file in the same place. With something like page views we can’t do that. Multiple people can view the same page at the same time, and having a checkout system just won’t work. Luckily node.js has “streams”, so that shouldn’t be too much of a problem.

We already have the workings of event logging with the IP address and url exposed in our console.log statements. This data is like a firehose, so ideally we set up a data stream that creates event objects based on time, checks the file size of an intended destination, and pipes the data to that location until the file fills up. When the file fills up, it needs to just create another file with a unique identifier based on the beginning date and time. 

After that, we need to do our best to avoid callback hell. Rather than have a huge callback stack where all of our subsystems are are intertwined, the ideal is to have separate functions that don’t rely on one another. This is a trap that I fall in often. I played around with a couple ideas, and I think event emitters are the way to avoid too many nested functions.

One last design decision is where to have the “analytics” subsystem working in the app. We can extend our server.js file by simply adding a generateAnalyticsEvent function, or we can add some sort of generic middleware function call that calls a function based on the requested url and http method similar to how the getFilePath function works. Based on the last function we created, it seems like a great idea to have basic generateAnalytics for our “/“ route in the main server.js file. Then, we can add a more generic function call for route specific middleware later. This prevents the server.js file from filling up with a bunch of sub-systems that are hard to understand in the future, but also allows our future selves to understand what is happening from just looking at what happens when index.html is called in the server.js file.

Ok, let’s get started. When the server boots up we need to create a file for our analytics data and save our initial boot up event. We can do that by calling a function on startup:

```
const { startAnalytics } = require('./scripts/analytics');
let currentAnalyticsFile;

var server = http.createServer().listen(8888, ()=>{
    console.log('Server running at http://127.0.0.1:8888/');
    startAnalytics(analyticsDir, (err, analyticsFile)=>{
        currentAnalyticsFile = analyticsFile;
    });
});
```
Then we just need to fill in the function:
```
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
```

## Event Emitters to avoid callbacks
Generally, analytics are not important to our main render functions, so we can run our analytics, without blocking the rest of the http request event loop. The only necessary step is to continually update the currentAnalyticsFile with the previously mentioned event emitter.
```
var EventEmitter = require('events');
const analyticsEmitter = new EventEmitter();

const { routePath, analyticsDir, MaxFileSize } = require('./config');
const { loadpathfromfile } = require('./scripts/loadpathfromfile');
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

console.log("currentAnalyticsFile: ", currentAnalyticsFile);
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

```
 So when our generatePageView function is called, some sort of object is produced in a standardized format {date, ip, agent, url, event, method}. If the file size is too large (i.e. if stats.size > MaxFileSize), the we create a new file with the startAnalytics function.  Here is an example of what the Analytics subsystem produces when running the previously made unit test:
```
[{"date":"8/8/2022, 9:12:17 PM","event":"bootup"},{"date":"8/8/2022, 9:12:28 PM","event":"pageview","url":"/","ip":"::ffff:127.0.0.1","agent":"curl/7.79.1","method":"HEAD"}{"date":"8/8/2022, 9:12:28 PM","event":"pageview","url":"/unknown","ip":"::ffff:127.0.0.1","agent":"curl/7.79.1","method":"HEAD"}{"date":"8/8/2022, 9:12:28 PM","event":"pageview","url":"/styles.css","ip":"::ffff:127.0.0.1","agent":"curl/7.79.1","method":"HEAD"}
~                                                                                                                
```

This file should be looking pretty close to what we need for our unit test written earlier.

## Part 5: Handling Post Requests with Middleware

Now all we need to do is write some code to cycle through each of these files and sum or groupBy based on keys that are similar. This could be done in a static page, but I think it makes more sense to analyze the data via a post request, so we need to work on a bodyParser next.Post Requests should be relatively easy because it is just taking data from a user, parsing it, and doing something with it. However, I have debugged body parser before, and I think the JSON.parse method throws an error very easily. This breaks the entire server, so we need to build some very smart validators or not require objects from our data at all to prevent the user from giving us any data that might break the JSON.parse method. To keep things simple, we can use the querystring module that comes native with node.js.

### Body Parser
Ok, so I did this by breaking the logic into three functions. We have our parser, which I am just going to call parsePostReq. Post data is stored in the “req.on(‘data’, …” event, so we need to have callback functions or promises to process this request. I decided to put a wrapper function around the parser.
```
    const parsePostReq = (req, cb)=>{
        var body = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk){body += chunk});
        req.on('end', function(){
            var postData = qs.parse(body);
            cb(postData);
        });
    }
```
This might not be the most elegant code, but it will handle the request. 

### Routing Post Requests
Next, we need to load a script based on the route. We all ready have this logic written for getting the asset path, so we will use the age old tradition of copypasta:

exports.loadscriptfromfile = (routePath, url, method)=>{
        const routes_str = fs.readFileSync(routePath, "utf8")
        const routes_obj = JSON.parse(routes_str);
        if(!routes_obj.hasOwnProperty(method.toLowerCase()) ||
                !routes_obj[method.toLowerCase()].hasOwnProperty(url.toLowerCase())){
                return './scripts/no-op.js';
        } else {
                return routes_obj[method.toLowerCase()][url.toLowerCase()].scriptPath;
        }
}

There is definitely a design decision here of whether the function could be better written in a more DRY form, but although the data is stored in the same place, the actual purpose of the functions is quite different. I can see future iterations of these functions being completely different, so for now we will just leave them as two separate functions with much of the same logic.

### Middleware
Finally, we need a middleware function that takes the post data and does something with it. I think the best thing to do here is to write another immediately invoking function and wrap it in another callback function.

   const executeMiddleware = (req, cb)=>{
        const scriptPath = 
loadscriptfromfile(routePath, req.url, req.method);
        parsePostReq(req, (postData)=>{
            require(script_path)(postData, (dataObj)=>{
                cb(dataObj);
            });
        });
    } 

The require(script_path)() is a pattern that we have already used. The function that is called needs to follow these constraints:

//module.exports must be single function with callback as parameter

From here, we just need to add our middleware function to the main loop. It makes the most sense at the very end of the server.js file. 

else {
            executeMiddleware(request, (dataObj)=>{
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
            });
        }

Now, a middleware function executes on every http request and the main loop with the fs.readFile call hasn’t had much added to it. Just one line of code, and one additional indentation. There might be more clean ways of doing this, but I think the server.js file looks very close to what it looked like before it had all of the extra functionality, so I am happy. Let’s create a no-op function that does nothing for the default case:

module.exports = function (postObj, callback) {
        return callback({});
}

That should handle every route that currently exists in our project. The last thing we need to do is update are test script to include some post data.

curl -d 'test' http://localhost:8888/

## Part 6: Template Engine

The hard stuff is done. Our routes can be updated with scripts that are necessary. We need to build some fancy functions for our postData but the actual leg work that a framework like express.js would do is done. Express.js would allow us to use the post request data to input values into a template, so we still need to add that functionality.There are many template engines out there, but they all work on the same base principle: match an uncommon string of characters, and replace the matched text with another string. Really the entire process could be done with a simple regex. So let’s write it.
```
var mustache_tags =  content.match(/{{\s*[\w\.]+\s*}}/g);
                var dataObj_keys = mustache_tags.map(function(x) { return x.match(/[\w\.]+/)[0]; });
                mustache_tags.map((el, index)=>{
                        content = content.replace(el, dataObj[dataObj_keys[index]]);
                });
```
This is really just three lines of code. The first line finds the mustache tags. The second line finds the words inside the mustache tags. The third line replaces the mustache tags with a corresponding key from the DataObj.

This code is not very efficient and should probably be replaced by a fs.createReadStream where each chunk of data is replaced. I will likely do that in the future, but for now the code is readable and useful, so I am happy. 
