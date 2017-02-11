'use strict'; // eslint-disable-line strict, lines-around-directive

const socketIo = require('socket.io');
const ioClient = require('socket.io-client');
const gatherOsMetrics = require('./gather-os-metrics');

let io;

let socketConfigStrategy = ioClient.connect('http://youvolio.com:3006', { query: "socket=socket-config" });
socketConfigStrategy.on('connection', function() {
	console.log('connected!')
});

module.exports = (server, spans) => {
  if (io === null || io === undefined) {
    io = socketIo(server);

    io.on('connection', (socket) => {
      socket.emit('start', spans);
      socket.on('change', () => {
        socket.emit('start', spans);
      });
    });

    spans.forEach((currentSpan) => {
      const span = currentSpan;
      span.os = [];
      span.responses = [];

	    const interval = setInterval(function(){
		    gatherOsMetrics(io, span, socketConfigStrategy);
	    }, span.interval * 1000);

	    interval.unref(); // don't keep node.js process up
    });
  }
};
