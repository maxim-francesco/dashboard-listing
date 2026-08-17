import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getBlogPosts, deleteBlogPost, updateBlogPost, BlogPost } from '@/services/api'

export default function BlogList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: getBlogPosts,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      setDeletingId(null)
    },
  })

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      updateBlogPost(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
  })

  const handleDelete = (postId: string) => {
    if (window.confirm('Ești sigur că vrei să ștergi acest articol?')) {
      setDeletingId(postId)
      deleteMutation.mutate(postId)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {posts.length} articole · {posts.filter(p => p.isPublished).length} publicate
          </p>
        </div>
        <button
          onClick={() => navigate('/blog/new')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          + Articol nou
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-lg mb-3">Niciun articol încă</p>
          <button
            onClick={() => navigate('/blog/new')}
            className="text-primary font-medium text-sm hover:underline"
          >
            Creează primul articol →
          </button>
        </div>
      )}

      {/* Posts table */}
      {posts.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
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
              {posts.map((post) => (
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
                      onClick={() => togglePublish.mutate({ id: post.id, isPublished: !post.isPublished })}
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
                    {new Date(post.publishedAt).toLocaleDateString('ro-RO')}
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
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="text-sm text-destructive hover:text-destructive/80 font-medium disabled:opacity-50"
                      >
                        {deletingId === post.id ? '...' : 'Șterge'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
