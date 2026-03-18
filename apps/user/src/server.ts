import app from "./app";

const PORT = 5002;

app.listen(PORT, () => {
  console.log(`Users service running on ${PORT}`);
});