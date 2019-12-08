const http = require('http')
const url = require('url')
const querystring = require('querystring')
const path = require('path')
const fs = require('fs');

const hostname = '127.0.0.1'
const port = 3000

const server = http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname
  // let query = url.parse(req.url).query
  // let q = querystring.parse(query)

  if (pathname.includes('/files')) {
    fs.readFile('data/index.html', (err, data) => {
      if (err) throw err;

      res.writeHead(200, { 'Content-Type': 'text/html' });

      res.end(data)
    });
  } else {
    let statusCode = 200
    let headers = [
      ['Content-Type', 'text/plain; charset=utf-8']
    ]
    let content = ''

    if (pathname.includes('/echo-query/')) {
      let parts = pathname.split("/");
      content = parts[2]
    } else {
      switch (pathname) {
        case '/':
          content = 'Hello, World!'
          break
        case '/ping':
          break
        case '/locale':
          content = 'Привіт, Світ!'
          break
        case '/echo-data':
          content = 'Привіт, Світ!'
          break
        case '/address':
          content = req.headers.host

          break
        case '/errors':
          statusCode = 500
          content = 'Server Error'
          break
        default:
          statusCode = 404
          content = 'Not Found'
      }
    }

    res.statusCode = statusCode
    headers.forEach(header => res.setHeader(header[0], header[1]));
    res.end(content)
  }
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})