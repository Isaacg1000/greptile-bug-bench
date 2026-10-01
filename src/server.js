'use strict';

const http = require('node:http');
const { handle } = require('./orders');
const { createGateway } = require('./gateway');

const gateway = createGateway();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  let result;
  try {
    result = await handle(
      { method: req.method, path: url.pathname, headers: req.headers },
      { gateway }
    );
  } catch (err) {
    result = { status: 500, body: { error: 'internal error', detail: err.message } };
  }

  res.writeHead(result.status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(result.body));
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
  console.log(`orderly listening on http://localhost:${port}`);
});
