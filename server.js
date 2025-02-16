const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Odalar için kullanıcı listesi tutan basit bir obje
// { roomId: [socketId1, socketId2, ...] }
const rooms = {};






io.on('connection', socket => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Kullanıcı ${socket.id} odası: ${roomId}`);

        // Oda listesi yoksa oluştur
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        // Odaya yeni kullanıcıyı ekle
        rooms[roomId].push(socket.id);

        // Mevcut kullanıcılar, yeni kullanıcıyı bilsin
        socket.to(roomId).emit('user-connected', socket.id);

        // Yeni katılan kullanıcıya odada önceden bulunan kullanıcıların listesini gönder
        // (Kendisini listeden çıkarmayı unutmayın)
        const otherUsers = rooms[roomId].filter(id => id !== socket.id);
        io.to(socket.id).emit('existing-users', otherUsers);
    });

    socket.on('offer', (roomId, offer, fromId) => {
        socket.to(roomId).emit('offer', offer, fromId);
    });

    socket.on('answer', (roomId, answer, fromId) => {
        socket.to(roomId).emit('answer', answer, fromId);
    });

    socket.on('ice-candidate', (roomId, candidate, fromId) => {
        socket.to(roomId).emit('ice-candidate', candidate, fromId);
    });

    socket.on('drawing', (roomId, data, fromId) => {
        socket.to(roomId).emit('drawing', data, fromId);
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
        // Kullanıcı ayrıldığında oda listesinden çıkar
        for (const roomId in rooms) {
            const index = rooms[roomId].indexOf(socket.id);
            if (index !== -1) {
                rooms[roomId].splice(index, 1);
                // Ayrılma bilgisini odadakilere iletmek isterseniz:
                // socket.to(roomId).emit('user-disconnected', socket.id);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
