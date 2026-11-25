import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  SkeletonBlock,
  EmptyState,
  ErrorBanner,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import { LearningResource } from '../../types/hirepath';

export function ResourcesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [resources, setResources] = useState<LearningResource[]>([]);
  const [customResources, setCustomResources] = useState<LearningResource[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, string>>({});

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [sort, setSort] = useState('title');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function fetchResources() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          category,
          difficulty,
          sort,
          page: String(page),
          limit: '9',
        });
        if (search.trim()) params.set('search', search.trim());

        const res = await apiFetch<{
          resources: LearningResource[];
          categories: string[];
          totalPages: number;
        }>(`/api/v1/resources?${params.toString()}`);

        if (!active) return;
        setResources(res.resources);
        setCategories(res.categories);
        setTotalPages(res.totalPages);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load resources.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchResources();
    return () => {
      active = false;
    };
  }, [search, category, difficulty, sort, page]);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'bookmarks'), where('uid', '==', user.uid)))
      .then((snap) => {
        const map: Record<string, string> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as { resourceId: string };
          map[data.resourceId] = d.id;
        });
        setBookmarkedIds(map);
      })
      .catch((err) => handleFirestoreError(err, OperationType.LIST, 'bookmarks'));

    getDocs(
      query(
        collection(db, 'resources'),
        where('difficulty', 'in', ['Beginner', 'Intermediate', 'Advanced'])
      )
    )
      .then((snap) => {
        setCustomResources(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<LearningResource, 'id'>),
            provider: 'HirePath Curated',
          }))
        );
      })
      .catch(() => {});
  }, [user]);

  const toggleBookmark = async (resource: LearningResource) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const existingDocId = bookmarkedIds[resource.id];
    if (existingDocId) {
      try {
        await deleteDoc(doc(db, 'bookmarks', existingDocId));
        setBookmarkedIds((prev) => {
          const next = { ...prev };
          delete next[resource.id];
          return next;
        });
        showToast('Removed bookmark', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `bookmarks/${existingDocId}`);
      }
    } else {
      const bmId = `bm_${user.uid}_${resource.id}`;
      try {
        await setDoc(doc(db, 'bookmarks', bmId), {
          uid: user.uid,
          resourceId: resource.id,
          title: resource.title.slice(0, 180),
          category: resource.category,
          url: resource.url,
          createdAt: serverTimestamp(),
        });
        setBookmarkedIds((prev) => ({ ...prev, [resource.id]: bmId }));
        showToast('Resource bookmarked', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `bookmarks/${bmId}`);
      }
    }
  };

  const combined = page === 1 && !search && category === 'all' && difficulty === 'all'
    ? [...customResources, ...resources]
    : resources;

  const displayedResources = showBookmarkedOnly
    ? combined.filter((r) => Boolean(bookmarkedIds[r.id]))
    : combined;

  const Wrapper = user ? AppShell : PublicLayout;

  return (
    <Wrapper>
      <div className={user ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6'}>
        <PageHeader
          title="Learning Resource Library"
          subtitle="Verified official documentation, university courses, and hands-on guides across engineering, data, cloud, and interviews."
        />

        {/* Filters */}
        <SurfaceCard className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search topics, React, SQL, Python..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              >
                <option value="title">Sort: A–Z</option>
                <option value="duration_asc">Shortest First</option>
                <option value="duration_desc">Longest First</option>
              </select>
            </div>
          </div>

          {user && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => setShowBookmarkedOnly((prev) => !prev)}
                className={`px-3 py-1.5 rounded-md font-medium ${
                  showBookmarkedOnly
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {showBookmarkedOnly ? 'Showing Saved Bookmarks' : 'Show Saved Bookmarks Only'}
              </button>
              <span className="text-slate-400 tabular-nums">
                {Object.keys(bookmarkedIds).length} saved
              </span>
            </div>
          )}
        </SurfaceCard>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonBlock className="h-44" />
            <SkeletonBlock className="h-44" />
            <SkeletonBlock className="h-44" />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : displayedResources.length === 0 ? (
          <EmptyState
            title="No resources match your filters"
            description="Try clearing search keywords or switching category and difficulty filters."
            action={
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategory('all');
                  setDifficulty('all');
                  setShowBookmarkedOnly(false);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
              >
                Reset Filters
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedResources.map((res) => {
                const isSaved = Boolean(bookmarkedIds[res.id]);
                return (
                  <SurfaceCard key={res.id} className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-cyan-400 font-medium">
                          {res.category} · {res.difficulty} · {res.resourceType}
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(res)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isSaved
                              ? 'text-blue-400 bg-blue-600/15'
                              : 'text-slate-500 hover:text-slate-200'
                          }`}
                          aria-label={isSaved ? 'Remove bookmark' : 'Bookmark resource'}
                        >
                          <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <h2 className="text-base font-semibold text-slate-100 mt-2">
                        {res.title}
                      </h2>
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        {res.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-3">
                        Skills: {(res.skillTags || []).join(' · ')}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 tabular-nums">
                        {res.provider || 'Verified'} · {res.estimatedMinutes} min
                      </span>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                      >
                        Open Resource <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 disabled:opacity-40 inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 disabled:opacity-40 inline-flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Wrapper>
  );
}
