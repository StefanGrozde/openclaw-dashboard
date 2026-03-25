import { apiRequest } from './client';
import type { FileNode } from '../types';

export async function getFileTree(): Promise<FileNode> {
  return apiRequest<FileNode>('GET', '/files');
}

export async function getFileNode(path: string): Promise<FileNode> {
  return apiRequest<FileNode>('GET', `/files?path=${encodeURIComponent(path)}`);
}
