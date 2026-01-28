import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Edit2, X, GripVertical, Globe, Check } from 'lucide-react';
import { NavService, NavigationCategory, NavigationItem } from '../services/navService';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';

// Sortable Item Component
const SortableItem = ({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
        <GripVertical className="w-4 h-4" />
      </div>
      {children}
    </div>
  );
};

export default function Manage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<NavigationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<NavigationCategory> | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryId: string, item: Partial<NavigationItem> } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await NavService.getAll();
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to load navigations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await NavService.update(categories);
      alert('保存成功！');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // Category Operations
  const addCategory = () => {
    const newCat: NavigationCategory = {
      id: Date.now().toString(),
      name: '新分类',
      icon: 'folder',
      sort_order: categories.length + 1,
      items: []
    };
    setCategories([...categories, newCat]);
    setEditingCategory(newCat);
  };

  const updateCategory = (id: string, updates: Partial<NavigationCategory>) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
    setEditingCategory(null);
  };

  const deleteCategory = (id: string) => {
    if (confirm('确定要删除这个分类及其所有内容吗？')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  // Item Operations
  const addItem = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const newItem: NavigationItem = {
      id: Date.now().toString(),
      title: '新网站',
      url: 'https://',
      description: '描述',
      sort_order: category.items.length + 1,
      favicon: ''
    };

    const newCategories = categories.map(c => {
      if (c.id === categoryId) {
        return { ...c, items: [...c.items, newItem] };
      }
      return c;
    });

    setCategories(newCategories);
    setEditingItem({ categoryId, item: newItem });
  };

  const updateItem = (categoryId: string, itemId: string, updates: Partial<NavigationItem>) => {
    const newCategories = categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          items: c.items.map(item => item.id === itemId ? { ...item, ...updates } : item)
        };
      }
      return c;
    });
    setCategories(newCategories);
    setEditingItem(null);
  };

  const cancelEditItem = (categoryId: string, itemId: string) => {
    // If item was just added (has default values) and we cancel, remove it
    const category = categories.find(c => c.id === categoryId);
    const item = category?.items.find(i => i.id === itemId);
    
    if (item && item.title === '新网站' && item.url === 'https://') {
      const newCategories = categories.map(c => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.filter(i => i.id !== itemId) };
        }
        return c;
      });
      setCategories(newCategories);
    }
    setEditingItem(null);
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    if (confirm('确定要删除这个网站吗？')) {
      const newCategories = categories.map(c => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.filter(item => item.id !== itemId) };
        }
        return c;
      });
      setCategories(newCategories);
    }
  };

  // Drag and Drop Handlers
  const handleDragEnd = (event: DragEndEvent, categoryId?: string) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      if (categoryId) {
        // Sorting items within a category
        const categoryIndex = categories.findIndex(c => c.id === categoryId);
        const category = categories[categoryIndex];
        const oldIndex = category.items.findIndex(i => i.id === active.id);
        const newIndex = category.items.findIndex(i => i.id === over?.id);

        const newItems = arrayMove(category.items, oldIndex, newIndex);
        // Update sort_order
        newItems.forEach((item, i) => item.sort_order = i + 1);

        const newCategories = [...categories];
        newCategories[categoryIndex] = { ...category, items: newItems };
        setCategories(newCategories);
      } else {
        // Sorting categories
        const oldIndex = categories.findIndex(c => c.id === active.id);
        const newIndex = categories.findIndex(c => c.id === over?.id);

        const newCategories = arrayMove(categories, oldIndex, newIndex);
        // Update sort_order
        newCategories.forEach((c, i) => c.sort_order = i + 1);
        setCategories(newCategories);
      }
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-6 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10 py-4"
        >
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">管理导航</h1>
          </div>
          <div className="flex gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addCategory} 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> 添加分类
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveAll} 
              disabled={saving} 
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存更改'}
            </motion.button>
          </div>
        </motion.div>

        {/* Categories List */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(e)}
        >
          <SortableContext 
            items={categories.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              <AnimatePresence>
                {categories.map((category) => (
                  <SortableItem 
                    key={category.id} 
                    id={category.id}
                    className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                      {editingCategory?.id === category.id ? (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 flex-1"
                        >
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="px-3 py-1.5 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="分类名称"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editingCategory.icon}
                            onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                            className="px-3 py-1.5 border rounded-lg w-24 dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="图标"
                          />
                          <button onClick={() => updateCategory(category.id, editingCategory)} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditingCategory(null)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"><X className="w-4 h-4" /></button>
                        </motion.div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <h2 className="text-lg font-semibold">{category.name}</h2>
                          <span className="text-xs text-zinc-400">({category.items.length})</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingCategory(category)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteCategory(category.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Items List */}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(e, category.id)}
                    >
                      <SortableContext 
                        items={category.items.map(i => i.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <AnimatePresence>
                            {category.items.map((item) => (
                              <SortableItem
                                key={item.id}
                                id={item.id}
                                className="flex items-start gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 hover:shadow-md bg-zinc-50/50 dark:bg-zinc-700/30 transition-shadow group relative"
                              >
                                {editingItem?.item.id === item.id ? (
                                  <div className="flex flex-col gap-2 w-full">
                                    <input
                                      type="text"
                                      value={editingItem.item.title}
                                      onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, title: e.target.value } })}
                                      className="px-2 py-1 border rounded text-sm dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                      placeholder="标题"
                                      autoFocus
                                    />
                                    <input
                                      type="text"
                                      value={editingItem.item.url}
                                      onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, url: e.target.value } })}
                                      className="px-2 py-1 border rounded text-sm dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                      placeholder="URL"
                                    />
                                    <input
                                      type="text"
                                      value={editingItem.item.description}
                                      onChange={e => setEditingItem({ ...editingItem, item: { ...editingItem.item, description: e.target.value } })}
                                      className="px-2 py-1 border rounded text-sm dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                      placeholder="描述"
                                    />
                                    
                                    {/* Icon Selection */}
                                    <div className="mt-2">
                                      <div className="text-xs text-zinc-500 mb-1">选择图标:</div>
                                      <div className="flex gap-2">
                                        <div 
                                          onClick={() => setEditingItem({ ...editingItem, item: { ...editingItem.item, favicon: '' } })}
                                          className={classNames(
                                            "w-10 h-10 rounded border flex items-center justify-center cursor-pointer transition-colors relative",
                                            !editingItem.item.favicon ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-zinc-200 dark:border-zinc-600 hover:border-zinc-400"
                                          )}
                                        >
                                          <Globe className="w-5 h-5 text-zinc-500" />
                                          {!editingItem.item.favicon && <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5"><Check className="w-2 h-2 text-white" /></div>}
                                        </div>
                                        <div 
                                          onClick={() => setEditingItem({ ...editingItem, item: { ...editingItem.item, favicon: getFaviconUrl(editingItem.item.url || '') } })}
                                          className={classNames(
                                            "w-10 h-10 rounded border flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
                                            editingItem.item.favicon ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-zinc-200 dark:border-zinc-600 hover:border-zinc-400"
                                          )}
                                        >
                                          <img 
                                            src={getFaviconUrl(editingItem.item.url || '')} 
                                            alt="" 
                                            className="w-6 h-6"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                          />
                                          <Globe className="w-5 h-5 text-zinc-500 hidden" />
                                          {editingItem.item.favicon && <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5"><Check className="w-2 h-2 text-white" /></div>}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-2 mt-2">
                                      <button onClick={() => updateItem(category.id, item.id, editingItem.item)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">确定</button>
                                      <button onClick={() => cancelEditItem(category.id, item.id)} className="px-2 py-1 text-xs bg-zinc-400 text-white rounded hover:bg-zinc-500 transition-colors">取消</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 rounded bg-zinc-200 dark:bg-zinc-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                      {item.favicon ? (
                                        <img src={item.favicon} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${item.url}&sz=64`)} />
                                      ) : (
                                        <Globe className="w-6 h-6 text-zinc-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate text-zinc-900 dark:text-zinc-100">{item.title}</div>
                                      <div className="text-xs text-zinc-500 truncate">{item.url}</div>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity absolute right-2 top-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded shadow-sm z-20">
                                      <div className="flex gap-1">
                                        <button onClick={() => setEditingItem({ categoryId: category.id, item })} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded transition-colors"><Edit2 className="w-3 h-3" /></button>
                                        <button onClick={() => deleteItem(category.id, item.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </SortableItem>
                            ))}
                          </AnimatePresence>
                          <motion.button
                            layout
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addItem(category.id)}
                            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:text-blue-500 hover:border-blue-500 transition-colors h-[86px]"
                          >
                            <Plus className="w-5 h-5" />
                            <span>添加网站</span>
                          </motion.button>
                        </div>
                      </SortableContext>
                    </DndContext>
                  </SortableItem>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
