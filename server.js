const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(__dirname));

const users = {};
const messagesFile = path.join(__dirname, 'messages.json');

// Function to read messages
function readMessages() {
    try {
        const data = fs.readFileSync(messagesFile);
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Function to save message
function saveMessage(msg) {
    const messages = readMessages();
    messages.push(msg);
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// Serve past messages via Socket.IO
io.on('connection', socket => {
    // Send previous messages
    const pastMessages = readMessages();
    pastMessages.forEach(msg => socket.emit('chat-message', msg));

    // New user joins
    socket.on('new-user', username => {
        users[socket.id] = username;
        const systemMsg = { username: 'System', message: `${username} joined the chat`, timestamp: new Date().toISOString() };
        io.emit('chat-message', systemMsg);
        saveMessage(systemMsg);
    });

    // New chat message
    socket.on('send-chat-message', message => {
        const username = users[socket.id];
        const msgObj = { username, message, timestamp: new Date().toISOString() };
        io.emit('chat-message', msgObj);
        saveMessage(msgObj);
    });

    // Disconnect
    socket.on('disconnect', () => {
        const username = users[socket.id];
        const systemMsg = { username: 'System', message: `${username} left the chat`, timestamp: new Date().toISOString() };
        socket.broadcast.emit('chat-message', systemMsg);
        saveMessage(systemMsg);
        delete users[socket.id];
    });
});

http.listen(3000, () => console.log('Server running on http://localhost:3000'));
