import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Edit2,
  Folder,
  Globe,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';
import { NavService, NavigationCategory, NavigationItem } from '../services/navService';
import { MetaService } from '../services/metaService';
import { useToastStore } from '../store/toastStore';
import { ConfirmModal } from '../components/ui/ConfirmModal';

type SortableRenderProps = {
  handleAttributes: React.HTMLAttributes<HTMLElement>;
  handleListeners?: Record<string, unknown>;
};

const SortableBlock = ({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (props: SortableRenderProps) => React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    willChange: 'transform',
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children({
        handleAttributes: attributes,
        handleListeners: listeners ?? undefined,
      })}
    </div>
  );
};

export default function Manage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const metaAbortRef = useRef<AbortController | null>(null);

  const [categories, setCategories] = useState<NavigationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<NavigationCategory> | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryId: string; item: Partial<NavigationItem> } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'item'; id: string; categoryId?: string } | null>(null);
  const [metaLoadingItemId, setMetaLoadingItemId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await NavService.getAll();
        setCategories(data.categories);
      } catch (error) {
        console.error('Failed to load navigations:', error);
        addToast('加载失败，请刷新重试', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [addToast]);

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await NavService.update(categories);
      addToast('保存成功！', 'success');
    } catch (error) {
      console.error('Failed to save:', error);
      addToast('保存失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const newCat: NavigationCategory = {
      id: Date.now().toString(),
      name: '新分类',
      icon: 'folder',
      sort_order: categories.length + 1,
      items: [],
    };
    setCategories((prev) => [...prev, newCat]);
    setEditingCategory({ id: newCat.id, name: newCat.name });
  };

  const updateCategory = (id: string, updates: Partial<NavigationCategory>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    setEditingCategory(null);
  };

  const deleteCategory = (id: string) => {
    setDeleteTarget({ type: 'category', id });
  };

  const addItem = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const newItem: NavigationItem = {
      id: Date.now().toString(),
      title: '新网站',
      url: 'https://',
      description: '描述',
      sort_order: category.items.length + 1,
      favicon: '',
    };

    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c))
    );
    setEditingItem({ categoryId, item: newItem });
  };

  const updateItem = (categoryId: string, itemId: string, updates: Partial<NavigationItem>) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          items: c.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
        };
      })
    );
    setEditingItem(null);
  };

  const cancelEditItem = (categoryId: string, itemId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    const item = category?.items.find((i) => i.id === itemId);
    if (item && item.title === '新网站' && item.url === 'https://') {
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c))
      );
    }
    setEditingItem(null);
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    setDeleteTarget({ type: 'item', id: itemId, categoryId });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'category') {
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } else if (deleteTarget.type === 'item' && deleteTarget.categoryId) {
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id !== deleteTarget.categoryId) return c;
          return { ...c, items: c.items.filter((item) => item.id !== deleteTarget.id) };
        })
      );
    }

    setDeleteTarget(null);
  };

  const handleDragEndCategories = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCategories((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      next.forEach((c, i) => (c.sort_order = i + 1));
      return next;
    });
  };

  const handleDragEndItems = (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === categoryId);
      if (idx === -1) return prev;

      const cat = prev[idx];
      const oldIndex = cat.items.findIndex((i) => i.id === active.id);
      const newIndex = cat.items.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(cat.items, oldIndex, newIndex);
      newItems.forEach((it, i) => (it.sort_order = i + 1));

      const next = [...prev];
      next[idx] = { ...cat, items: newItems };
      return next;
    });
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    } catch {
      return '';
    }
  };

  const getGoogleFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  const tryAutofillFromUrl = async (url: string) => {
    if (!editingItem) return;
    if (!url || url === 'https://') return;

    const currentItemId = typeof editingItem.item.id === 'string' ? editingItem.item.id : '__editing__';

    metaAbortRef.current?.abort();
    const controller = new AbortController();
    metaAbortRef.current = controller;
    const timeoutMs = 4500;
    const localTimeout = setTimeout(() => controller.abort(), timeoutMs + 200);
    setMetaLoadingItemId(currentItemId);

    try {
      const meta = await MetaService.get(url, { signal: controller.signal, timeoutMs });
      setEditingItem((prev) => {
        if (!prev) return prev;
        const shouldReplaceTitle =
          !prev.item.title || prev.item.title === '新网站' || /&(#\d+|#x[0-9a-f]+|[a-z]+);/i.test(prev.item.title);
        const shouldReplaceDescription =
          !prev.item.description ||
          prev.item.description === '描述' ||
          /&(#\d+|#x[0-9a-f]+|[a-z]+);/i.test(prev.item.description);

        const nextTitle = shouldReplaceTitle && meta.title ? meta.title : prev.item.title;
        const nextDescription = shouldReplaceDescription && meta.description ? meta.description : prev.item.description;
        const nextFavicon = prev.item.favicon ? prev.item.favicon : meta.favicon || getFaviconUrl(url);
        return { ...prev, item: { ...prev.item, title: nextTitle, description: nextDescription, favicon: nextFavicon } };
      });
    } catch {
      addToast('采集超时或失败', 'info');
      setEditingItem((prev) => {
        if (!prev) return prev;
        if (prev.item.favicon) return prev;
        return { ...prev, item: { ...prev.item, favicon: getFaviconUrl(url) } };
      });
    } finally {
      clearTimeout(localTimeout);
      setMetaLoadingItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 selection:bg-white/10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent" />
        <div className="absolute top-[-12%] left-[-12%] w-[46%] h-[46%] bg-white/[0.03] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-12%] right-[-12%] w-[46%] h-[46%] bg-white/[0.02] rounded-full blur-[140px]" />
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f14]/70 via-[#0b0f14]/45 to-[#0b0f14]/0 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] hover:border-white/[0.15] text-zinc-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">导航管理</h1>
                <p className="text-sm text-zinc-500 mt-1">定制你的个人导航页</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={addCategory}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.06] hover:bg-white/[0.08] text-white border border-white/[0.12] hover:border-white/[0.18] transition-colors"
                title="添加分类"
                aria-label="添加分类"
              >
                <Plus className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveAll}
                disabled={saving}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.06] hover:bg-white/[0.08] text-white border border-white/[0.12] hover:border-white/[0.18] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                title={saving ? '保存中...' : '保存更改'}
                aria-label={saving ? '保存中...' : '保存更改'}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCategories}>
          <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {categories.map((category) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <SortableBlock
                      id={category.id}
                      className="rounded-2xl bg-[#141414]/70 border border-white/[0.06] hover:border-white/[0.10] transition-colors overflow-hidden"
                    >
                      {({ handleAttributes, handleListeners }) => (
                        <div>
                          <div className="px-4 sm:px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent">
                            <div className="flex items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  {...handleAttributes}
                                  {...(handleListeners ?? {})}
                                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] text-zinc-400 hover:text-white transition-colors"
                                  aria-label="拖拽排序"
                                >
                                  <GripVertical className="w-5 h-5" />
                                </button>

                                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center shrink-0">
                                  <Folder className="w-5 h-5 text-zinc-200" />
                                </div>

                                <div className="min-w-0">
                                  {editingCategory?.id === category.id ? (
                                    <div className="max-w-full">
                                      <input
                                        type="text"
                                        value={editingCategory.name}
                                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        className="pn-input w-full sm:w-80 px-4 py-2"
                                        placeholder="分类名称"
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-base font-semibold text-zinc-100 truncate">{category.name}</div>
                                      <div className="text-xs text-zinc-500 mt-0.5">{category.items.length} 个项目</div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {editingCategory?.id === category.id ? (
                                  <>
                                    <button
                                      onClick={() => updateCategory(category.id, editingCategory)}
                                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/16 border border-emerald-500/15 text-emerald-400 transition-colors"
                                    >
                                      <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingCategory(null)}
                                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/16 border border-red-500/15 text-red-400 transition-colors"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setEditingCategory(category)}
                                      className="p-2 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
                                      title="编辑分类"
                                    >
                                      <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => deleteCategory(category.id)}
                                      className="p-2 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-red-300 transition-colors"
                                      title="删除分类"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 sm:p-6">
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(e) => handleDragEndItems(e, category.id)}
                            >
                              <SortableContext items={category.items.map((i) => i.id)} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                  <AnimatePresence initial={false}>
                                    {category.items.map((item) => (
                                      <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        transition={{ duration: 0.16 }}
                                      >
                                        <SortableBlock
                                          id={item.id}
                                          className="rounded-xl bg-black/20 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                                        >
                                          {({ handleAttributes: itemAttrs, handleListeners: itemListeners }) => (
                                            <div className="p-4">
                                              {editingItem?.item.id === item.id ? (
                                                <div className="space-y-3 relative">
                                                  {metaLoadingItemId === item.id ? (
                                                    <div className="absolute inset-0 z-10 rounded-xl bg-black/35 backdrop-blur-[1px] border border-white/10 flex items-center justify-center">
                                                      <div className="flex items-center gap-2 text-sm text-zinc-200">
                                                        <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                                                        <span>采集中...</span>
                                                      </div>
                                                    </div>
                                                  ) : null}

                                                  <div className={classNames(metaLoadingItemId === item.id && 'pointer-events-none opacity-80')}>
                                                    <div className="flex items-start gap-3">
                                                    <button
                                                      {...itemAttrs}
                                                      {...(itemListeners ?? {})}
                                                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] text-zinc-400 hover:text-white transition-colors"
                                                      aria-label="拖拽排序"
                                                    >
                                                      <GripVertical className="w-5 h-5" />
                                                    </button>

                                                    <div className="flex-1 space-y-3">
                                                      <input
                                                        type="text"
                                                        value={editingItem.item.title}
                                                        onChange={(e) =>
                                                          setEditingItem({
                                                            ...editingItem,
                                                            item: { ...editingItem.item, title: e.target.value },
                                                          })
                                                        }
                                                        className="pn-input w-full px-3 py-2 text-sm"
                                                        placeholder="标题"
                                                        autoFocus
                                                      />
                                                      <input
                                                        type="text"
                                                        value={editingItem.item.url}
                                                        onChange={(e) =>
                                                          setEditingItem({
                                                            ...editingItem,
                                                            item: { ...editingItem.item, url: e.target.value },
                                                          })
                                                        }
                                                        onBlur={(e) => tryAutofillFromUrl(e.target.value)}
                                                        className="pn-input w-full px-3 py-2 text-sm"
                                                        placeholder="URL"
                                                      />
                                                      <input
                                                        type="text"
                                                        value={editingItem.item.description}
                                                        onChange={(e) =>
                                                          setEditingItem({
                                                            ...editingItem,
                                                            item: { ...editingItem.item, description: e.target.value },
                                                          })
                                                        }
                                                        className="pn-input w-full px-3 py-2 text-sm"
                                                        placeholder="描述"
                                                      />

                                                      <div className="flex items-center gap-2 pt-1">
                                                        <span className="text-xs text-zinc-500">图标</span>
                                                        <div className="flex gap-2">
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setEditingItem({
                                                                ...editingItem,
                                                                item: { ...editingItem.item, favicon: '' },
                                                              })
                                                            }
                                                            className={classNames(
                                                              'w-9 h-9 rounded-xl border flex items-center justify-center transition-colors',
                                                              !editingItem.item.favicon
                                                                ? 'border-white/[0.20] bg-white/[0.06]'
                                                                : 'border-white/[0.10] hover:border-white/[0.20] bg-white/[0.05]'
                                                            )}
                                                          >
                                                            <Globe className="w-5 h-5 text-zinc-300" />
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setEditingItem({
                                                                ...editingItem,
                                                                item: {
                                                                  ...editingItem.item,
                                                                  favicon: getFaviconUrl(editingItem.item.url || ''),
                                                                },
                                                              })
                                                            }
                                                            className={classNames(
                                                              'w-9 h-9 rounded-xl border flex items-center justify-center transition-colors overflow-hidden',
                                                              editingItem.item.favicon
                                                                ? 'border-white/[0.20] bg-white/[0.06]'
                                                                : 'border-white/[0.10] hover:border-white/[0.20] bg-white/[0.05]'
                                                            )}
                                                          >
                                                            <img
                                                              src={getFaviconUrl(editingItem.item.url || '')}
                                                              alt=""
                                                              className="w-full h-full object-cover"
                                                              onError={(e) => {
                                                                const googleUrl = getGoogleFaviconUrl(editingItem.item.url || '');
                                                                if (googleUrl && (e.target as HTMLImageElement).src !== googleUrl) {
                                                                  (e.target as HTMLImageElement).src = googleUrl;
                                                                  return;
                                                                }

                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                              }}
                                                            />
                                                            <Globe className="w-5 h-5 text-zinc-300 hidden" />
                                                          </button>
                                                        </div>

                                                        <div className="flex-1" />
                                                        <button
                                                          onClick={() => updateItem(category.id, item.id, editingItem.item)}
                                                          className="px-3 py-2 text-xs font-medium rounded-xl bg-emerald-600/85 hover:bg-emerald-600 text-white transition-colors"
                                                        >
                                                          确定
                                                        </button>
                                                        <button
                                                          onClick={() => cancelEditItem(category.id, item.id)}
                                                          className="px-3 py-2 text-xs font-medium rounded-xl bg-white/[0.06] hover:bg-white/[0.08] text-zinc-200 transition-colors"
                                                        >
                                                          取消
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-start gap-3">
                                                  <button
                                                    {...itemAttrs}
                                                    {...(itemListeners ?? {})}
                                                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] text-zinc-400 hover:text-white transition-colors"
                                                    aria-label="拖拽排序"
                                                  >
                                                    <GripVertical className="w-5 h-5" />
                                                  </button>

                                                  <div className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/[0.10] flex items-center justify-center overflow-hidden shrink-0">
                                                    {item.favicon ? (
                                                      <img
                                                        src={item.favicon}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                          const googleUrl = getGoogleFaviconUrl(item.url);
                                                          if (googleUrl && e.currentTarget.src !== googleUrl) {
                                                            e.currentTarget.src = googleUrl;
                                                          }
                                                        }}
                                                      />
                                                    ) : (
                                                      <Globe className="w-5 h-5 text-zinc-400" />
                                                    )}
                                                  </div>

                                                  <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium text-zinc-100 truncate">{item.title}</div>
                                                    <div className="text-xs text-zinc-500 truncate mt-0.5">{item.url}</div>
                                                    <div className="text-xs text-zinc-600 line-clamp-1 mt-1">{item.description}</div>
                                                  </div>

                                                  <div className="flex items-center gap-1">
                                                    <button
                                                      onClick={() => setEditingItem({ categoryId: category.id, item })}
                                                      className="p-2 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
                                                      title="编辑"
                                                    >
                                                      <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                      onClick={() => deleteItem(category.id, item.id)}
                                                      className="p-2 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-red-300 transition-colors"
                                                      title="删除"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </SortableBlock>
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>

                                  <motion.button
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => addItem(category.id)}
                                    className="rounded-xl border border-dashed border-white/10 hover:border-white/[0.16] bg-white/[0.01] hover:bg-white/[0.02] transition-colors min-h-[92px] flex items-center justify-center"
                                  >
                                    <div className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                                      <Plus className="w-5 h-5" />
                                      <span className="text-sm font-medium">添加网站</span>
                                    </div>
                                  </motion.button>
                                </div>
                              </SortableContext>
                            </DndContext>
                          </div>
                        </div>
                      )}
                    </SortableBlock>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </main>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="确认删除"
        message={
          deleteTarget?.type === 'category'
            ? '确定要删除这个分类及其所有内容吗？此操作无法撤销。'
            : '确定要删除这个网站吗？'
        }
        confirmText="确认删除"
        cancelText="取消"
        type="danger"
      />
    </div>
  );
}
