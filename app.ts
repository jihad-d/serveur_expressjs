import express from 'express';
import { Express, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const app = express()
const port = 3000

app.use(bodyParser.json());


interface Task {
  id: number;      
  title: string;  
  content: string;
}

//fichier json qui contient les taches
const tasksFilePath = path.join(__dirname, 'tasks.json');

//fonction pour charger les tâches depuis le fichier JSON
const loadTasks = () => {
  try {
    const data = fs.readFileSync(tasksFilePath, 'utf-8');
    return JSON.parse(data) as Task[];
  } catch (err) {
    return []; // retourne tableau vide si 0 fichiers ou erreur
  }
};

//sauvegarde taches dans le fichier JSON
const saveTasks = (tasks: Task[]) => {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf-8'); 
};

let tasks = loadTasks(); //recup toutes les taches
let taskId = tasks.length ? tasks[tasks.length - 1].id + 1 : 1; // si le tableau a des taches ajt 1 sinon commencer à 0


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


app.post('/newtasks', async (req, res) => {
  const { title, content } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
    return; //si manque titre la requete s'arrete
  }

  const newTask: Task = {
    id: taskId++,
    title: title,
    content: content || '',
  };

  tasks.push(newTask);
  // saveTasks(tasks);

  await transporter.sendMail({
    from: '"Jaylan 👻" <jaylan.becker@ethereal.email>',
    to: "jaylan.becker@ethereal.email",
    subject: "New Task Created",
    text: `A new task "${newTask.title}" and new content "${newTask.content}"`,
  });

  res.status(201).json(newTask);
});


app.get('/listtasks', async (req: Request, res: Response) => {
  const tasksList = tasks.map(task => `Task ID: ${task.id}\nTitle: ${task.title}\nContent: ${task.content}\n`).join('\n\n'); //rassemble les chaines de caract + saut à la ligne     map ; creer un tableau

  await transporter.sendMail({
    from: '"Jaylan 👻" <jaylan.becker@ethereal.email>',
    to: "jaylan.becker@ethereal.email",
    subject: "Task List",
    text: `Liste ${new Date().toISOString()}.\n\nTaches:\n\n${tasksList}`,
    html: `<b>Liste${new Date().toISOString()}.</b><br><p>Taches:</p><pre>${tasksList}</pre>`,
  });

  res.json(tasks); 
});


app.put('/update/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, content } = req.body;

    const taskIndex = tasks.findIndex(task => task.id === taskId); 

    //si la tache n'est pas trouvee alors renvoyer erreur et stoper l'execution
    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found' });
    }

    //maj de la tache
    tasks[taskIndex].title = title || tasks[taskIndex].title;
    tasks[taskIndex].content = content || tasks[taskIndex].content;

    saveTasks(tasks);

    await transporter.sendMail({
      from: '"Jaylan 👻" <jaylan.becker@ethereal.email>',
      to: "jaylan.becker@ethereal.email",
      subject: "Task Updated",
      text: `The task with ID ${taskId} has been updated.\nNew Title: ${tasks[taskIndex].title}\nNew Content: ${tasks[taskIndex].content}`,
    });

    res.status(200).json(tasks[taskIndex]); 
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'Error updating task' });
  }
});




app.delete('/delete/:id', async (req: Request, res: Response) => {
  console.log("Delete route reached");
  try {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found' });  //si la tache n'existe pas
    }

    //suppression de la tache du tableau
    const deletedTask = tasks.splice(taskIndex, 1)[0];  // splice supprime et retourne la tache

    saveTasks(tasks); 

    await transporter.sendMail({
      from: '"Jaylan 👻" <jaylan.becker@ethereal.email>',
      to: "jaylan.becker@ethereal.email",
      subject: "Task Deleted",
      text: `The task with ID ${taskId} has been deleted.`,
    });

    res.status(200).json({ message: `Task with ID ${taskId} deleted successfully`, deletedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error occurred during task deletion' });
  }
});



app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})  

export default app; 