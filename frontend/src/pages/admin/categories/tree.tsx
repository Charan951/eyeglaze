import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';

interface TreeNode {
  id: string;
  name: string;
  code: string;
  slug: string;
  type: 'Category' | 'SubCategory' | 'SubSubCategory' | 'SubSubSubCategory';
  categoryId?: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  children?: TreeNode[];
}

export default function CategoryTreeView() {
  const navigate = useNavigate();
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const getAllNodeIds = (nodes: TreeNode[]): Record<string, boolean> => {
    let result: Record<string, boolean> = {};
    nodes.forEach(node => {
      result[node.id] = true;
      if (node.children && node.children.length > 0) {
        result = { ...result, ...getAllNodeIds(node.children) };
      }
    });
    return result;
  };

  useEffect(() => {
    api.get('/admin/categories/tree')
      .then(res => {
        const tree = res.data.tree || [];
        setTreeData(tree);
        // Expand all levels by default
        setExpandedNodes(getAllNodeIds(tree));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    setExpandedNodes(getAllNodeIds(treeData));
  };

  const handleCollapseAll = () => {
    setExpandedNodes({});
  };

  const getObjId = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'object') return val._id || val.id || '';
    return String(val);
  };

  const renderNode = (node: TreeNode, depth = 0, parentCatId?: string, parentSubCatId?: string) => {
    const hasChildren = node.children && node.children.length > 0;
    const nodeId = getObjId(node.id || (node as any)._id);
    const isExpanded = !!expandedNodes[nodeId];

    // Determine current chain for child creation
    const currentCatId = node.type === 'Category' ? nodeId : parentCatId || getObjId(node.categoryId);
    const currentSubCatId = node.type === 'SubCategory' ? nodeId : parentSubCatId || getObjId(node.subCategoryId);
    const currentSubSubCatId = node.type === 'SubSubCategory' ? nodeId : getObjId(node.subSubCategoryId);

    return (
      <div key={node.id} className="space-y-1">
        <div 
          className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-[#131314] hover:bg-[#1C1C1E] border border-zinc-800 transition-colors w-full cursor-pointer select-none"
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => hasChildren && toggleExpand(node.id)}
        >
          {/* Collapse/Expand indicator */}
          {hasChildren ? (
            <span className="text-[#D4A04D] text-xs w-4 text-center font-bold">
              {isExpanded ? '▼' : '►'}
            </span>
          ) : (
            <span className="w-4 text-center text-gray-600 text-xs">•</span>
          )}

          {/* Level Tag */}
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
            node.type === 'Category' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
            node.type === 'SubCategory' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
            node.type === 'SubSubCategory' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
            'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}>
            {node.type}
          </span>

          <span className="text-white text-xs font-bold">{node.name}</span>
          <span className="text-gray-500 text-[10px] font-mono">({node.slug})</span>

          <div className="flex-1" />

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {/* Direct Add Child Button */}
            {node.type === 'Category' && (
              <button
                type="button"
                onClick={() => navigate(`/admin/categories/add?type=SubCategory&categoryId=${nodeId}`)}
                className="bg-[#D4A04D]/15 hover:bg-[#D4A04D]/25 border border-[#D4A04D]/30 text-[#D4A04D] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                + Sub-Category
              </button>
            )}
            {node.type === 'SubCategory' && (
              <button
                type="button"
                onClick={() => navigate(`/admin/categories/add?type=SubSubCategory&categoryId=${currentCatId}&subCategoryId=${nodeId}`)}
                className="bg-[#D4A04D]/15 hover:bg-[#D4A04D]/25 border border-[#D4A04D]/30 text-[#D4A04D] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                + Sub-Sub
              </button>
            )}
            {node.type === 'SubSubCategory' && (
              <button
                type="button"
                onClick={() => navigate(`/admin/categories/add?type=SubSubSubCategory&categoryId=${currentCatId}&subCategoryId=${currentSubCatId}&subSubCategoryId=${nodeId}`)}
                className="bg-[#D4A04D]/15 hover:bg-[#D4A04D]/25 border border-[#D4A04D]/30 text-[#D4A04D] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                + Sub-Sub-Sub
              </button>
            )}

            {/* Action button to edit directly */}
            <button 
              type="button"
              onClick={() => navigate(`/admin/categories/edit/${node.type}/${nodeId}`)}
              className="text-gray-400 hover:text-white hover:underline text-[10px] font-bold uppercase bg-transparent border-none cursor-pointer"
            >
              Edit
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map(child => renderNode(child, depth + 1, currentCatId, currentSubCatId))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-white select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">Category Hierarchy Tree</h1>
          <p className="text-xs text-gray-500 font-semibold">Complete visual mapping of product catalog categories & sub-levels</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExpandAll}
            className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-700 text-white font-bold py-2 px-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button 
            onClick={handleCollapseAll}
            className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-700 text-white font-bold py-2 px-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Collapse All
          </button>
          <button 
            onClick={() => navigate('/admin/categories')} 
            className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors border-none cursor-pointer"
          >
            ← Back to List
          </button>
        </div>
      </div>

      <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-16 animate-pulse text-xs">Assembling category tree nodes...</div>
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
