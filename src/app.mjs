import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express()
app.use(express.json())

app.use(express.static(path.join(path.resolve(), 'public')));
app.use(express.urlencoded({ extended: true }));


//Paginas
app.get("/", (request, response, next) => {
    const page = path.join(path.resolve(), 'public', 'views' ,'index.html')
    response.sendFile(page)
});

app.listen(process.env.PORT, () =>(
    console.log('Rodando!')
));