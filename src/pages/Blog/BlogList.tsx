import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Image as ImageIcon, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { getBlogPosts, deleteBlogPost, updateBlogPost, BlogPost } from '@/services/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function BlogList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<BlogPost | null>(null)
  const [tab, setTab] = useState<'all' | 'published' | 'draft'>('all')

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: getBlogPosts,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      setPendingDelete(null)
    },
  })

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      updateBlogPost(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
  })

  const publishedCount = posts.filter((p) => p.isPublished).length
  const draftCount = posts.filter((p) => !p.isPublished).length

  const visible =
    tab === 'all'
      ? posts
      : tab === 'published'
      ? posts.filter((p) => p.isPublished)
      : posts.filter((p) => !p.isPublished)

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/firma'))}
          aria-label="Înapoi"
          className="w-9 h-9 min-h-[44px] min-w-[44px] flex items-center justify-center border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-medium text-foreground">Articole</h1>
          <p className="text-[12px] text-muted-foreground">
            {posts.length} articole · {publishedCount} publicate
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/blog/new')}
          className="ml-auto min-h-[44px] px-3.5 bg-primary text-primary-foreground rounded-lg text-[14px] font-medium flex items-center gap-1.5 hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nou
        </button>
      </div>

      {/* Status tab filter */}
      <div className="bg-card border border-border rounded-lg p-0.5 flex">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`flex-1 min-h-[44px] text-[13px] font-medium rounded-md transition-colors ${
            tab === 'all' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Toate {posts.length}
        </button>
        <button
          type="button"
          onClick={() => setTab('published')}
          className={`flex-1 min-h-[44px] text-[13px] font-medium rounded-md transition-colors ${
            tab === 'published' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Publicate {publishedCount}
        </button>
        <button
          type="button"
          onClick={() => setTab('draft')}
          className={`flex-1 min-h-[44px] text-[13px] font-medium rounded-md transition-colors ${
            tab === 'draft' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Drafturi {draftCount}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
      )}

      {/* Empty state */}
      {!isLoading && visible.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          {tab === 'all' && (
            <>
              <p className="text-muted-foreground text-lg mb-3">Niciun articol încă</p>
              <button
                type="button"
                onClick={() => navigate('/blog/new')}
                className="text-primary font-medium text-sm hover:underline"
              >
                Creează primul articol →
              </button>
            </>
          )}
          {tab === 'published' && (
            <p className="text-muted-foreground text-lg">Niciun articol publicat</p>
          )}
          {tab === 'draft' && (
            <p className="text-muted-foreground text-lg">Niciun draft</p>
          )}
        </div>
      )}

      {/* Mobile Card List */}
      {!isLoading && visible.length > 0 && (
        <div className="lg:hidden flex flex-col gap-3">
          {visible.map((post) => (
            <div
              key={post.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Whole-card tap zone for navigation */}
              <div
                onClick={() => navigate(`/blog/${post.id}/edit`)}
                className="cursor-pointer"
              >
                {/* Cover image & status badge */}
                <div className="relative h-[120px] w-full bg-muted overflow-hidden">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8 opacity-60" />
                    </div>
                  )}
                  <span
                    className={`absolute top-2.5 left-2.5 rounded-full text-[11px] font-medium px-2.5 py-1 ${
                      post.isPublished
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {post.isPublished ? 'Publicat' : 'Draft'}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-muted text-muted-foreground rounded px-2 py-0.5 font-medium">
                      {post.category}
                    </span>
                    {post.readTime && (
                      <span className="text-[11px] text-muted-foreground">
                        {post.readTime}
                      </span>
                    )}
                  </div>
                  <h2 className="text-[15px] font-medium text-foreground line-clamp-2 mt-1.5">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="text-[12px] text-muted-foreground mt-2">
                    {post.isPublished
                      ? format(new Date(post.publishedAt || post.createdAt), 'dd MMM yyyy', {
                          locale: ro,
                        })
                      : format(new Date(post.createdAt), 'dd MMM yyyy', { locale: ro })}
                  </div>
                </div>
              </div>

              {/* Action row (outside tap zone) */}
              <div className="p-3.5 pt-0 mt-0 flex gap-2 border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/blog/${post.id}/edit`)
                  }}
                  className="flex-1 min-h-[44px] border border-border rounded-lg text-foreground text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-accent transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Editează
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePublish.mutate({ id: post.id, isPublished: !post.isPublished })
                  }}
                  className="flex-1 min-h-[44px] border border-border rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-accent transition-colors"
                >
                  {post.isPublished ? (
                    <>
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                      Retrage
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-primary" />
                      Publică
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPendingDelete(post)
                  }}
                  aria-label="Șterge"
                  className="w-11 min-h-[44px] min-w-[44px] shrink-0 border border-destructive/40 rounded-lg text-destructive flex items-center justify-center hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop Posts Table (Untouched) */}
      {!isLoading && visible.length > 0 && (
        <div className="hidden lg:block max-w-6xl bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Titlu
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Categorie
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Data
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((post) => (
                <tr key={post.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground text-sm">{post.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        togglePublish.mutate({ id: post.id, isPublished: !post.isPublished })
                      }
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        post.isPublished
                          ? 'bg-success-light text-success hover:bg-success-light/80'
                          : 'bg-warning-light text-warning hover:bg-warning-light/80'
                      }`}
                    >
                      {post.isPublished ? '● Publicat' : '○ Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('ro-RO')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => navigate(`/blog/${post.id}/edit`)}
                        className="text-sm text-primary hover:text-primary-hover font-medium"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => setPendingDelete(post)}
                        disabled={deleteMutation.isPending && pendingDelete?.id === post.id}
                        className="text-sm text-destructive hover:text-destructive/80 font-medium disabled:opacity-50"
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi articolul?</AlertDialogTitle>
            <AlertDialogDescription>
              Articolul „{pendingDelete?.title}” va fi șters definitiv. Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Anulează</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: 'destructive' }), 'min-h-[44px]')}
              onClick={() => {
                if (pendingDelete) {
                  deleteMutation.mutate(pendingDelete.id)
                }
              }}
            >
              {deleteMutation.isPending ? 'Se șterge...' : 'Șterge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

