$(document).ready(function () {
	/*global io*/
	let socket = io();

	// Client listener for user connection event
	socket.on('user', (data) => {
		$('#online-users').text((data.onlineUsers == 1) ? data.onlineUsers + ' user online' : data.onlineUsers + ' users online');
		let connectedMessage = data.username + (data.connected ? ' has entered the chat.' : ' has left the chat.');
		$('#messages').append("<li><strong>" + connectedMessage + "</strong></li>");
	});

	// Handling submission of chat message from input field with id of m
	$('form').submit(function () {
		let messageToSend = $('#m').val();
		// Client emitting message event to server
		socket.emit('chat message', messageToSend);
		$('#m').val('');
		return false; // Prevents form submit from refreshing the page
	});

	// Client listener for chat message event
	socket.on('chat message', (data) => {
		$('#messages').append("<li>" + "<span style='color:#00c77b;'>" + data.username + ": " + "</span>" + data.message + "</li>")
	});
	
})