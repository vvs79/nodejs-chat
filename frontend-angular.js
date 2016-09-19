    "use strict";

angular.module("appChat", [])
.controller('chatCtrl', function($scope, $window) {
    // for better performance - to avoid searching in DOM
    var content = document.getElementById('content');
    var input = document.getElementById('input');
    var status = document.getElementById('status');
    $scope.users = [];
    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html('Sorry, but your browser doesn\'t ' + 'support WebSockets.' );
        input.hide();
        document.getElementsByTagName('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('ws://localhost:1337');

    connection.onopen = function () {// first we want users to enter their names and topics
        input.removeAttribute('disabled');//.value('').focus();
        //input.value('').focus();
        status.innerHTML = 'Choose name:';
        //status.text('Choose topic:');
    };

    connection.onerror = function (error) {// just in there were some problems with conenction...
        content.html('Sorry, but there\'s some problem with your ' + 'connection or the server is down.</p>' );
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        if (json.type === 'color') { // first response from the server with user's color
            myColor = json.data;
            status.innerHTML = myName + ': '
            status.style.color = myColor;
            input.removeAttribute('disabled');
            input.focus();
            // from now user can start sending messages
        } else if (json.type === 'history') { // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
                if (json.data[i].author) {
                    if ($scope.users.indexOf(json.data[i].author) < 0) {
                    $scope.users.push(json.data[i].author); console.log('$scope.users - ' + $scope.users); } }
                addMessage(json.data[i].author, json.data[i].text,
                           json.data[i].color, new Date(json.data[i].time));
            }
            slideScrollbar();
        } else if (json.type === 'message') { // it's a single messagegg
            input.removeAttribute('disabled'); // let the user write another message
            if (json.data.author) {
                    if ($scope.users.indexOf(json.data.author) < 0) {
                    $scope.users.push(json.data.author); console.log('$scope.users - ' + $scope.users); } }
            addMessage(json.data.author, json.data.text,
                       json.data.color, new Date(json.data.time) );
            slideScrollbar();
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    $scope.keydown = function(e) {
        if (e.keyCode === 13) {
            var msg = input.value;
            connection.send(msg);
            input.value = '';
            input.setAttribute('disabled', 'disabled');

            if (myName === false) {
                myName = msg;
                if (myName) {
                    if ($scope.users.indexOf(myName) < 0) {
                    $scope.users.push(myName); console.log('$scope.users - ' + $scope.users); } }
                console.log('First time - ' + myName);
            }
        }
    };

    setInterval(function() {
        if (connection.readyState !== 1) {
            status.innerHTML('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 5000);

    $scope.disconnect = function() {
        connection.onclose = function(event) {
            if (event.wasClean) {
            alert('Соединение закрыто чисто');
            } else {
            alert('Обрыв соединения'); // например, "убит" процесс сервера
            }
            alert('Код: ' + event.code + ' причина: ' + event.reason);
        };
    };


    function addMessage(author, message, color, datetime) {
        var newDiv = document.createElement('div');
        newDiv.innerHTML = '<p><span style="color:' + color + '">' + author + '</span> @ ' +
                      + (datetime.getHours() < 10 ? '0' + datetime.getHours() : datetime.getHours()) + ':'
                      + (datetime.getMinutes() < 10 ? '0' + datetime.getMinutes() : datetime.getMinutes())
                      + ': ' + message + '</p>';
        content.appendChild(newDiv);
    }
    
    

    var scrollbar = $('body > section:first').tinyscrollbar();
    
    function slideScrollbar() {
        scrollbar.update();
        //scrollbar.move(Math.max(0, content.find('> p').length - 9) * 18);
    }
    
});