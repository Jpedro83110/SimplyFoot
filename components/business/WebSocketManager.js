import { useEffect } from 'react';

export default function WebSocketManager() {
    useEffect(() => {
        const wsUrl = 'wss://echo.websocket.events'; // Serveur de test, change par le tien plus tard
        let socket;

        try {
            socket = new WebSocket(wsUrl);
        } catch (err) {
            console.error('❌ Erreur de création WebSocket :', err);
            return;
        }

        socket.onopen = () => {
            console.log('✅ WebSocket connecté');
            socket.send('🧠 SimplyFoot : connexion admin');
        };

        socket.onmessage = (event) => {
            console.log('📩 Message reçu :', event.data);
            // Ici tu peux stocker, traiter ou afficher les messages
        };

        socket.onerror = (error) => {
            console.error(
                '❌ Erreur WebSocket complète :',
                error?.message || JSON.stringify(error) || 'Erreur inconnue',
            );
        };

        socket.onclose = (event) => {
            console.log(`⛔ WebSocket fermé (code : ${event.code})`);
        };

        return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
                console.log('👋 WebSocket fermé proprement');
            }
        };
    }, []);

    return null; // Ce composant ne rend rien visuellement
}
