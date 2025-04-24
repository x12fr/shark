const socket = io();
const user = localStorage.getItem("user");
const pass = localStorage.getItem("pass");

if (!user || !pass) location.href = "index.html";

document.getElementById("msg").addEventListener("keydown", e => {
  if (e.key === "Enter") send();
});

socket.emit("login", user);

socket.on("chat", ({ user: u, text }) => {
  const div = document.createElement("div");
  div.innerText = `${u}: ${text}`;
  div.onclick = () => {
    if (u !== user) {
      const msg = prompt(`DM to ${u}:`);
      if (msg) socket.emit("private", { to: u, message: msg });
    }
  };
  document.getElementById("messages").appendChild(div);
});

socket.on("private", ({ from, message }) => {
  alert(`DM from ${from}: ${message}`);
});

socket.on("flash", () => {
  document.body.classList.add("flash");
  setTimeout(() => document.body.classList.remove("flash"), 2000);
});

socket.on("announcement", msg => {
  document.getElementById("announcement").innerText = msg;
});

function send() {
  const msg = document.getElementById("msg").value;
  socket.emit("chat", msg);
  document.getElementById("msg").value = "";
}

function flashUser() {
  const target = document.getElementById("target").value;
  socket.emit("flash", target);
}

function announce() {
  const msg = document.getElementById("announce-text").value;
  socket.emit("announce", msg);
}

if (user === "G0THANGELZ" && pass === "331256444") {
  document.getElementById("admin").style.display = "block";
}
