import express from 'express';
import bodyParser from 'body-parser';
import { USERS, ORDERS } from './db.js';
import { authorizationMiddleware } from './middlewares.js';

const app = express();

app.use(bodyParser.json());

/**
 * POST -- create resource
 * req -> input data
 * res -> output data
 */
app.post('/users', (req, res) => {
  const { body } = req;

  console.log(`body`, JSON.stringify(body));

  const isUserExist = USERS.some(el => el.login === body.login);
  if (isUserExist) {
    return res.status(400).send({ message: `user with login ${body.login} already exists` });
  }

  USERS.push(body);

  res.status(200).send({ message: 'User was created' });
});

app.get('/users', (req, res) => {
  const users = USERS.map(user => {
    const { password, ...other } = user;
    return other;
  });
  return res
    .status(200)
    .send(users);
});

app.post('/login', (req, res) => {
  const { body } = req;

  const user = USERS
    .find(el => el.login === body.login && el.password === body.password);

  if (!user) {
    return res.status(400).send({ message: 'User was not found' });
  }

  const token = crypto.randomUUID();

  user.token = token;
  USERS.save(user.login, { token });

  return res.status(200).send({
    token,
    message: 'User was login'
  });
});

app.post('/orders', authorizationMiddleware, (req, res) => {
  const { body, user } = req;
  const randomPrice = Math.floor(Math.random() * (100 - 20 + 1)) + 20;
  const order = {
    ...body,
    login: user.login,
    price: randomPrice
  };

  ORDERS.push(order);

  return res.status(200).send({ message: 'Order was created', order });
});

app.get('/orders', authorizationMiddleware, (req, res) => {
  const { user } = req;

  const orders = ORDERS.filter(el => el.login === user.login);

  return res.status(200).send(orders);
});

app.get('/address/from/last-5', authorizationMiddleware, (req, res) => {
  const { user } = req;
  const orders = ORDERS.filter(el => el.login === user.login);
  const uniqueAddresses = Array.from(new Set(orders.map((orders) => orders.from)));
  const last5fromAdresses = uniqueAddresses.slice(-5);

  if (last5fromAdresses.length == 0) {
    return res.status(400).send({ message: 'User do not have orders yet' });
  }

  return res.status(200).send(last5fromAdresses);
});

app.get('/address/to/last-3', authorizationMiddleware, (req, res) => {
  const { user } = req;
  const orders = ORDERS.filter(el => el.login === user.login);
  const uniqueAddresses = Array.from(new Set(orders.map((orders) => orders.to)));
  const last3toAdresses = uniqueAddresses.slice(-3);

  if (last3toAdresses.length == 0) {
    return res.status(400).send({ message: 'User do not have orders yet' });
  }

  return res.status(200).send(last3toAdresses);
});

app.get('/lowest/price', authorizationMiddleware, (req, res) => {
  const { user } = req;
  const orders = ORDERS.filter(el => el.login === user.login);
  const prices = orders.map(order => order.price);
  // const lowestPrice = Math.min(0,...orders.price);
  // const lowestPrice = numbers.orders((a, b) => Math.min(a, b));
  const lowestPrice = Math.min(...prices);
  const result = [];

  for (const order of orders) {
    if (order.price === lowestPrice) {
      result.push(order);
    }
  };

  if (orders.length == 0) {
    return res.status(400).send({ message: 'Orders were not found' })
  };

  return res.status(200).json(result[0]);
});

app.get('/biggest/price', authorizationMiddleware, (req, res) => {
  const { user } = req;
  const orders = ORDERS.filter(el => el.login === user.login);
  const prices = orders.map(order => order.price);
  const biggestPrice = Math.max(...prices);
  const result = [];

  for (const order of orders) {
    if (order.price === biggestPrice) {
      result.push(order);
    }
  };

  if (orders.length == 0) {
    return res.status(400).send({ message: 'Orders were not found' })
  };

  return res.status(200).json(result[0]);
});

app.listen(8080, () => console.log('Server was started'));