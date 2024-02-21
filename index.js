const express = require("express");
const app = express();
const PORT = 5000;

const http = require("http");
const server = http.createServer(app);
const cors = require("cors");

const { Server } = require("socket.io");
const socketIO = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.use(cors());
app.use(express.json());

// const socketIO = require("socket.io")(http, {
//   cors: {
//     origin: "http://localhost:5173",
//   },
// });

// Dummy data
const UID = () => Math.random().toString(36).substring(2, 10);

let tasks = {
  pending: {
    title: "pending",
    items: [
      {
        id: UID(),
        title: "Learn Flutter",
        comments: [],
      },
    ],
  },
  ongoing: {
    title: "ongoing",
    items: [
      {
        id: UID(),
        title: "Learning Java",
        comments: [
          {
            name: "",
            text: "",
            id: UID(),
          },
        ],
      },
    ],
  },
  completed: {
    title: "completed",
    items: [
      {
        id: UID(),
        title: "Learned MERN",
        comments: [
          {
            name: "",
            text: "",
            id: UID(),
          },
        ],
      },
    ],
  },
};

app.get("/api", (req, res) => {
  res.json(tasks);
});

socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("createTask", (data) => {
    console.log("data5432", data);
    console.log(data);
    const newTask = { id: UID(), title: data, comments: [] };
    tasks["pending"].items.push(newTask);
    socketIO.sockets.emit("tasks", tasks);
  });

  socket.on("editTask", (data) => {
    console.log("data455", data, tasks);
    const { value, category, id } = data.reduce((acc, obj) => ({ ...acc, ...obj }), {});
    const categoryTasks = tasks[category];
    const index = categoryTasks.items.findIndex(item => item.id === id);

    if (index !== -1) {
        tasks[category].items[index].title = value;
        socketIO.sockets.emit("tasks", tasks);
    }
  });
  
  socket.on('deleteTask', (taskId) => {
    Object.keys(tasks).forEach(category => {
      tasks[category].items = tasks[category].items.filter(item => item.id !== taskId);
    });
    socketIO.sockets.emit('tasks', tasks);
  });

  socket.on("taskDragged", (data) => {
    const { source, destination } = data;
    const itemMoved = {
      ...tasks[source.droppableId].items[source.index],
    };
    tasks[source.droppableId].items.splice(source.index, 1);
    tasks[destination.droppableId].items.splice(
      destination.index,
      0,
      itemMoved
    );
   
    socketIO.sockets.emit("tasks", tasks);
  });

  socket.on("disconnect", () => {
    socket.disconnect();
    console.log("🔥: A user disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
