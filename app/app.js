const express = require('express');
const app = express();

const version = process.env.APP_VERSION || "1.0.0";
const healthMode = process.env.HEALTH_MODE || "success";

app.get('/', (req, res) => {
  res.send(`App running - Version: ${version}`);
});

app.get('/health', (req, res) => {
  if (healthMode === "fail") {
    return res.status(500).send("FAIL");
  }
  res.send("OK");
});

app.listen(3000, () => {
  console.log(`App running on port 3000 - Version: ${version}`);
});