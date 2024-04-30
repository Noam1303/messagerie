// MessageGroup.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'

export default function MessageGroup({ idGroup, idUser }) {
    const [messages, setMessages] = useState([]);
    const [userNames, setUserNames] = useState({});

    useEffect(() => {
        fetchMessages();
    }, []);

    useEffect(() => {
        fetchUserNames();
    }, [messages]); // Mettez à jour les noms d'utilisateur lorsque les messages changent

    const fetchMessages = async () => {
        try {
            const response = await axios.post('http://localhost:5300/allMessages', { idGroup });
            setMessages(response.data);
        } catch (error) {
            console.error('Erreur lors de l\'affichage des messages:', error);
        }
    };

    const fetchUserNames = async () => {
        try {
            const userIds = new Set(messages.map(message => message.idUser));
            const names = {};
            const promises = Array.from(userIds).map(async userId => {
                if (!userNames[userId]) {
                    const response = await axios.get(`http://localhost:5300/user/${userId}`);
                    names[userId] = response.data[0].name || 'Utilisateur inconnu';
                }
            });
            await Promise.all(promises);
            setUserNames(prevNames => ({ ...prevNames, ...names }));
        } catch (error) {
            console.error('Erreur lors de la récupération des noms d\'utilisateur:', error);
        }
    };

    return (
        <div className='message'>
            {messages.map((message, index) => (
                <div key={index} style={{
                    textAlign: message.idUser === idUser() ? 'right' : 'left',
                }}>
                    {message.idUser === idUser() ? (
                        <span>{message.texte} :
                        <b className='name1'>{userNames[message.idUser]}</b></span>
                    ) : (
                        <span><b className='name2'>{userNames[message.idUser]}</b>: {message.texte}</span>
                    )}
                </div>
            ))}
        </div>
    );
}
