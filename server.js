const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurando EJS como view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Servindo arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, "public")));

// Rota principal -> renderiza o index.ejs
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
