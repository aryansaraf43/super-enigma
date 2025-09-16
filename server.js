const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*", // CORS fully enabled for any frontend
        methods: ["GET", "POST"]
    }
});

app.use(express.static(__dirname));

const users = {};

io.on('connection', socket => {
    socket.on('new-user', username => {
        users[socket.id] = username;
        socket.broadcast.emit('chat-message', { username: 'System', message: `${username} joined the chat` });
    });

    socket.on('send-chat-message', message => {
        const username = users[socket.id];
        io.emit('chat-message', { username, message });
    });

    socket.on('disconnect', () => {
        const username = users[socket.id];
        socket.broadcast.emit('chat-message', { username: 'System', message: `${username} left the chat` });
        delete users[socket.id];
    });
});

http.listen(3000, () => console.log('Server running on http://localhost:3000'));
