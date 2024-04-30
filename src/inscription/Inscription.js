import React, { useState } from 'react';
import './style.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Inscription() {
    const [user, setUser] = useState({
        name: '',
        email: '',
        password: ''
    });

    const navigate = useNavigate();

    const HandleSubmit = (e) => {
        setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const HandleClick = async (e) => {
        e.preventDefault();
        //TO DO: verifier que le mail soit bien syntaxer
        if (user.name.trim() !== "" && user.email.trim() !== "" && user.password.trim() !== "") {
            try {   
                const response = await axios.post("http://localhost:5300/user", user);
                if (response.data.success) {
                    alert('ce nom existe deja')
                }
                else window.location.href = "/connexion";
            } catch (err) {
                console.log(err);
            }
        }        
    };

    const Menu = (e) => { 
        navigate("/")
    }

    return (
        <div className='container'>
            <h2 className='text-3xl text-success'>Inscription</h2>
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
                <button className='btn btn-success mt-3' onClick={HandleClick}>S'inscrire</button>
            </div>
            <div className='form-group'>
                <button className='btn btn-success mt-3' onClick={Menu}>Menu</button>
            </div>
        </div>
    );
}
