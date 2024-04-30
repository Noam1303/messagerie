import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';
import SearchBar from './SearchBar';
import MessageGroup from './MessageGroup';
import io from 'socket.io-client';
import './App.css'
import { v4 as uuidv4 } from 'uuid';

const socket = io.connect("http://localhost:4000", {
    transport: ['websocket']
});


const Messages = ({ messages, groupId, idUser, idUser2, userName }) => {
    const messagesEndRef = useRef(null);

    // Fonction pour faire défiler automatiquement vers le bas lors de l'ajout de nouveaux messages
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const scrollToBottomHard = () => { 
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({behavior: 'instant', block: 'start' });
        }
    }

    // Utilisation de useLayoutEffect pour faire défiler vers le bas après le rendu initial
    useLayoutEffect(() => {
        setTimeout(scrollToBottomHard, 30);
    }, []); // Le tableau vide signifie que cela ne dépend d'aucune valeur, donc cela ne se déclenchera qu'une seule fois après le rendu initial

    // Utilisation de useEffect pour faire défiler vers le bas lorsque les messages changent
    useEffect(() => {
        scrollToBottom();
    }, [messages]); // Cela se déclenche à chaque fois que la valeur de "messages" change

    return (
        <div className="messagesWrapper">
            <label className='message'>
                <MessageGroup idGroup={groupId} idUser={idUser} idUser2={idUser2} id={messages} />
                <MessageList messages={messages} userName={userName} id={messages} />
                <div ref={messagesEndRef} />
            </label>
        </div>
    );
};

const MessageList = ({ messages, userName }) => {
    
    return (
        <div className='message'>
            {messages.map((message, index) => (
                <div key={index} style={{ textAlign: message.names === userName() ? 'right' : 'left' }}>
                    {message.names === userName() ? (
                        <span>{message.message} :
                        <b className='name1'>{message.names}</b></span>
                    ) : (
                        <span><b className='name2'>{message.names}</b>: {message.message}</span>
                    )}
                </div>
            ))}
        </div>
    );
};


function User() {
    const { user, logout } = useAuth(null);
    const [newMessage, setNewMessage] = useState('');
    const [search, setSearch] = useState([]);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [group, setGroup] = useState(localStorage.getItem('group') === 'true');
    const [groupId, setGroupId] = useState(localStorage.getItem('groupId') || '');
    const [idUser2, setIdUser2] = useState(localStorage.getItem('idUser2') || '');
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [name, setName] = useState("");
    const labelRef = useRef(null);

    // Effet d'initialisation pour la connexion au serveur WebSocket
    useEffect(() => {
        const storedGroupId = localStorage.getItem('groupId');
        if (storedGroupId) {
            setGroupId(storedGroupId);
            socket.emit('join', { room: storedGroupId, name: name });
            console.log('Stored groupId:', storedGroupId);
        }
        socket.on('connect', () => {
            console.log('Connected to server');
        })
        socket.on('notification', (message) => { 
            alert(message);
        })
    
        socket.on('message', (message) => { 
            console.log('Received message from server:', message);
            setMessages((prevMessages) => {
                const messageIds = new Set(prevMessages.map(msg => msg.id));
                if (!messageIds.has(message.id)) {
                    return [...prevMessages, message];
                }
                return prevMessages;
            });
        })
    }, [])

    useEffect(() => {
        console.log("Current messages:", messages);
    }, [messages]);

    
    const handleSendMessage = (message,event) => { 
        console.log("Send Message", inputMessage);
        if (inputMessage.trim()) {
            handleSubmit(event);
            console.log("The message has been sent");
            onSendMessage(inputMessage);
            setInputMessage('');
        }
    };
    
    const onSendMessage = (message) => { 
        const names = user.name;
        const newMessage = {
            id: uuidv4(),
            names,
            message
        };
        console.log("Sending message to groupId:", groupId);
        
        socket.emit('message', {
            room: groupId,
            message: newMessage
        });
        console.log("Sent message to server:", newMessage);
    };
    
    const idUser = () => {
        return user  && user.id;
    };

    const userName = () => {
        return user && user.name;
    };
    
    const handleLogout = () => {
        console.log('handleLogout');
        logout();
        setGroup(false);
        localStorage.setItem('group', 'false');
    };

    const saveMessageToDatabase = async (message, idGroup, idUser) => {
        try {
            const response = await axios.post('http://localhost:5300/message', { message, idGroup, idUser });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du message:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        if (newMessage.trim() !== '') {
            try {
                await saveMessageToDatabase(newMessage, groupId, user.id);
                setNewMessage('');
            } catch (error) {
                console.error('Erreur lors de l\'enregistrement du message:', error);
            }
        }
    };

    const handleSearch = async (searchQuery) => {
        try {
            const response = await axios.get(`http://localhost:5300/search?q=${searchQuery}`);
            setSearch(response.data);
            setSearchPerformed(true);
            setGroup(false);
            localStorage.setItem('group', 'false');
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
        }
    };

    const handleGroup = async (id1, id2) => { 
        if (id1 !== id2) {
            try {
                setName(user.name);
                console.log(id1);
                console.log(id2);
                const response = await axios.get(`http://localhost:5300/group?id1=${id1}&id2=${id2}`);
                const groupId = response.data.groupId.toString();
                localStorage.setItem('groupId', groupId);
                localStorage.setItem('group', 'true');
                setGroupId(groupId);
                setGroup(true);
                socket.emit('join', {
                    room: groupId,
                    name: name
                });
            } catch (error) {
                console.error('Erreur lors de la recherche:', error);
            }
        } else {
            console.error("Vous ne pouvez pas vous envoyer de message à vous-même");
            alert("Vous ne pouvez pas vous envoyer de message à vous-même");
        }
    };

    const Menu = () => { 
        setGroup(false);
        window.location.reload();
        localStorage.setItem('group', 'false');
    };

    const handleChange = (event) => {  
        setNewMessage(event.target.value);
        setInputMessage(event.target.value)
    };

    return (
        <div>
            {group ? (
                <div className='message-group'>
                    <div>
                        <h2>Messages: id n°{groupId}</h2> 
                    </div>
                    <Messages messages={messages} groupId={groupId} idUser={idUser} idUser2={idUser2} userName={userName} />
                    <div className='button-group'>
                        <input
                            type="text"
                            placeholder="Votre message..."
                            value={inputMessage}
                            onChange={handleChange}
                            maxLength={50}
                        />
                        <button onClick={(e) => handleSendMessage(e)} className='send-button'>Send</button>
                        <button type="button" onClick={Menu}>Menu</button> 
                    </div>
            </div>
                    ) : (
                    user ? (
                <div>
                    <div className='Main'>
                                <h1>Bienvenue, {user.name}!</h1>
                                <i>Cherchez une personne dans la base de donnée,
                                    Si vous entrez une valeur vide, alors la base de données vous renverra toutes les personnes</i>
                                <i>Ouvrez la discussion avec Noam pour un tuto</i>
                        <SearchBar onSearch={handleSearch} />
                    </div>
                    <div className='searchbar_name'>
                        {searchPerformed && search.length === 0 && (
                            <div>L'utilisateur n'existe pas</div>
                        )}
                        {search.map((result, index) => (
                            <div key={index}>
                                {result.name.trim() === '' ? (
                                    "L'utilisateur n'existe pas"
                                ) : (
                                    <div className='searchbar_name_user'>
                                        <button className='mp' type='submit' onClick={() => handleGroup(result.id, user.id)}>{result.name}</button>
                                    </div>
                                )}
                            </div>
                        ))}
                            </div>
                            <div className='Main'>
                                <button className='logout' onClick={handleLogout}>Se déconnecter</button>
                            </div>
                </div>
            ) : (
                <div className='Main'>
                    <h1>Veuillez vous connecter</h1>
                    <i>vous pouvez vous connecter avec les identifiants: Mathieu/a/a</i>
                    <Link to="/connexion">Se connecter</Link>
                    <Link to="/inscription">Créer un compte</Link>
                </div>
            ))}
            
        </div>
    );
}

export default User;
