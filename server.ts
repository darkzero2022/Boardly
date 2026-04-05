import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { SOCKET_EVENTS } from "./lib/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // bind to all interfaces for LAN access
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Attach Socket.io to the same HTTP server
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Make io globally accessible for API routes to emit events
  (globalThis as Record<string, unknown>).__socketio = io;

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join a board room for scoped real-time updates
    socket.on(SOCKET_EVENTS.JOIN_BOARD, (boardId: string) => {
      socket.join(`board:${boardId}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_BOARD, (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`\n> KanBoard ready on http://${hostname}:${port}`);
    console.log(`> LAN access: http://[your-local-ip]:${port}`);
    console.log(`> Socket.io attached on /socket.io\n`);

    // Start background jobs after server is ready
    import("./lib/sla/engine").then(({ startSLACron }) => {
      startSLACron();
      console.log("> SLA engine started (runs every 15 minutes)");
    });
    import("./lib/recurring/scheduler").then(({ startRecurringCron }) => {
      startRecurringCron();
    });
  });
});

// Helper to get the io instance from API routes
export function getIO(): SocketIOServer | null {
  return ((globalThis as Record<string, unknown>).__socketio as SocketIOServer) ?? null;
}
