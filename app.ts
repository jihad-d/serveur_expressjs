import express from 'express';
import { Express, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';

const app = express()
const port = 3000

app.use(bodyParser.json());

interface Task {
  id: number;      
  title: string;   
}

//tableau pour stocker taches
let tasks: Task[] = [];
let taskId: number = 1;

//transporteur ; sert de connexion entre serveur et "boite mail"
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email", 
  port: 587,                    
  secure: false,                
  auth: {
    user: "jaylan.becker@ethereal.email", 
    pass: "6KDTQbXRsDVefzpWAK",         
  },
});

async function main() {
  const info = await transporter.sendMail({
    from: '"Jaylan 👻" <jaylan.becker@ethereal.email>', 
    to: "jaylan.becker@ethereal.email", 
    subject: "Hello ✔", 
    text: "Hello world?", 
    html: "<b>Hello world?</b>", 
  });
  console.log("Message sent: %s", info.messageId);
}

main().catch(console.error);


app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})


app.post('/newtasks', async(req:  Request<never, never, { title: string; }, never>, res: Response) => {
  const { title } = req.body; 
  // const title = req.body.title;

  //si titre absent alors renvoyer erreur
  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
  }

  //creation nvl task
  const newTask: Task = {
    id: taskId++,
    title: title, 
  };

  tasks.push(newTask); //push ; ajt note au tableau

  //envoi notif mail
  await transporter.sendMail({
    from: '"Jaylan 👻" <jaylan.becker@ethereal.email>',
    to: "jaylan.becker@ethereal.email",
    subject: "New Task Created",
    text: `A new task "${newTask.title}"`,
  });

  res.status(201).json(newTask); 
});


app.get('/listtasks', (req: Request, res: Response) => {
  res.json(tasks); 
});


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})  