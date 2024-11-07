import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import app from './app';   
import nodemailer from 'nodemailer'; 



describe('POST /newtasks', () => {
  it('create a new task', async () => {
    const response = await request(app)
      .post('/newtasks')
      .send({ title: 'Test Task', content: 'This is a test task' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Task');
    expect(response.body.content).toBe('This is a test task');
  });

  it('return error 400', async () => {
    const response = await request(app)
      .post('/newtasks')
      .send({ content: 'This task has no title' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Task title is required');
  });
});



// config du mock nodemailer
jest.mock('nodemailer', () => {
  const sendMailMock = jest.fn().mockResolvedValue('Email sent successfully');
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: sendMailMock,
    }),
    __sendMailMock__: sendMailMock,
  };
});

//extraire mock pour l'utiliser dans les tests
const { __sendMailMock__: sendMailMock } = require('nodemailer');

describe('POST /newtasks', () => {
  beforeEach(() => {
    sendMailMock.mockClear();
  });

  it('send email for newtask', async () => {
    const response = await request(app)
      .post('/newtasks')
      .send({ title: 'Test Task', content: 'Test content for the task' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Task');
    expect(response.body.content).toBe('Test content for the task');

    // verifie que `sendMail` a ete appele avec les bons params
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(String),
        to: expect.any(String),
        subject: 'New Task Created',
        text: expect.stringContaining('Test Task'),
      })
    );
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



let tasks = [{ id: 1, title: 'Old Title', content: 'Old Content' }]; //liste tache simulee

const tasksFilePath = path.join(__dirname, 'tasks.json');

//fonction pour preparer le JSON
const resetTasksFile = (tasks: Array<{ id: number; title: string; content: string }>) => {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf-8');
};

describe('PUT /update/:id', () => {
  beforeEach(() => {
    const initialTasks = [{ id: 1, title: 'Old Title', content: 'Old Content' }];
    resetTasksFile(initialTasks);  // reinitialise les taches avant chaque test
  });

  it('should update task and return updated task', async () => {
    const updatedTask = { title: 'Updated Title', content: 'Updated Content' };

    const response = await request(app)
      .put('/update/3') 
      .send(updatedTask);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe(updatedTask.title);
    expect(response.body.content).toBe(updatedTask.content);
  });

  it('should update task in the JSON file', () => {
    const updatedTask = { title: 'Updated Title', content: 'Updated Content' };

    //execute la requete PUT pour maj la tache
    request(app)
      .put('/update/1')
      .send(updatedTask)
      .end(() => {
        //lire le fichier json apres maj
        const tasksInFile = JSON.parse(fs.readFileSync(tasksFilePath, 'utf-8'));
        const updatedTaskInFile = tasksInFile.find((task: { id: number }) => task.id === 1);

        //verifie que la tache soit maj
        expect(updatedTaskInFile).toBeTruthy();
        expect(updatedTaskInFile?.title).toBe('Updated Title');
        expect(updatedTaskInFile?.content).toBe('Updated Content');
      });
  });
});


describe('DELETE /delete/:id', () => {
    it('delete a task', async () => {
      //cree fausse tache pour tester la supp
      const taskId = 1;
      tasks.push({ id: taskId, title: 'Test Task', content: 'This is a test task' });
  
      const response = await request(app)
        .delete(`/delete/${taskId}`)
        .expect(200);
  
      //verifie la reponse
      expect(response.body.message).toBe(`Task with ID ${taskId} deleted successfully`);
      expect(response.body.deletedTask).toEqual({ id: taskId, name: 'Test Task' });
  
      //verifie que la tache a ete supp
      const taskExists = tasks.some(task => task.id === taskId);
      expect(taskExists).toBe(false);
    });
  
    it('return a 404 if the task is not found', async () => {
      const response = await request(app)
        .delete('/delete/999')
        .expect(404);
  
      expect(response.body.error).toBe('Task not found');
    });
  });

  

//monsieur je comprend pas mes tests pour la suppression fonctionnent pas pourtant sur postman mes tâches se suppriment, j'ai donné mon âme pour ce test mais qui sait peut-être qu'il voulait ma mère aussi 
//en plus il refuse toujours mes "return" dans mon app.ts 