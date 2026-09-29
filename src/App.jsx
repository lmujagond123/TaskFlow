import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("All");

  const [token, setToken] = useState(
    localStorage.getItem("taskflow_token") || ""
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState(false);
  const [message, setMessage] = useState("");

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function loadTasks() {
    try {
      const data = await request("/tasks");
      setTasks(data);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (token) loadTasks();
  }, [token]);

  async function handleAuth(event) {
    event.preventDefault();
    setMessage("");

    try {
      const data = await request(
        register ? "/register" : "/login",
        {
          method: "POST",
          body: JSON.stringify(
            register
              ? { name, email, password }
              : { email, password }
          ),
        }
      );

      localStorage.setItem("taskflow_token", data.token);
      setToken(data.token);
      setPassword("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      const task = await request("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      setTasks((old) => [task, ...old]);
      setTitle("");
      setDescription("");
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleTask(task) {
    try {
      const updated = await request(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      setTasks((old) =>
        old.map((item) =>
          item.id === task.id ? updated : item
        )
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteTask(id) {
    try {
      await request(`/tasks/${id}`, { method: "DELETE" });
      setTasks((old) => old.filter((task) => task.id !== id));
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("taskflow_token");
    setToken("");
    setTasks([]);
    setMessage("");
  }

  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const visibleTasks = tasks.filter((task) => {
    if (filter === "Pending") return !task.completed;
    if (filter === "Completed") return task.completed;
    return true;
  });

  const styles = `
    * { box-sizing: border-box; }
    body { margin: 0; background: #f4f6fb; font-family: Arial, sans-serif; }
    .page { min-height: 100vh; padding: 30px 16px; color: #20243a; }
    .container { max-width: 1000px; margin: auto; }
    header { display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; gap:12px; }
    .brand { display:flex; align-items:center; gap:12px; }
    .logo { background:#6558e8; color:white; width:48px; height:48px; border-radius:14px; display:grid; place-items:center; font-size:26px; }
    h1 { margin:0; font-size:26px; }
    .subtitle { color:#81869a; margin:5px 0 0; }
    .hero { background:linear-gradient(120deg,#5146d8,#8a70f5); color:white; padding:28px; border-radius:20px; margin-bottom:20px; }
    .hero h2 { margin:0 0 8px; font-size:30px; }
    .hero p { margin:0; color:#e9e6ff; }
    .progress { display:flex; align-items:center; gap:12px; margin-top:22px; font-size:13px; }
    .track { flex:1; height:8px; background:#ffffff55; border-radius:20px; overflow:hidden; }
    .track div { height:100%; background:white; }
    .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-bottom:20px; }
    .stat,.card { background:white; border:1px solid #e8eaf2; border-radius:16px; padding:22px; }
    .stat-label { color:#81869a; font-size:14px; }
    .stat-number { font-size:30px; font-weight:bold; margin-top:8px; }
    .layout { display:grid; grid-template-columns:1fr 1.4fr; gap:20px; align-items:start; }
    h3 { margin:0 0 18px; font-size:19px; }
    label { display:block; margin:14px 0 7px; font-size:14px; font-weight:bold; }
    input,textarea { width:100%; padding:12px; border:1px solid #dfe2ec; border-radius:9px; font:inherit; }
    textarea { min-height:100px; resize:vertical; }
    .primary { width:100%; margin-top:17px; padding:13px; border:0; border-radius:9px; background:#6558e8; color:white; font-weight:bold; cursor:pointer; }
    .task-heading { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
    .task-heading h3 { margin:0; }
    .filters { display:flex; gap:4px; background:#f1f2f8; padding:4px; border-radius:9px; }
    .filter { border:0; padding:8px 10px; border-radius:7px; cursor:pointer; background:transparent; color:#73798d; }
    .filter.active { background:white; color:#5145cf; font-weight:bold; }
    .task-list { display:grid; gap:10px; margin-top:18px; }
    .task { display:flex; gap:12px; align-items:flex-start; padding:15px; border:1px solid #e8eaf2; border-radius:12px; }
    .task input { width:18px; height:18px; margin-top:2px; }
    .task-content { flex:1; min-width:0; }
    .task-title { font-weight:bold; overflow-wrap:anywhere; }
    .task.done .task-title { text-decoration:line-through; color:#999; }
    .task-description { color:#777f92; font-size:14px; margin-top:6px; white-space:pre-wrap; overflow-wrap:anywhere; }
    .delete { border:0; background:transparent; color:#a0a5b4; font-size:23px; cursor:pointer; }
    .empty { text-align:center; padding:35px 10px; color:#858b9e; }
    .message { color:#b42318; background:#fff0ef; padding:10px; border-radius:8px; margin:12px 0; overflow-wrap:anywhere; }
    .link { color:#5145cf; background:none; border:0; cursor:pointer; margin-top:15px; }
    footer { text-align:center; color:#999; font-size:12px; margin-top:25px; }
    @media(max-width:700px) { .layout { grid-template-columns:1fr; } .stats { gap:8px; } .stat { padding:14px; } .stat-number { font-size:24px; } }
  `;

  return (
    <div className="page">
      <style>{styles}</style>
      <main className="container">
        <header>
          <div className="brand">
            <div className="logo">✓</div>
            <div>
              <h1>TaskFlow</h1>
              <p className="subtitle">Plan your day. Get things done.</p>
            </div>
          </div>
          {token && <button onClick={logout}>Log out</button>}
        </header>

        {!token ? (
          <section className="card" style={{ maxWidth: 450, margin: "40px auto" }}>
            <h3>{register ? "Create an account" : "Welcome back"}</h3>
            <form onSubmit={handleAuth}>
              {register && (
                <>
                  <label>Your name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </>
              )}
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              {message && <div className="message">{message}</div>}
              <button className="primary" type="submit">
                {register ? "Register" : "Login"}
              </button>
            </form>
            <button className="link" onClick={() => { setRegister(!register); setMessage(""); }}>
              {register ? "Already have an account? Login" : "New here? Create an account"}
            </button>
          </section>
        ) : (
          <>
            <section className="hero">
              <h2>Make today count ✨</h2>
              <p>Small steps every day lead to big results.</p>
              <div className="progress">
                <span>{progress}% complete</span>
                <div className="track"><div style={{ width: `${progress}%` }} /></div>
                <span>{completed}/{tasks.length}</span>
              </div>
            </section>

            <section className="stats">
              <div className="stat"><div className="stat-label">📋 Total Tasks</div><div className="stat-number">{tasks.length}</div></div>
              <div className="stat"><div className="stat-label">⏳ Pending</div><div className="stat-number">{pending}</div></div>
              <div className="stat"><div className="stat-label">✅ Completed</div><div className="stat-number">{completed}</div></div>
            </section>

            {message && <div className="message">{message}</div>}

            <section className="layout">
              <form className="card" onSubmit={addTask}>
                <h3>＋ Add a New Task</h3>
                <label>Task title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish project report" maxLength={100} required />
                <label>Description (optional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a few details..." maxLength={500} />
                <button className="primary" type="submit">+ Create Task</button>
              </form>

              <section className="card">
                <div className="task-heading">
                  <h3>My Tasks</h3>
                  <div className="filters">
                    {["All", "Pending", "Completed"].map((name) => (
                      <button key={name} type="button" className={`filter ${filter === name ? "active" : ""}`} onClick={() => setFilter(name)}>{name}</button>
                    ))}
                  </div>
                </div>

                <div className="task-list">
                  {visibleTasks.length === 0 ? (
                    <div className="empty"><div style={{ fontSize: 30 }}>📝</div><strong>No tasks yet</strong><span>Add a task using the form.</span></div>
                  ) : visibleTasks.map((task) => (
                    <article className={`task ${task.completed ? "done" : ""}`} key={task.id}>
                      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} aria-label="Mark task complete" />
                      <div className="task-content">
                        <div className="task-title">{task.title}</div>
                        {task.description && <div className="task-description">{task.description}</div>}
                      </div>
                      <button className="delete" type="button" onClick={() => deleteTask(task.id)} aria-label="Delete task">×</button>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          </>
        )}
        <footer>TaskFlow · Your simple daily task manager</footer>
      </main>
    </div>
  );
}