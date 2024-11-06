import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import app from './app'; 


jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue('email sent'),
    }),
}));


describe('POST /newtasks', () => {
  it('create a new task', async () => {
    const response = await request(app)
      .post('/newtasks')
      .send({ title: 'Test Task', content: 'This is a test task' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Task');
    expect(response.body.content).toBe('This is a test task');
  });

  it('return erro 400', async () => {
    const response = await request(app)
      .post('/newtasks')
      .send({ content: 'This task has no title' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Task title is required');
  });
});





describe('GET /listtasks', () => {
    it('tasks list', async () => {
      const response = await request(app)
        .get('/listtasks')
        .expect('Content-Type', /json/); 
      expect(response.status).toBe(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('title');
        expect(response.body[0]).toHaveProperty('content');
      }
    });
});
  




let tasks = [{ id: 1, title: 'Old Title', content: 'Old Content' }]; // Liste de tâches simulée

// Fonction utilitaire pour préparer le fichier JSON
const resetTasksFile = (tasks: Array<{ id: number; title: string; content: string }>) => {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf-8');
};

const tasksFilePath = path.join(__dirname, 'tasks.json');

describe('PUT /update/:id', () => {
  beforeEach(() => {
    const initialTasks = [{ id: 1, title: 'Old Title', content: 'Old Content' }];
    resetTasksFile(initialTasks);  //reinitialiser les tâches avant chaque test
  });

  it('should update task and return updated task', async () => {
    const updatedTask = { title: 'Updated Title', content: 'Updated Content' };

    const response = await request(app)
      .put('/update/4')
      .send(updatedTask);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe(updatedTask.title);
    expect(response.body.content).toBe(updatedTask.content);
  });
});

describe('File Update Test', () => {
  it('should update task in the JSON file', () => {
    const tasks = JSON.parse(fs.readFileSync(tasksFilePath, 'utf-8'));
    const updatedTaskInFile = tasks.find((task: { id: number }) => task.id === 1);
    expect(updatedTaskInFile).toBeTruthy();
    expect(updatedTaskInFile?.title).toBe('Updated Title');
    expect(updatedTaskInFile?.content).toBe('Updated Content');
  });
});





describe('DELETE /delete/:id', () => {
    // Initialiser les tâches avant chaque test
    beforeEach(() => {
      const initialTasks = [
        { id: 1, title: 'Task 1', content: 'Content Task 1' },
        { id: 2, title: 'Task 2', content: 'Content Task 2' },
      ];
      resetTasksFile(initialTasks);  // Réinitialiser les tâches avant chaque test
    });
  
    it('delete task + success message', async () => {
      const taskIdToDelete = 1;
  
      // Effectuer la requête DELETE pour supprimer la tâche avec l'ID spécifié
      const response = await request(app)
        .delete(`/delete/${taskIdToDelete}`);
  
      // Vérifier la réponse HTTP
      expect(response.status).toBe(200);
      expect(response.body.message).toBe(`Task with ID ${taskIdToDelete} deleted successfully`);
  
      // Vérifier que la tâche a bien été supprimée dans le fichier JSON
      const tasks = JSON.parse(fs.readFileSync(tasksFilePath, 'utf-8'));
      const deletedTask = tasks.find((task: { id: number }) => task.id === taskIdToDelete);
      expect(deletedTask).toBeUndefined();  // La tâche devrait être supprimée
    });
  
    it('return 404 if task not found', async () => {
      const invalidTaskId = 999;
  
      const response = await request(app)
        .delete(`/delete/${invalidTaskId}`);
  
      expect(response.status).toBe(200);
      expect(response.body.error).toBe('Task not found');
    });

  });


