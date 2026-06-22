import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';

interface TreeNode {
  id: string;
  name: string;
  code: string;
  slug: string;
  type: 'Category' | 'SubCategory' | 'ChildCategory' | 'Collection';
  children?: TreeNode[];
}

export default function CategoryTreeView() {
  const navigate = useNavigate();
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get('/admin/categories/tree')
      .then(res => {
        setTreeData(res.data.tree || []);
        // Expand all top levels by default
        const initialExpanded: Record<string, boolean> = {};
        res.data.tree?.forEach((node: TreeNode) => {
          initialExpanded[node.id] = true;
        });
        setExpandedNodes(initialExpanded);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];

    return (
      <div key={node.id} className="space-y-1">
        <div 
          className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-[#131314] hover:bg-[#1C1C1E] border border-zinc-800 transition-colors w-full cursor-pointer select-none"
          style={{ marginLeft: `${depth * 28}px` }}
          onClick={() => hasChildren && toggleExpand(node.id)}
        >
          {/* Collapse/Expand indicator */}
          {hasChildren ? (
            <span className="text-gray-400 text-[10px] w-4 text-center">
              {isExpanded ? '▼' : '►'}
            </span>
          ) : (
            <span className="w-4" />
          )}

          {/* Level Tag */}
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
            node.type === 'Category' ? 'bg-blue-500/10 text-blue-400' :
            node.type === 'SubCategory' ? 'bg-purple-500/10 text-purple-400' :
            node.type === 'ChildCategory' ? 'bg-green-500/10 text-green-400' :
            'bg-yellow-500/10 text-yellow-400'
          }`}>
            {node.type}
          </span>

          <span className="text-white text-xs font-bold">{node.name}</span>
          <span className="text-gray-500 text-[10px] font-mono">({node.code})</span>

          <div className="flex-1" />

          {/* Action button to edit directly */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/categories/edit/${node.type}/${node.id}`);
            }}
            className="text-[#D4A04D] hover:underline text-[10px] font-bold uppercase bg-transparent border-none cursor-pointer"
          >
            Edit
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-white select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">Category Tree View</h1>
          <p className="text-xs text-gray-500 font-semibold">Visual mapping of products catalog hierarchy segments</p>
        </div>
        <button onClick={() => navigate('/admin/categories')} className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-700 text-[#D4A04D] font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
          ← Back to List
        </button>
      </div>

      <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl space-y-4 max-w-4xl">
        {loading ? (
          <div className="text-center text-gray-400 py-16 animate-pulse text-xs">Assembling tree nodes...</div>
        ) : (
          <div className="space-y-2">
            {treeData.map(node => renderNode(node))}
            {treeData.length === 0 && (
              <div className="text-center text-gray-500 py-12 italic text-xs">No catalog hierarchy nodes exist.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
