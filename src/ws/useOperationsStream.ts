import { useEffect, useState } from 'react';
import { wsClient } from './wsClient';
import type { AgentStatus, Operation, TaskStatus, WsEvent } from '../types';

export function useOperationsStream() {
  const [liveOperations, setLiveOperations] = useState<Operation[]>([]);
  const [agentUpdates, setAgentUpdates] = useState<Record<string, AgentStatus>>({});
  const [taskUpdates, setTaskUpdates] = useState<Record<string, { progress: number; status: TaskStatus }>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handleOperation = (event: WsEvent) => {
      if (event.type !== 'operation') {
        return;
      }

      setLiveOperations((current) => [event.data, ...current].slice(0, 200));
      setIsConnected(wsClient.status === 'connected');
    };

    const handleAgentStatus = (event: WsEvent) => {
      if (event.type !== 'agent_status') {
        return;
      }

      setAgentUpdates((current) => ({
        ...current,
        [event.data.id]: event.data.status,
      }));
      setIsConnected(wsClient.status === 'connected');
    };

    const handleTaskProgress = (event: WsEvent) => {
      if (event.type !== 'task_progress') {
        return;
      }

      setTaskUpdates((current) => ({
        ...current,
        [event.data.id]: {
          progress: event.data.progress,
          status: event.data.status,
        },
      }));
      setIsConnected(wsClient.status === 'connected');
    };

    wsClient.connect();
    setIsConnected(wsClient.status === 'connected');
    wsClient.on('operation', handleOperation);
    wsClient.on('agent_status', handleAgentStatus);
    wsClient.on('task_progress', handleTaskProgress);

    const statusInterval = window.setInterval(() => {
      setIsConnected(wsClient.status === 'connected');
    }, 500);

    return () => {
      wsClient.off('operation', handleOperation);
      wsClient.off('agent_status', handleAgentStatus);
      wsClient.off('task_progress', handleTaskProgress);
      window.clearInterval(statusInterval);
      setIsConnected(false);
    };
  }, []);

  return {
    liveOperations,
    agentUpdates,
    taskUpdates,
    isConnected,
  };
}
