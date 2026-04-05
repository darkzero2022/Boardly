"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Socket } from "socket.io-client";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

interface SocketContextValue {
  socket: Socket | null;
  joinBoard: (boardId: string) => void;
  leaveBoard: (boardId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  joinBoard: () => {},
  leaveBoard: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [, forceUpdate] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!session?.user) return;

    const socket = getSocket();
    socketRef.current = socket;
    forceUpdate((n) => n + 1);

    // Join personal notification room
    socket.emit("user:join", session.user.id);

    // Listen for in-app notifications
    socket.on(SOCKET_EVENTS.NOTIFICATION, (notif: { message: string; type: string }) => {
      toast({
        title: notif.type.replace(/_/g, " "),
        description: notif.message,
        variant: notif.type.includes("BREACH") ? "destructive" : "default",
      });
    });

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION);
    };
  }, [session, toast]);

  const joinBoard = (boardId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.JOIN_BOARD, boardId);
  };

  const leaveBoard = (boardId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.LEAVE_BOARD, boardId);
  };

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, joinBoard, leaveBoard }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}
