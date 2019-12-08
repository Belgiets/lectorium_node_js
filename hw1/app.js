const http = require('http')
const url = require('url')
const querystring = require('querystring')
const path = require('path')
const fs = require('fs');
const zlib = require('zlib');

const hostname = '127.0.0.1'
const port = 3000

const server = http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname
  let query = url.parse(req.url).query
  let queryParams = querystring.parse(query)

  if (pathname.includes('/files')) {
    let filesUrlParts = pathname.split("/files")
    let filePath = 'data'

    if (filesUrlParts[1] === '' || filesUrlParts[1] === '/') {
      filePath += '/index.html'
    } else {
      filePath += filesUrlParts[1]
    }

    if (queryParams.download === '1') {
      let file = fs.createReadStream(filePath);
      let fileName = queryParams.filename ? queryParams.filename : path.basename(filePath);

      if (queryParams.compress === '1') {
        res.writeHead(200, {
          'Content-disposition': 'attachment; filename=' + fileName + '.gz'
        })

        fs.access(filePath + '.gz', fs.constants.F_OK, (err) => {
          if (err) {
            file
              .pipe(zlib.createGzip())
              .on('data', () => process.stdout.write('.'))
              .pipe(fs.createWriteStream(filePath + '.gz'))
              .on('finish', () => {
                res.end()
              })
          } else {
            fs.createReadStream(filePath + '.gz').pipe(res)
          }
        });
      } else {
        res.writeHead(200, {'Content-disposition': 'attachment; filename=' + fileName})
        file.pipe(res)
      }
    } else {
      switch (path.extname(filePath)) {
        case '.mp3':
        case '.mp4':
          try {
            let stat = fs.statSync(filePath);

            res.writeHead(200, {
              'Content-Type': 'audio/mpeg',
              'Content-Length': stat.size
            });

            let readStream = fs.createReadStream(filePath);
            readStream.pipe(res);
          } catch (e) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found')
          }

          break;
        default:
          fs.readFile(filePath, (err, data) => {
            if (err) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Not Found')
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data)
          });
      }
    }
  } else if (pathname.includes('/echo-data')) {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        if ('content-type' in req.headers && req.headers['content-type'] === 'application/json') {
          res.setHeader('Content-type', 'application/json')
        }

        res.end(body);
      });
    } else {
      res.statusCode = 405
      res.end('Method not allowed')
    }
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