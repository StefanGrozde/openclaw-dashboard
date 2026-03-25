import { useState } from 'react';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown } from 'lucide-react';
import { getFileNode } from '../api/files.api';
import ErrorBanner from '../components/ui/ErrorBanner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useFileTree } from '../hooks/useFileTree';
import type { FileNode } from '../types';

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTreeNode({
  node,
  depth = 0,
  selected,
  onSelect,
}: {
  node: FileNode;
  depth?: number;
  selected: string | null;
  onSelect: (node: FileNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [loadedChildren, setLoadedChildren] = useState<FileNode[] | undefined>(node.children);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const isDir = node.type === 'directory';
  const isSelected = selected === node.id;
  const children = loadedChildren ?? node.children;

  async function handleToggle(nextExpanded: boolean) {
    setExpanded(nextExpanded);

    if (!isDir || !nextExpanded || children !== undefined) {
      return;
    }

    setIsLoadingChildren(true);

    try {
      const result = await getFileNode(node.path);
      const nextChildren = result.children ?? [];
      const nextNode = { ...node, children: nextChildren };
      setLoadedChildren(nextChildren);

      if (isSelected) {
        onSelect(nextNode);
      }
    } finally {
      setIsLoadingChildren(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => {
          const nextNode = { ...node, children };
          if (isDir) {
            void handleToggle(!expanded);
          }
          onSelect(nextNode);
        }}
        className={`w-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors text-left group ${
          isSelected ? 'bg-blue-600/15 text-blue-400' : 'text-gray-400 hover:bg-[#141c2e] hover:text-gray-200'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {isDir ? (
          <>
            <span className="text-gray-600 shrink-0">
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            {expanded
              ? <FolderOpen size={14} className="text-yellow-500 shrink-0" />
              : <Folder size={14} className="text-yellow-500 shrink-0" />}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <File size={14} className="text-blue-400 shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
        {isDir && isLoadingChildren ? <LoadingSpinner size="sm" /> : null}
        {!isDir && node.size && (
          <span className="ml-auto text-[10px] text-gray-600 shrink-0">{formatSize(node.size)}</span>
        )}
      </button>

      {isDir && expanded && children && (
        <div>
          {children.map(child => (
            <FileTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const extIcon: Record<string, string> = {
  py: '🐍', yaml: '📄', yml: '📄', json: '📋', csv: '📊',
  pdf: '📕', md: '📝', log: '📃',
};

export default function FileSystem() {
  const { data: rootNode, isLoading, error } = useFileTree();
  const [selected, setSelected] = useState<FileNode | null>(null);

  const ext = selected?.name.split('.').pop() ?? '';

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">File System</h1>
        <p className="text-gray-500 text-sm mt-0.5">Browse the Openclaw system file structure</p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Tree */}
        <div className="w-72 bg-[#0e1320] border border-[#1a2236] rounded-xl p-2 overflow-y-auto shrink-0">
          {rootNode ? <FileTreeNode node={rootNode} selected={selected?.id ?? null} onSelect={setSelected} /> : null}
        </div>

        {/* Detail panel */}
        <div className="flex-1 bg-[#0e1320] border border-[#1a2236] rounded-xl p-6">
          {selected ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#141c2e] border border-[#1a2236] rounded-xl flex items-center justify-center text-2xl">
                  {selected.type === 'directory' ? '📁' : extIcon[ext] ?? '📄'}
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">{selected.name}</h2>
                  <p className="text-gray-500 text-sm font-mono">{selected.path}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#141c2e] border border-[#1a2236] rounded-lg p-4">
                  <div className="text-gray-500 text-xs mb-1">Type</div>
                  <div className="text-white capitalize">{selected.type}</div>
                </div>
                <div className="bg-[#141c2e] border border-[#1a2236] rounded-lg p-4">
                  <div className="text-gray-500 text-xs mb-1">Size</div>
                  <div className="text-white">{formatSize(selected.size)}</div>
                </div>
                <div className="bg-[#141c2e] border border-[#1a2236] rounded-lg p-4">
                  <div className="text-gray-500 text-xs mb-1">Last Modified</div>
                  <div className="text-white">{new Date(selected.modified).toLocaleString()}</div>
                </div>
                {selected.type === 'directory' && (
                  <div className="bg-[#141c2e] border border-[#1a2236] rounded-lg p-4">
                    <div className="text-gray-500 text-xs mb-1">Items</div>
                    <div className="text-white">{selected.children?.length ?? 0} items</div>
                  </div>
                )}
              </div>

              {selected.type === 'directory' && selected.children && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Contents</h3>
                  <div className="space-y-1">
                    {selected.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => setSelected(child)}
                        className="w-full flex items-center gap-3 p-2.5 bg-[#141c2e] hover:bg-[#1a2236] border border-[#1a2236] rounded-lg text-sm text-left transition-colors"
                      >
                        {child.type === 'directory' ? <Folder size={14} className="text-yellow-500" /> : <File size={14} className="text-blue-400" />}
                        <span className="text-gray-300 flex-1">{child.name}</span>
                        <span className="text-gray-600 text-xs">{formatSize(child.size)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <Folder size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Select a file or directory to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
