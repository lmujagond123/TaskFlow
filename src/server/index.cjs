const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const file = path.join(__dirname, "data.json");
let db = { users: [], tasks: [], tokens: {} };

if (fs.existsSync(file)) {
  try {
    db = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {}
}

function save() {
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
}

function hash(password) {
  return crypto.scryptSync(password, "taskflow-salt", 64).toString("hex");
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = db.tokens[token];

  if (!userId) return res.status(401).json({ message: "Please log in" });

  req.userId = userId;
  next();
}

app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Fill all fields" });
  }

  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    password: hash(password)
  };

  db.users.push(user);
  save();

  const token = crypto.randomUUID();
  db.tokens[token] = user.id;
  save();

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(
    u => u.email === email && u.password === hash(password || "")
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = crypto.randomUUID();
  db.tokens[token] = user.id;
  save();

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.get("/api/tasks", auth, (req, res) => {
  res.json(db.tasks.filter(t => t.userId === req.userId));
});

app.post("/api/tasks", auth, (req, res) => {
  const task = {
    id: crypto.randomUUID(),
    userId: req.userId,
    title: req.body.title,
    description: req.body.description || "",
    dueDate: req.body.dueDate || "",
    completed: false
  };

  if (!task.title) {
    return res.status(400).json({ message: "Task title is required" });
  }

  db.tasks.push(task);
  save();
  res.status(201).json(task);
});

app.put("/api/tasks/:id", auth, (req, res) => {
  const task = db.tasks.find(
    t => t.id === req.params.id && t.userId === req.userId
  );

  if (!task) return res.status(404).json({ message: "Task not found" });

  Object.assign(task, req.body, {
    id: task.id,
    userId: task.userId
  });

  save();
  res.json(task);
});

app.delete("/api/tasks/:id", auth, (req, res) => {
  const before = db.tasks.length;

  db.tasks = db.tasks.filter(
    t => !(t.id === req.params.id && t.userId === req.userId)
  );

  if (db.tasks.length === before) {
    return res.status(404).json({ message: "Task not found" });
  }

  save();
  res.json({ message: "Task deleted" });
});

app.listen(5000, () => {
  console.log("TaskFlow backend running at http://localhost:5000");
});