(function ($) {


	// window.location.origin soporte para IE
	if (!window.location.origin) { window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : ''); }

	var socket = io.connect(window.location.origin);

	var chatNameSection = $('.chat-name-section'),
		chatBoxSection = $('.chat-box-section'),
		chatInputSection = $('.chat-input-section'),
		chatSound = new Howl({
			urls: ['/other/notify.ogg', '/other/notify.mp3', '/other/notify.wav']
		});

	var chatNameForm = $('#chatNameForm'),
		chatInputForm = $('#chatInputForm');

	var chatBox = $('#chatBox'),
		chatTextBox = $('#chatTextBox'),
		usersBox = $('#usersBox');

	var modalPopupBtn = $('#usersOnlineBtn'),
		usersOnlineCounter = modalPopupBtn.find('.badge');



	// Eventos de socket

	// Si el nombre de usuario ya existe
	socket.on('nickname taken', function () {
		chatNameSection.find('.form-group').addClass('has-error has-nickname-taken');
	});

	// Bienvenida a nuevo usuario
	socket.on('welcome', function (nickname, nicknames) {

		// Mostrar área de chat
		chatNameSection.remove();
		chatBoxSection.show(500);
		chatInputSection.show(500);

		chatBoxSection.find('#user').html('Hola, <span class="badge bg-primary">' + nickname + '</span>');

		// Actualizar lista de usuarios
		updateUsers(nicknames);
	});

	// Comunicar al resto que un usuario se ha unido
	socket.on('user joined', function (nickname, nicknames) {
		var userJoinedMessage = '<p class="text-primary"><em><u>' + nickname + '</u> se ha unido al chat.</em></p>';

		// Agregar al chat y hacer scroll hasta la parte final
		appendAndScroll(userJoinedMessage);

		// Actualizar lista de usuarios
		updateUsers(nicknames);
	});

	// Mostrar al resto de usuarios que el usuario se ha desconectado
	socket.on('user left', function (nickname, nicknames) {
		var userLeftMessage = '<p class="text-warning"><em>' + nickname + ' se ha desconectado del chat.</em></p>';

		// Agregar al chat y hacer scroll hasta la parte final
		appendAndScroll(userLeftMessage);

		// Actualizar lista de usuarios
		updateUsers(nicknames);
	});

	// Mostrar mensajes entrantes en la pantalla
	socket.on('incoming', function (data, self) {

		var nickname = self ? 'Tú' : data.nickname;
		var self = self ? 'self' : '';
		var receivedMessage = '<p class="entry ' + self + '"><b class="text-primary">' + nickname + ': </b>' + data.message + '</p>';

		// Agregar al chat y hacer scroll hasta la parte final
		appendAndScroll(receivedMessage);
	});



	// Eventos de la UI

	// Función que controla el ingreso de usuarios
	chatNameForm.on('submit', function (e) {

		e.preventDefault();

		var chatName = $.trim(chatNameSection.find('#name').val());

		if (chatName != '') {
			// Se comparte al servidor para que se valide con el array de usuarios
			socket.emit('new user', { nickname: sanitize(chatName) });
		} else {
			chatNameSection.find('.form-group').addClass('has-error');
		}
	});

	// Función que controla el enviado de mensajes
	chatInputForm.on('submit', function (e) {
		e.preventDefault();
		validateAndSend();
	});

	// Enviar mensaje solo cuando esté presionada la tecla enter
	// sin estar presionada las teclas shift, ctrl y alt al mismo tiempo
	chatTextBox.on('keypress', function (e) {
		if (e.which === 13 && e.shiftKey === false &&
			e.altKey === false && e.ctrlKey === false &&

			// Si es un dispositivo con pantalla táctil desactivamos este caso
			('ontouchstart' in window === false || 'msMaxTouchPoints' in window.navigator === false)) {
			
			// Enviamos form
			chatInputForm.submit();
			return false; // Impide que el cursor se mueva a la siguiente línea
		}
	});

	// Quitar error cuando el usuario ha sido escrito 
	chatNameSection.find('#name').on('keypress', function (e) {
		chatNameSection.find('.has-error').removeClass('has-error').removeClass('has-nickname-taken');
	});

	// Modal Popup
	modalPopupBtn.on('click', function (e) {
		usersBox.modal();
	});



	// Funciones de ayuda

	// Convertir tags html en strings
	function sanitize(input) {
		var input = input.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace('\n', '<br/>');
		return input;
	}

	// Añade mensaje al chat y hace scroll a la parte inferior
	function appendAndScroll(html) {
		chatBox.append(html);
		chatBox.scrollTop(chatBox[0].scrollHeight);

		// Sonido del chat
		chatSound.play();
	}

	// Validar y enviar mensajes
	function validateAndSend() {
		var chatMessage = $.trim(chatTextBox.val());

		if (chatMessage != '') {
			socket.emit('outgoing', { message: sanitize(chatMessage) });

			// Limpiar caja de texto después de enviar
			chatTextBox.val('');
		}
	};

	// Llenar listado de usuarios
	function updateUsers(nicknames) {

		var users = '<ul class="list-group">';

		for (var i = 0; i < nicknames.length; i++) {
			users += '<li class="list-group-item">' + nicknames[i] + '</li>';
		}

		users += '</ul>';

		// Actualizar caja de usuarios
		usersBox.find('.modal-body').html(users);

		// Actualizar contador de usuarios conectados
		usersOnlineCounter.text(nicknames.length);
	}


})(jQuery);