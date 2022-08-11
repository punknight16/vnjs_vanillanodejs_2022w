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
