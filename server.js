import express from 'express';
import indexRouter from './routes/index';

const app = express();
const PORT = process.env.PORT || 5000;

app.use('/', indexRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
