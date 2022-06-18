(function($){


// window.location.origin polyfill support for IE
if (!window.location.origin) {window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');}

var socket = io.connect(window.location.origin);

var chatNameSection = $('.chat-name-section'),
	chatBoxSection = $('.chat-box-section'),
	chatInputSection = $('.chat-input-section'),
	chatSound = new Howl({
		urls: ['/other/notify.ogg','/other/notify.mp3','/other/notify.wav']
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
socket.on('nickname taken', function() {
	chatNameSection.find('.form-group').addClass('has-error has-nickname-taken');
});

// Bienvenida a nuevo usuario
socket.on('welcome', function(nickname, nicknames) {

	// Mostrar área de chat
	chatNameSection.remove();
	chatBoxSection.show(500);
	chatInputSection.show(500);

	chatBoxSection.find('#user').html('Hola, <span class="badge bg-primary">' + nickname + '</span>');

	// Actualizar lista de usuarios
	updateUsers(nicknames);
});

// Comunicar al resto que un usuario se ha unido
socket.on('user joined', function(nickname, nicknames) {
	var userJoinedMessage = '<p class="text-primary"><em><u>' + nickname + '</u> se ha unido al chat.</em></p>';

	// Agregar al chat y hacer scroll hasta la parte final
	appendAndScroll(userJoinedMessage);

	// Actualizar lista de usuarios
	updateUsers(nicknames);
});

// Mostrar al resto de usuarios que el usuario se ha desconectado
socket.on('user left', function(nickname, nicknames) {
	var userLeftMessage = '<p class="text-warning"><em>' + nickname + ' se ha desconectado del chat.</em></p>';

	// Agregar al chat y hacer scroll hasta la parte final
	appendAndScroll(userLeftMessage);

	// Actualizar lista de usuarios
	updateUsers(nicknames);
});

// Mostrar mensajes entrantes en la pantalla
socket.on('incoming', function(data, self) {

	var nickname = self ? 'Tú' : data.nickname;
	var self = self ? 'self' : '';
	var receivedMessage = '<p class="entry ' + self + '"><b class="text-primary">' + nickname + ': </b>' + data.message + '</p>';

	// Agregar al chat y hacer scroll hasta la parte final
	appendAndScroll(receivedMessage);
});



// Eventos de la UI

// Submit handler for name entry box
chatNameForm.on('submit', function(e){

	e.preventDefault();

	var chatName = $.trim( chatNameSection.find('#name').val() );

	if(chatName != '') {
        // Emit valid entry to server
        // for validation against nicknames array
		socket.emit('new user', { nickname: sanitize(chatName) });
	} else {
		chatNameSection.find('.form-group').addClass('has-error');
	}
});

// Submit handler for message entry box
chatInputForm.on('submit', function(e){
	e.preventDefault();
	validateAndSend();		
});

// Trigger submit handler for message box programatically
// when 'Enter' key is pressed. Does not match when
// the Shift, Ctrl or Alt key are also pressed during that process
chatTextBox.on('keypress', function(e) {
	if (e.which === 13 && e.shiftKey === false &&
		e.altKey === false && e.ctrlKey === false &&

        // Ensuring its not a touch device as
        // you wouldn't want this event attached in that scenario
        ('ontouchstart' in window === false || 'msMaxTouchPoints' in window.navigator === false)) {

		// submit form
		chatInputForm.submit();
		return false; // prevent cursor from shifting to next line
	}
});

// Remove error when input is being typed in
chatNameSection.find('#name').on('keypress', function(e) {
	chatNameSection.find('.has-error').removeClass('has-error').removeClass('has-nickname-taken');
});

// Modal Popup - as part of Bootstrap Javascript components
modalPopupBtn.on('click', function(e) {
	usersBox.modal();
});



/**
 * Helper functions
 */

// Convert html tags into literal strings
function sanitize (input) {
	var input = input.replace(/>/g, '&gt;').replace(/</g,'&lt;').replace('\n','<br/>');
	return input;
}

// Appends messages to chat box and scroll down
// to latest notification
function appendAndScroll (html) {
	chatBox.append(html);
	chatBox.scrollTop(chatBox[0].scrollHeight);

	// Plays sound if its not already playing
	chatSound.play();
}

// Validate and send messages
function validateAndSend () {
	var chatMessage = $.trim(chatTextBox.val());

	if(chatMessage != '') {
		socket.emit('outgoing', { message: sanitize(chatMessage) });

		// Clear chat text box after message success
		chatTextBox.val('');
	}
};

// Populate/Update users list
function updateUsers (nicknames) {

	var users = '<ul class="list-group">';

	for(var i=0; i<nicknames.length; i++) {
		users+= '<li class="list-group-item">' + nicknames[i] + '</li>';
	}

	users+='</ul>';

	// Update users box
	usersBox.find('.modal-body').html(users);

	// Update 'Users Online' counter
	usersOnlineCounter.text(nicknames.length);
}


})(jQuery);