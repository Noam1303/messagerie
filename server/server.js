const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan')
const favicon = require('serve-favicon')
const mysql = require('mysql')
const cors = require('cors')
const http = require('http');
const app = express();
const socket = require('socket.io');
const bcrypt = require('bcryptjs');

app.use(cors())

const port = process.env.PORT || 4000;

const io = socket(
  app.listen(port, () => {
      console.log(`Server is running on port ${port}`)
  }), {
      cors: {
          origin: 'http://localhost:3000',
          methods: ['GET', 'POST'],
      }
  }
);


app
  .use(favicon(__dirname + '/favicon.ico'))
  .use(morgan('dev'))
  .use(bodyParser.json())


  io.on('connection', (socket) => {
    console.log(`New connection ${socket.id}`)
    socket.on('disconnect', () => { 
        console.log('User disconnected')
    })
    socket.on('join', ({ room, name }) => {
      console.log('join', room, name)
      socket.join(room)
      
    })
    
    socket.on('message', ({ room, message }) => {
        console.log('messageRoom', room, message)
        io.to(room).emit('message', message)
    })

})

var connection = mysql.createConnection({
  socketPath: "/opt/lampp/var/mysql/mysql.sock",
  host: "localhost",
  user: 'root',
  password: null,
  database: "messagerie"

});

app.get('/search', (req, res) => {
  const searchTerm = req.query.q;
  const sqlQuery = `SELECT * FROM user WHERE name LIKE ?`; // Utilisez LIKE pour une recherche partielle

  connection.query(sqlQuery, [`%${searchTerm}%`], (error, results, fields) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.message);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json(results);
  });
});

app.get('/group', (req, res) => { 
  const groupExistQuery = 'SELECT * FROM groupe WHERE idUser1 = ? AND idUser2 = ?';
  const createGroupQuery = 'INSERT INTO groupe (idUser1, idUser2) VALUES (?, ?)';
  const idGroupQuery = 'SELECT idGroupe FROM groupe WHERE idUser1 = ? AND idUser2 = ?';
  
  const id1 = req.query.id1;
  const id2 = req.query.id2;

  if (!id1 || !id2) {
      console.error('Paramètres manquants dans la requête.');
      res.status(400).send('Paramètres manquants dans la requête.');
      return;
  }

  connection.query(groupExistQuery, [id1, id2], (error1, results1, fields1) => {
      if (error1) {
          console.error('Erreur lors de la recherche du groupe:', error1);
          res.status(500).send('Erreur interne du serveur.');
          return;
      }

      connection.query(groupExistQuery, [id2, id1], (error2, results2, fields2) => {
          if (error2) {
              console.error('Erreur lors de la recherche du groupe:', error2);
              res.status(500).send('Erreur interne du serveur.');
              return;
          }

          if (results1.length === 0 && results2.length === 0) {
              connection.query(createGroupQuery, [id1, id2], (error3, results3, fields3) => {
                  if (error3) {
                      console.error('Erreur lors de la création du groupe:', error3);
                      res.status(500).send('Erreur interne du serveur.');
                      return;
                  }
                  
                  // Récupérer l'ID du groupe après sa création
                  connection.query(idGroupQuery, [id1, id2], (error4, results4, fields4) => { 
                      if (error4) {
                          console.error('Erreur lors de la récupération de l\'ID du groupe:', error4);
                          res.status(500).send('Erreur interne du serveur.');
                          return;
                      }

                      const groupId = results4[0].idGroupe; // Supposons que l'ID du groupe est dans la première ligne de résultats
                      res.status(200).json({ groupId: groupId }); // Envoyer l'ID du groupe en réponse
                  });
              });
          } else {
              const groupId = results1.length > 0 ? results1[0].idGroupe : results2[0].idGroupe;
              res.status(200).json({ groupId: groupId });
          }
      });
  });
});



connection.connect(function (err) {
  if (err) {
      console.log(err.code);
      console.log(err.fatal)
  }
  else {
      console.log("Connected to the database.");
  }
});

// Gestion de la connexion d'un nouveau client

  app.post('/message', (req, res) => {
    const message = req.body.message;
    const idGroup = req.body.idGroup;
    const idUser = req.body.idUser;
    saveMessageToDatabase(message, idGroup, idUser); // Appelez la fonction pour enregistrer le message dans la base de données
    res.status(200).send('Message enregistré avec succès');
  });


const saveMessageToDatabase = (message, idGroup, idUser) => {
  console.log(message);
  console.log(idGroup);
  console.log(idUser);
  const query = "INSERT INTO message (`idGroupe`, `texte`, `IdUser`) VALUES (?, ?, ?)";
  const values = [idGroup, message, idUser];
    connection.query(query, values, (err, data  )=>{ 
      if (err) return console.log(err);
      return console.log(data);
  });
} 

app.get('/', (req, res) => {
  res.json('Hello World 👋! This is backend')
})

app.get('/inscription', (req, res) => {
  res.json("inscrit toi sinon il va t'arriver deux trois bricoles")
})

app.get('/connexion', (req, res) => { 
  res.json("connecte toi, tout vas bien se passer")
})

app.get('/user', (req, res) => { 
  const query = "SELECT * FROM user";
  connection.query(query, (err, data  )=>{ 
    if (err) return res.json(err)
    return res.json(data)
  })
})

app.post('/user/login', async (req, res) => { 
  const { name, email, password } = req.body;

  const query = "SELECT * FROM user WHERE name = ? AND email = ?";
  connection.query(query, [name, email], async (err, data) => { 
    if (err) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', err);
      return res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }

    if (data.length === 0) {
      return res.json({ success: false, message: "L'utilisateur n'existe pas dans la base de données." });
    }

    const user = data[0];
    console.log(user)
    console.log(user.mdp)
    const passwordMatch = await bcrypt.compare(password, user.mdp);

    if (passwordMatch) {
      return res.json({ success: true, userId: user.id, user: user });
    } else {
      return res.json({ success: false, message: "Mot de passe incorrect." });
    }
  });
});


app.post('/allMessages', (req, res) => { 
  const query = "SELECT * FROM message WHERE idGroupe = ?";
  const idGroup = req.body.idGroup;
  connection.query(query, idGroup, (err, data) => { 
    if (err) {
      console.error("Erreur lors de la requête SQL :", err);
      return res.status(500).json({ error: "Une erreur s'est produite lors de la récupération des messages." });
    }
    // Transformer les données en un tableau si elles existent
    const messagesArray = Array.isArray(data) ? data : [];  
    return res.json(messagesArray);
  });
});

app.get('/user/:id', (req, res) => { 
  const idUser = req.params.id;
  const query = `SELECT * FROM user WHERE id=${idUser}`;
  connection.query(query, (err, data  )=>{ 
    if (err) return res.json(err)
    return res.json(data)
  })
})


app.post('/user', async (req, res) => { 
  const { name, email, password } = req.body;

  try {
    // Générer un salt
    const salt = await bcrypt.genSalt(10);

    // Hacher le mot de passe avec le salt
    const hashedPassword = await bcrypt.hash(password, salt);

    const query3 = `SELECT * FROM user WHERE name = '${name}'`;
    connection.query(query3, (err, data) => {
      if (err) {
        console.error('Erreur lors de la vérification du nom:', err);
        return res.json({ success: true, message: "probleme avec le nom" });
      }
      if (data && data.length > 0) {
        return res.json({ success: true, message: "L'utilisateur existe deja dans la base de donnée" });
      } else {
        // Enregistrer l'utilisateur dans la base de données avec le mot de passe haché
        const query = "INSERT INTO `user` (`name`, `email`, `mdp`) VALUES (?, ?, ?)";
        const values = [name, email, hashedPassword];
        connection.query(query, values, (err, data) => {
          if (err) {
            console.error('Erreur lors de la création de l\'utilisateur:', err);
            return res.status(500).json({ success: true, message: "erreur interne du serveur" });
          }
          return res.status(200).json({ success: false, message: "Utilisateur créé avec succès" });
        });
      }
    }) } catch (error) {
    console.error('Erreur lors du hachage du mot de passe:', error);
    return res.status(500).json({ success: true, message: "Erreur lors du hachage du mot de passe" });
  }
});


$query = "SELECT * FROM user";

connection.query($query, function (err, rows, fields) { 
  if (err) {
      console.log('error');
      return;
  }

  console.log('The solution is: ', rows);
})

$delete = "DELETE FROM user WHERE name=2";
// connection.query($delete, function (err, rows, fields) { 
//     if (err) {
//         console.log('error');
//         return;
//     }

//     console.log('The solution is: ', rows);
// })

// connection.end(function () {
  //   console.log("MySQL connection closed.");
  // });

