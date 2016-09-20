"use strict";

process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var history = new Array();
var clients = new Array();
var arr_clients = [];
var arr_topics = [];

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});


server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. To be honest I don't understand why.
    httpServer: server
});

// This callback function is called every time someone tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection
    var connection = request.accept(null, request.origin);

    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;
    var topic = false;

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    //if (history.length > 0) { 
    //    connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    //}
    if (arr_topics.length > 0) { 
        connection.sendUTF(JSON.stringify( { type: 'topics', data: arr_topics} ));
    }

    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            if (userName === false) { // first message sent by user is their name

                // remember user name
                var msg = message.utf8Data
                userName = (msg.split(','))[0]; //receive data from user
                topic = (msg.split(','))[1];

                arr_clients.push(userName);
                if ( arr_topics.indexOf(topic) < 0 ) arr_topics.push(topic);

                // get random color and send it back to the user
                userColor = colors.shift();

                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
                console.log((new Date()) + ' User is known as: ' + userName
                            + ' with ' + userColor + ' color.');

                if (history.length > 0) { 
                    connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
                };

                if (arr_clients.length > 0) { 
                   connection.sendUTF(JSON.stringify({ type: 'clients', data: arr_clients} ));
                }


            } else { // log and broadcast the message
                console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);

                // we want to keep history of all sent messages
                var obj = {
                    time: (new Date()).getTime(),
                    text: (message.utf8Data).substring(0, (message.utf8Data).length - 1),
                    author: userName,
                    color: userColor,
                    topic: topic
                };
                
                history.push(obj);

                // send message to all connected clients
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                };

                if (arr_topics.length > 0) {
                   connection.sendUTF(JSON.stringify({ type: 'topics', data: arr_topics} ));
                }

                if (arr_clients.length > 0) { console.log('clients - ' + arr_clients);
                   connection.sendUTF(JSON.stringify({ type: 'clients', data: arr_clients} ));
                }
            }
        }
    });



    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            arr_clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });

});