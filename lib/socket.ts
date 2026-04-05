import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000",
      {
        path: "/socket.io",
        transports: ["websocket", "polling"],
      }
    );
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Socket event names
export const SOCKET_EVENTS = {
  // Board events
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_DELETED: "task:deleted",
  TASK_MOVED: "task:moved",
  // Comment events
  COMMENT_ADDED: "comment:added",
  // Notification events
  NOTIFICATION: "notification",
  // Board room
  JOIN_BOARD: "board:join",
  LEAVE_BOARD: "board:leave",
} as const;
