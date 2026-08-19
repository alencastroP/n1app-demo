// src/services/queueService.js
import { apiFetchJson } from './http';

// Função que busca dados da fila de um shard específico
export async function getQueueStatus(shardId) {
  if (!shardId) throw new Error('Shard inválido');
  return await apiFetchJson(`/api/queues/${shardId}`, { method: 'GET' });
}
