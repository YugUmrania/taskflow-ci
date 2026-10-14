// Practical 12 - automated tests that run in CI (GitHub Actions).
//
// The Mongoose model and the event bus are mocked so the suite runs without a
// real MongoDB instance and exits cleanly inside the CI runner.
const request = require('supertest');

jest.mock('../models/Task', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../events', () => ({
  emit: jest.fn(),
  on: jest.fn(),
}));

const Task = require('../models/Task');
const app = require('../app');

describe('Task Management API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /tasks returns 200 and a list of tasks', async () => {
    Task.find.mockResolvedValue([{ _id: '1', title: 'Sample task' }]);

    const res = await request(app).get('/tasks');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  test('POST /tasks returns 201 and the created task', async () => {
    Task.create.mockResolvedValue({ _id: '2', title: 'New task', completed: false });

    const res = await request(app).post('/tasks').send({ title: 'New task' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('New task');
  });

  test('GET /tasks/:id rejects an invalid id with 400', async () => {
    const res = await request(app).get('/tasks/not-a-valid-id');
    expect(res.statusCode).toBe(400);
  });

  test('an unknown route returns 404', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.statusCode).toBe(404);
  });
});
