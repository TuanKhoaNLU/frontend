import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import apiClient from "../../api/client";

/**
 * Hook quản lý kết nối STOMP WebSocket cho một phòng Live.
 * Thay thế cơ chế HTTP Polling cũ.
 * @param {string} sessionId ID của session (dùng để fetch dữ liệu ban đầu).
 */
export function useLiveSession(sessionId) {
  const [session, setSession] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");
  const stompClientRef = useRef(null);
  const isFetchingInitialRef = useRef(false);

  // Fetch trạng thái ban đầu bằng REST API
  const fetchInitialData = useCallback(async () => {
    if (!sessionId || isFetchingInitialRef.current) return;
    isFetchingInitialRef.current = true;
    try {
      const [stateRes, lbRes] = await Promise.all([
        apiClient.get(`/live/sessions/${sessionId}`),
        apiClient.get(`/live/sessions/${sessionId}/leaderboard`)
      ]);
      setSession(stateRes.data);
      setLeaderboard(lbRes.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Không tải được dữ liệu phòng.");
    } finally {
      isFetchingInitialRef.current = false;
    }
  }, [sessionId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Thiết lập kết nối STOMP khi đã có PIN từ initial data
  useEffect(() => {
    const pin = session?.pin;
    if (!pin) return;

    // Vite proxy /ws tới Spring Boot Backend
    // Dùng URL tĩnh tuyệt đối để SockJS hoạt động mượt ở local.
    const socketUrl = `${window.location.protocol}//${window.location.host}/ws`;

    const client = new Client({
      // Vì đang dùng SockJS, chúng ta phải cung cấp webSocketFactory thay vì brokerURL
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("STOMP Connected to room:", pin);
        
        // Đăng ký nhận tin nhắn broadcast
        client.subscribe(`/topic/room/${pin}`, (message) => {
          try {
            const body = JSON.parse(message.body);
            if (body.session) {
              setSession(body.session);
            }
            if (body.leaderboard) {
              setLeaderboard(body.leaderboard);
            }
          } catch (err) {
            console.error("Lỗi parse message từ WebSocket", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
        setError("Mất kết nối thời gian thực.");
      },
      onWebSocketError: (err) => {
        console.error("WebSocket Error:", err);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [session?.pin]); // Chỉ trigger lại khi PIN thay đổi (rất hiếm khi xảy ra)

  return { session, leaderboard, error, setSession, setLeaderboard, setError };
}
