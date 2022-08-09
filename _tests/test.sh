#!/bin/sh

curl -I http://localhost:8888/
curl -I http://localhost:8888/unknown
curl -I http://localhost:8888/styles.css
curl -d 'test' http://localhost:8888/
curl http://localhost:8888/test.html
