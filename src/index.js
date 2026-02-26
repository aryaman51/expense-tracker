const express = require('express');
const usersRouter = require('./routes/users');
const expensesRouter = require('./routes/expenses');

const app = express();
app.use(express.json());

app.use('/users', usersRouter);
app.use('/expenses', expensesRouter);

app.get('/', (req, res) => {
  res.send('Expense Tracker API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
