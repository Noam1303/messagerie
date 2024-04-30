import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import "../App.css";

export default function Connexion() {
    const [user, setUser] = useState({
        name: '',
        email: '',
        password: ''
    });

    const { login } = useAuth();
    const navigate = useNavigate();

    const HandleSubmit = (e) => {
        setUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const HandleClick = async (e) => {
        e.preventDefault();
        if (user.name.trim() !== "" && user.email.trim() !== "" && user.password.trim() !== "") {
            try {
                const response = await axios.post('http://localhost:5300/user/login', user);
                if (response.data.message === "Mot de passe incorrect.") {
                    alert("Mot de passe incorrect")
                }
                else if (response.data.success) {
                        console.log("L'utilisateur existe dans la base de données.");
                        login(response.data.user); // Stocker les informations de l'utilisateur connecté
                    
                        navigate("/"); // Rediriger vers la page principale
                    }
                else {
                    console.log("L'utilisateur n'existe pas dans la base de données.");
                    alert("L'utilisateur n'existe pas dans la base de données.");
                }
            } catch (err) {
                console.log(err);
            }
        } else {
            alert("Veuillez remplir tous les champs.");
        }
    };
    

    const Menu = () => {
        navigate("/"); // Utilisation de navigate pour rediriger
    };

    return (
        <div className='container'>
            <h2 className='text-3xl text-success'>Connexion</h2>
            <div className='form-group'>
                <span htmlFor='name'>Name</span>
                <input maxLength={10} type='text' id="name" className='form-control petit' name='name' onChange={HandleSubmit} />
            </div>
            <div className='form-group'>
                <span htmlFor='email'>Email</span>
                <input maxLength={10} type='email' id="email" className='form-control petit' name='email' onChange={HandleSubmit} />
            </div>
            <div className='form-group'>
                <span htmlFor='password'>Password</span>
                <input type='password' id="password" className='form-control petit' name='password' onChange={HandleSubmit} />
            </div>
            <div className='form-group'>
                <button className='btn btn-success mt-3' onClick={HandleClick}>Se connecter</button>
            </div>
            <div className='form-group'>
                <button className='btn btn-success mt-3' onClick={Menu}>Menu</button>
            </div>
        </div>
    );
}
