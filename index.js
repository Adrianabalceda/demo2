
// Modulos de las dependencias

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var handler = require('./handler');
var port = 1337;

// Configurar el servidor estático de express al directorio /public
app.use(express.static(__dirname + '/public'));

// Array de usuarios conectados
var nicknames = [];

io.sockets.on('connection', function(socket) {

    // // Cuando el usuario ingresa el nombre desde el cliente
	socket.on('new user', function(data) {

		var nicknameTaken;

        // Asegurarse de que el nombre no exista ya
		nicknames.forEach(function(name){
			if ( name.toLowerCase() === data.nickname.toLowerCase() ) {
                nicknameTaken = true; // Si existe activamos la bandera
				return;
			}
		});

		if ( nicknameTaken ) {
            // Enviar notificacion si existe el nombre
			socket.emit('nickname taken');

		} else {
            // Sino creamos nuevo usuario
			socket.set("nickname", data.nickname, function() {

				// Añadimos al array
				nicknames.push(data.nickname);

                // Le damos la bienvenida al usuario
				socket.emit('welcome', data.nickname, nicknames);

                // Mostramos a los demás que un usuario se ha conectado
				socket.broadcast.emit('user joined', data.nickname, nicknames);
			});

		}
		
	});

    // Escuchando por mensajes de usuarios
	socket.on('outgoing', function(data) {

		socket.get('nickname', function(err,nickname) {
			var eventArgs = {
				nickname: nickname,
				message: data.message
			};

            // You can either use the code below
            // to send messages to all clients...
			//io.sockets.emit('incoming', nameAndData, null);

            // ...Or you can use these lines for better flexibility
			socket.emit('incoming', eventArgs, true);
			socket.broadcast.emit('incoming', eventArgs, false);
		});
	});

    // Listening for when someone leaves - native listener for socket.io
	socket.on('disconnect', function(){

		socket.get('nickname', function(err, nickname){

			// Remove username from users
			nicknames.splice( nicknames.indexOf(nickname), 1 );

            // Don't need to broadcast if there are no users left
			if(nicknames.length === 0) return;

            // Notify existing users that someone left
			socket.broadcast.emit('user left', nickname, nicknames);
		});
		
		console.log('user disconnected!');
	});
});


server.listen(port, function() { console.log("Server listening at http://localhost:"+port)});

// ExpressJS routes using the 'get' verb
app.get('/', handler);