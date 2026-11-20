import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Share2,
  Calendar,
  Search,
  Hash,
} from "lucide-react";
import {
  getPagePublishedPosts,
  type FacebookPagePost,
} from "../../../../services/facebookAdsService";

interface PagePostsSelectorProps {
  pageId: string;
  selectedPostId?: string;
  onSelectPost: (post: FacebookPagePost) => void;
  onManualPostIdChange: (postId: string) => void;
  error?: string;
}

export const PagePostsSelector: React.FC<PagePostsSelectorProps> = ({
  pageId,
  selectedPostId,
  onSelectPost,
  onManualPostIdChange,
  error,
}) => {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));

  const [posts, setPosts] = useState<FacebookPagePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [manualId, setManualId] = useState(selectedPostId || "");
  const [showManualInput, setShowManualInput] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!pageId) return;
    try {
      setLoading(true);
      setFetchError(null);
      const res = await getPagePublishedPosts(pageId, 30);
      if (res.success && Array.isArray(res.posts)) {
        setPosts(res.posts);
      } else {
        setFetchError(res.error || (isEn ? "Failed to fetch page posts" : "تعذر جلب منشورات الصفحة"));
      }
    } catch (err: any) {
      setFetchError(err.message || (isEn ? "An error occurred while loading posts from Facebook" : "حدث خطأ أثناء تحميل المنشورات من فيسبوك"));
    } finally {
      setLoading(false);
    }
  }, [pageId, isEn]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      post.id.toLowerCase().includes(term) ||
      (post.message && post.message.toLowerCase().includes(term))
    );
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleDateString(isEn ? "en-US" : "ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border dark:border-border pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary dark:text-primary" />
          <span className="text-sm font-semibold text-foreground dark:text-muted-foreground">
            {isEn ? "Available Page Posts for Promotion" : "منشورات الصفحة المتاحة للترويج"}
          </span>
          {posts.length > 0 && (
            <span className="text-xs bg-primary dark:bg-primary/60 text-primary dark:text-primary px-2 py-0.5 rounded-full font-medium">
              {posts.length} {isEn ? (posts.length === 1 ? "post" : "posts") : "منشور"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPosts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border dark:border-border rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors disabled:opacity-50"
            title={isEn ? "Refresh posts list" : "تحديث قائمة المنشورات"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            {isEn ? "Refresh" : "تحديث"}
          </button>
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-xs text-primary dark:text-primary hover:text-primary dark:hover:text-primary underline font-medium"
          >
            {showManualInput
              ? (isEn ? "Hide manual input" : "إخفاء الإدخال اليدوي")
              : (isEn ? "Enter ID manually" : "إدخال معرف يدويًا")}
          </button>
        </div>
      </div>

      {/* Manual Post ID input */}
      {showManualInput && (
        <div className="p-3 bg-primary/50 dark:bg-primary/30 border border-primary dark:border-primary/60 rounded-xl space-y-2">
          <label className="block text-xs font-medium text-primary dark:text-primary">
            {isEn ? "Page Post ID manually" : "معرّف المنشور (Post ID) يدويًا"}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className={`w-4 h-4 text-muted-foreground absolute top-2.5 ${isEn ? "left-3" : "right-3"}`} />
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder={isEn ? "e.g. 123456789012345" : "مثال: 123456789012345"}
                className={`w-full py-2 text-xs border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground placeholder-muted dark:placeholder-muted ${
                  isEn ? "ps-9 pe-3" : "pe-9 ps-3"
                }`}
              />
            </div>
            <button
              type="button"
              onClick={() => onManualPostIdChange(manualId.trim())}
              disabled={!manualId.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {isEn ? "Confirm" : "تأكيد"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isEn
              ? "You can use this option if the post is dark/unpublished or does not appear in the automated list."
              : "يمكنك استخدام هذا الخيار إذا كان المنشور مخفياً (Dark Post) أو غير ظاهر في القائمة التلقائية."}
          </p>
        </div>
      )}

      {/* Search Input */}
      {posts.length > 5 && (
        <div className="relative">
          <Search className={`w-4 h-4 text-muted-foreground absolute top-2.5 ${isEn ? "left-3" : "right-3"}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEn ? "Search in post text or ID..." : "بحث في نصوص المنشورات أو المعرف..."}
            className={`w-full py-2 text-xs border border-border dark:border-border bg-card text-foreground placeholder-muted dark:placeholder-muted rounded-lg focus:ring-2 focus:ring-primary ${
              isEn ? "ps-9 pe-3" : "pe-9 ps-3"
            }`}
          />
        </div>
      )}

      {/* Error Message */}
      {fetchError && (
        <div className="p-3 bg-destructive/10 dark:bg-destructive/30 border border-destructive dark:border-destructive/50 rounded-xl text-xs text-destructive dark:text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs">{isEn ? "Fetching posts from Facebook Page..." : "جاري جلب المنشورات من صفحة فيسبوك..."}</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border border-dashed border-border dark:border-border rounded-xl bg-muted dark:bg-muted">
          <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/80" />
          <p className="text-xs font-medium">{isEn ? "No published posts found" : "لم يتم العثور على منشورات منشورة"}</p>
          <p className="text-[11px] text-muted-foreground/80 mt-1">
            {isEn
              ? "Make sure there are published posts on the page, or enter an ID manually above"
              : "تأكد من نشر منشورات على الصفحة أو استخدم خيار الإدخال اليدوي أعلاه"}
          </p>
        </div>
      ) : (
        /* Posts List */
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pe-1">
          {filteredPosts.map((post) => {
            const isSelected = selectedPostId === post.id;
            return (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex gap-3 items-start ${
                  isSelected
                    ? "border-blue-500 bg-primary/60 dark:bg-primary/40 shadow-sm"
                    : "border-gray-200 dark:border-border hover:border-border bg-card"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border flex items-center justify-center">
                  {post.pictureUrl ? (
                    <img
                      src={post.pictureUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-muted-foreground/80" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">
                      {post.message || (isEn ? "Post without text (image or media)" : "منشور بدون نص (صورة أو وسائط)")}
                    </p>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border flex-shrink-0 mt-0.5" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      {post.id}
                    </span>
                    {post.createdTime && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(post.createdTime)}
                      </span>
                    )}
                    {post.sharesCount ? (
                      <span className="flex items-center gap-1 text-success dark:text-success bg-success/10 dark:bg-success/40 border border-success dark:border-success/40 px-1.5 py-0.5 rounded">
                        <Share2 className="w-3 h-3" />
                        {post.sharesCount} {isEn ? (post.sharesCount === 1 ? "share" : "shares") : "مشاركة"}
                      </span>
                    ) : null}
                    {post.permalinkUrl && (
                      <a
                        href={post.permalinkUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1 text-primary dark:text-primary hover:text-primary dark:hover:text-primary ${
                          isEn ? "ms-auto" : "me-auto"
                        }`}
                      >
                        {isEn ? "View post" : "عرض المنشور"}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};
