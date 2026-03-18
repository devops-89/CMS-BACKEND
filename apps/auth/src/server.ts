import app from "./app";

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Auth service running on ${PORT}`);
});