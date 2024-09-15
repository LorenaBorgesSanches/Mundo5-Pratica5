const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
const app = express()

app.use(bodyParser.json())
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})


//Endpoint para login do usuário
//Dados do body da requisição: {"username" : "user", "password" : "123456"}
//Verifique mais abaixo, no array users, os dados dos usuários existentes na app
app.post('/api/auth/login', (req, res) => {
    const credentials = req.body

    let userData;
    userData = doLogin(credentials)

    if (userData) {
        //cria o token que será usado como session id, a partir do id do usuário
        const dataToEncrypt = { "usuario_id": userData.id };
        hashString = createJwtToken(dataToEncrypt)
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }

    res.json({ sessionid: hashString })
})

app.get('/api/whoiam', (req, res) => {
    const sessionid = req.header('Authorization');
    let token = validateJwtToken(sessionid)
    if (!token.sucess) {
        res.status(401).json({ message: token.error });
        return;
    }

    const userData = users.find(item => {
        if (parseInt(token.user.usuario_id) === parseInt(item.id))
            return item;
    });

    res.json({ ...userData, password: undefined })
})


//Endpoint para demonstração do processo de quebra da criptografia da session-id gerada no login
//Esse endpoint, e consequente processo, não deve estar presente em uma API oficial,
//aparecendo aqui apenas para finalidade de estudos.
app.post('/api/auth/decrypt', (req, res) => {
    const sessionid = req.header('Authorization');
    let token = validateJwtToken(sessionid)
    if (!token.sucess) {
        res.status(401).json({ message: token.error });
        return;
    }

    let perfil = getPerfil(token.user.usuario_id);
    if (perfil !== 'admin') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }

    res.json({ decryptedSessionid: token.user })
})


//Endpoint para recuperação dos dados de todos os usuários cadastrados
app.get('/api/users', (req, res) => {
    const sessionid = req.header('Authorization');
    let token = validateJwtToken(sessionid)
    if (!token.sucess) {
        res.status(401).json({ message: token.error });
        return;
    }

    let perfil = getPerfil(token.user.usuario_id);

    if (perfil !== 'admin') {
        res.status(403).json({ message: 'Forbidden' });
    } else {
        res.status(200).json({ data: users })
    }
})

//Endpoint para recuperação dos contratos existentes
app.get('/api/contracts/:empresa/:inicio', (req, res) => {
    const sessionid = req.header('Authorization');
    let token = validateJwtToken(sessionid)
    if (!token.sucess) {
        res.status(401).json({ message: token.error });
        return;
    }

    let perfil = getPerfil(token.user.usuario_id);
    if (perfil !== 'admin') {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }

    const empresa = req.params.empresa;
    const dtInicio = req.params.inicio;

    const result = getContracts(empresa, dtInicio);
    if (result)
        res.status(200).json({ data: result })
    else
        res.status(404).json({ data: 'Dados Não encontrados' })
})

//Outros endpoints da API
//...

///////////////////////////////////////////////////////////////////////////////////
///

//Mock de dados
const users = [
    {
        "username": "user", "password": "123456", "id": 123, "email": "user@dominio.com",
        "perfil": "user"
    },
    {
        "username": "admin", "password": "123456789", "id": 124, "email":
            "admin@dominio.com", "perfil": "admin"
    },
    {
        "username": "colab", "password": "123", "id": 125, "email": "colab@dominio.com",
        "perfil": "user"
    },
]

//APP SERVICES
function doLogin(credentials) {
    let userData
    userData = users.find(item => {
        if (credentials?.username === item.username && credentials?.password ===
            item.password)
            return item;
    });
    return userData;
}

//Gerando as chaves necessárias para criptografia do id do usuário
//Nesse caso, a palavra-chave usada para encriptação é o nome da empresa detentora do software em questão.
const secretKey = 'nomedaempresa';
function createJwtToken(payload) {
    const options = {
        expiresIn: '1h'
    };
    return jwt.sign(payload, secretKey, options);
}

function validateJwtToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return { sucess: true, user: decoded, error: "" };
    } catch (err) {
        return { sucess: false, user: "", error: err.message };
    }
}

function getPerfil(usuario_id) {
    const userData = users.find(item => {
        if (parseInt(usuario_id) === parseInt(item.id))
            return item;
    });
    return userData.perfil;
}

//Classe fake emulando um script externo, responsável pela execução de queries no Fbanco de dados
class Repository {
    execute(query, params) {

        // delegar a passagem de parametro para a biblioteca de acesso ao banco de dados
        // deixando o código comentado por ser apenas uma query de exemplo

        // const [rows] = await connection.execute(query, params);
        // return rows;

        return [];
    }
}

//Recupera, no banco de dados, os dados dos contratos
//Metodo não funcional, servindo apenas para fins de estudo
function getContracts(empresa, inicio) {
    const repository = new Repository();
    
    //substituindo as interpolações de texto para uso de parametros com '?'
    const query = `Select * from contracts Where empresa = ? and data_inicio = ?`;

    const result = repository.execute(query, [empresa, inicio]);

    return result;
}