import app from "./App";

const port = process.env.PORT || 3000;

app.listen(port)
  .catch((err) => console.log(err));
