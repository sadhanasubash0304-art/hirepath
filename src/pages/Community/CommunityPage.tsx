import React, { useEffect, useState } from 'react';
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
import {
  Heart,
  MessageSquare,
  Flag,
  UserPlus,
  UserCheck,
  Search,
  Send,
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  EmptyState,
  SkeletonBlock,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType, tsMillis } from '../../lib/firebase';
import { CommunityPostRecord } from '../../types/hirepath';

interface CommentItem {
  id: string;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt?: unknown;
}

export function CommunityPage() {
  const { user, publicProfile, socket, pushNotification } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<CommunityPostRecord[]>([]);
  const [likesByPost, setLikesByPost] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // New post form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'achievement' | 'question' | 'resource' | 'discussion'>('question');
  const [content, setContent] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [posting, setPosting] = useState(false);

  // Report modal
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const loadFeed = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [postsSnap, followsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'communityPosts'),
            where('category', 'in', ['achievement', 'question', 'resource', 'discussion'])
          )
        ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'communityPosts')),
        getDocs(
          query(collection(db, 'follows'), where('followerUid', '==', user.uid))
        ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'follows')),
      ]);

      const postList = postsSnap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CommunityPostRecord, 'id'>),
        }))
        .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt));
      setPosts(postList);

      const fMap: Record<string, boolean> = {};
      followsSnap.docs.forEach((d) => {
        const data = d.data() as { targetUid: string };
        fMap[data.targetUid] = true;
      });
      setFollowingMap(fMap);

      // Load likes count & own like status for each post
      const likesState: Record<string, boolean> = {};
      const countsState: Record<string, number> = {};
      await Promise.all(
        postList.slice(0, 20).map(async (p) => {
          const likesSnap = await getDocs(
            query(
              collection(db, 'communityPosts', p.id, 'likes'),
              where('uid', '!=', '')
            )
          ).catch(() => null);
          if (likesSnap) {
            countsState[p.id] = likesSnap.size;
            likesState[p.id] = likesSnap.docs.some((d) => d.id === user.uid);
          }
        })
      );
      setLikesByPost(likesState);
      setLikeCounts(countsState);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const onNewPost = (payload: CommunityPostRecord) => {
      setPosts((prev) => {
        if (prev.some((p) => p.id === payload.id)) return prev;
        return [payload, ...prev];
      });
    };
    const onNewComment = (payload: { postId: string; comment: CommentItem }) => {
      setCommentsByPost((prev) => {
        const existing = prev[payload.postId] || [];
        if (existing.some((c) => c.id === payload.comment.id)) return prev;
        return { ...prev, [payload.postId]: [...existing, payload.comment] };
      });
    };
    socket.on('community:post_created', onNewPost);
    socket.on('community:comment_created', onNewComment);
    return () => {
      socket.off('community:post_created', onNewPost);
      socket.off('community:comment_created', onNewComment);
    };
  }, [socket]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !publicProfile || !title.trim() || !content.trim()) return;
    setPosting(true);

    const postId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

    try {
      await setDoc(doc(db, 'communityPosts', postId), {
        authorUid: user.uid,
        authorName: publicProfile.displayName,
        authorRole: publicProfile.role,
        category,
        title: title.trim().slice(0, 180),
        content: content.trim().slice(0, 4000),
        tags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const created: CommunityPostRecord = {
        id: postId,
        authorUid: user.uid,
        authorName: publicProfile.displayName,
        authorRole: publicProfile.role,
        category,
        title: title.trim(),
        content: content.trim(),
        tags,
      };
      setPosts((prev) => [created, ...prev]);
      socket?.emit('community:post_created', created);

      setTitle('');
      setContent('');
      setTagsText('');
      showToast('Post published to community', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `communityPosts/${postId}`);
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post: CommunityPostRecord) => {
    if (!user) return;
    const liked = Boolean(likesByPost[post.id]);
    const likeRef = doc(db, 'communityPosts', post.id, 'likes', user.uid);
    try {
      if (liked) {
        await deleteDoc(likeRef);
        setLikesByPost((prev) => ({ ...prev, [post.id]: false }));
        setLikeCounts((prev) => ({
          ...prev,
          [post.id]: Math.max(0, (prev[post.id] || 1) - 1),
        }));
      } else {
        await setDoc(likeRef, { uid: user.uid, createdAt: serverTimestamp() });
        setLikesByPost((prev) => ({ ...prev, [post.id]: true }));
        setLikeCounts((prev) => ({ ...prev, [post.id]: (prev[post.id] || 0) + 1 }));
        if (post.authorUid !== user.uid) {
          await pushNotification(post.authorUid, {
            type: 'community',
            title: 'New Post Like',
            message: `${publicProfile?.displayName || 'Someone'} liked "${post.title}".`,
            link: '/community',
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `communityPosts/${post.id}/likes/${user.uid}`);
    }
  };

  const toggleComments = async (postId: string) => {
    const nextOpen = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextOpen }));
    if (nextOpen && !commentsByPost[postId]) {
      const snap = await getDocs(
        query(
          collection(db, 'communityPosts', postId, 'comments'),
          where('authorUid', '!=', '')
        )
      ).catch(() => null);
      if (snap) {
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: snap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<CommentItem, 'id'>),
            }))
            .sort((a, b) => tsMillis(a.createdAt) - tsMillis(b.createdAt)),
        }));
      }
    }
  };

  const handleAddComment = async (post: CommunityPostRecord) => {
    if (!user || !publicProfile) return;
    const text = (commentInputs[post.id] || '').trim();
    if (!text) return;

    const commentId = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'communityPosts', post.id, 'comments', commentId), {
        authorUid: user.uid,
        authorName: publicProfile.displayName,
        content: text.slice(0, 1500),
        createdAt: serverTimestamp(),
      });

      const newComment: CommentItem = {
        id: commentId,
        authorUid: user.uid,
        authorName: publicProfile.displayName,
        content: text,
      };
      setCommentsByPost((prev) => ({
        ...prev,
        [post.id]: [...(prev[post.id] || []), newComment],
      }));
      setCommentInputs((prev) => ({ ...prev, [post.id]: '' }));
      socket?.emit('community:comment_created', { postId: post.id, comment: newComment });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `communityPosts/${post.id}/comments/${commentId}`);
    }
  };

  const toggleFollow = async (targetUid: string) => {
    if (!user || targetUid === user.uid) return;
    const followId = `${user.uid}_${targetUid}`;
    const isFollowing = Boolean(followingMap[targetUid]);
    try {
      if (isFollowing) {
        await deleteDoc(doc(db, 'follows', followId));
        setFollowingMap((prev) => ({ ...prev, [targetUid]: false }));
        showToast('Unfollowed member', 'info');
      } else {
        await setDoc(doc(db, 'follows', followId), {
          followerUid: user.uid,
          targetUid,
          createdAt: serverTimestamp(),
        });
        setFollowingMap((prev) => ({ ...prev, [targetUid]: true }));
        showToast('Following member', 'success');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `follows/${followId}`);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportTargetId || !reportReason.trim()) return;
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'reports', reportId), {
        reporterUid: user.uid,
        targetType: 'post',
        targetId: reportTargetId,
        reason: reportReason.trim().slice(0, 1000),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setReportTargetId(null);
      setReportReason('');
      showToast('Report submitted for admin review', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}`);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (
      search.trim() &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !p.content.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Learning Community"
          subtitle="Share engineering milestones, ask technical questions, and collaborate with peers and hiring mentors."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create Post */}
          <SurfaceCard className="lg:col-span-4 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">Share with Community</h2>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as 'achievement' | 'question' | 'resource' | 'discussion'
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              >
                <option value="question">Technical / Career Question</option>
                <option value="achievement">Share Milestone / Achievement</option>
                <option value="resource">Study Tip / Resource</option>
                <option value="discussion">Industry Discussion</option>
              </select>
              <input
                type="text"
                placeholder="Post Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              />
              <textarea
                rows={4}
                placeholder="Write your question, reflection, or milestone details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              />
              <input
                type="text"
                placeholder="Tags (comma-separated, e.g. React, SQL)"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
              />
              <button
                type="submit"
                disabled={posting}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
              >
                {posting ? 'Publishing...' : 'Publish Post'}
              </button>
            </form>
          </SurfaceCard>

          {/* Feed */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-800 bg-[#0D1424] text-sm text-slate-100"
                />
              </div>
              <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-[#0D1424] border border-slate-800">
                {(['all', 'question', 'achievement', 'discussion'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded text-xs font-medium capitalize ${
                      categoryFilter === cat ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <SkeletonBlock className="h-44" />
            ) : filteredPosts.length === 0 ? (
              <EmptyState
                title="No community posts yet"
                description="Start the conversation by sharing a learning milestone or asking a technical question on the left."
              />
            ) : (
              filteredPosts.map((post) => {
                const isOwn = post.authorUid === user?.uid;
                const liked = Boolean(likesByPost[post.id]);
                const commentsOpen = Boolean(expandedComments[post.id]);
                const postComments = commentsByPost[post.id] || [];

                return (
                  <SurfaceCard key={post.id} className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-cyan-400 capitalize">
                          {post.category} · by {post.authorName} ({post.authorRole || 'learner'})
                        </p>
                        <h3 className="text-lg font-semibold text-slate-100 mt-1">
                          {post.title}
                        </h3>
                      </div>

                      {!isOwn && (
                        <button
                          type="button"
                          onClick={() => toggleFollow(post.authorUid)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 shrink-0 ${
                            followingMap[post.authorUid]
                              ? 'border-blue-500/40 bg-blue-600/15 text-blue-300'
                              : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {followingMap[post.authorUid] ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" /> Follow
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {post.tags && post.tags.length > 0 && (
                      <p className="text-xs text-slate-500">
                        Topics: {post.tags.join(' · ')}
                      </p>
                    )}

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-5">
                        <button
                          type="button"
                          onClick={() => toggleLike(post)}
                          className={`inline-flex items-center gap-1.5 transition-colors ${
                            liked ? 'text-rose-400' : 'hover:text-slate-200'
                          }`}
                        >
                          <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
                          <span className="font-mono tabular-nums">{likeCounts[post.id] || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleComments(post.id)}
                          className="inline-flex items-center gap-1.5 hover:text-slate-200"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Comments</span>
                        </button>
                      </div>

                      {!isOwn && (
                        <button
                          type="button"
                          onClick={() => setReportTargetId(post.id)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-amber-400"
                        >
                          <Flag className="w-3.5 h-3.5" /> Report
                        </button>
                      )}
                    </div>

                    {commentsOpen && (
                      <div className="pt-3 border-t border-slate-800/60 space-y-3">
                        {postComments.map((c) => (
                          <div key={c.id} className="text-xs bg-[#070B14] rounded-lg p-3 border border-slate-800/70">
                            <span className="font-semibold text-slate-200">{c.authorName}: </span>
                            <span className="text-slate-300">{c.content}</span>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="Write a helpful reply..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </SurfaceCard>
                );
              })
            )}
          </div>
        </div>

        {/* Report Modal */}
        {reportTargetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0D1424] p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Report Content</h3>
              <form onSubmit={submitReport} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe why this post violates community guidelines..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReportTargetId(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
