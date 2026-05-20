import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  CreateBlogPostData,
} from '@/services/api'
import RichTextEditor from '@/components/BlogEditor/RichTextEditor'

const CATEGORIES = [
  { label: 'Ghid cumpărare', key: 'ghid' },
  { label: 'Tehnic', key: 'tehnic' },
  { label: 'Top & Recomandări', key: 'top' },
  { label: 'Legal & Financiar', key: 'legal' },
  { label: 'Ghid vânzare', key: 'vanzare' },
  { label: 'Noutăți', key: 'noutati' },
  { label: 'General', key: 'general' },
]

const EMPTY_FORM: CreateBlogPostData = {
  title: '',
  excerpt: '',
  content: '',
  category: 'General',
  categoryKey: 'general',
  readTime: '3 min',
  coverImage: null,
  isPublished: false,
}

export default function BlogForm() {
  const { postId } = useParams<{ postId: string }>()
  const isEditing = !!postId && postId !== 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<CreateBlogPostData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load existing post if editing
  const { data: posts } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: getBlogPosts,
    enabled: isEditing,
  })

  useEffect(() => {
    if (isEditing && posts) {
      const post = posts.find(p => p.id === postId)
      if (post) {
        setForm({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          categoryKey: post.categoryKey,
          readTime: post.readTime,
          coverImage: post.coverImage,
          isPublished: post.isPublished,
        })
      }
    }
  }, [isEditing, posts, postId])

  const createMutation = useMutation({
    mutationFn: createBlogPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      navigate('/blog')
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Eroare la salvare.' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateBlogPostData>) =>
      updateBlogPost(postId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      navigate('/blog')
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Eroare la actualizare.' })
    },
  })

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.title.trim()) newErrors.title = 'Titlul este obligatoriu.'
    if (!form.excerpt.trim()) newErrors.excerpt = 'Rezumatul este obligatoriu.'
    if (!form.content || form.content === '<p></p>') newErrors.content = 'Conținutul este obligatoriu.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (publish: boolean) => {
    if (!validate()) return
    const data = { ...form, isPublished: publish }
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const handleCategoryChange = (key: string) => {
    const cat = CATEGORIES.find(c => c.key === key)
    if (cat) {
      setForm(f => ({ ...f, category: cat.label, categoryKey: cat.key }))
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/blog')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Înapoi
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editează articol' : 'Articol nou'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSaving}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isSaving ? 'Se salvează...' : 'Salvează draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Se publică...' : '🌐 Publică'}
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main content — left 2/3 */}
        <div className="col-span-2 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titlu *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Titlul articolului..."
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rezumat *
              <span className="text-gray-400 font-normal ml-1">(apare în lista de articole)</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Un scurt rezumat al articolului (2-3 propoziții)..."
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.excerpt ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.excerpt && <p className="mt-1 text-xs text-red-500">{errors.excerpt}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conținut *
            </label>
            {errors.content && (
              <p className="mb-1 text-xs text-red-500">{errors.content}</p>
            )}
            <RichTextEditor
              content={form.content}
              onChange={html => setForm(f => ({ ...f, content: html }))}
              placeholder="Scrie conținutul articolului..."
            />
          </div>
        </div>

        {/* Sidebar — right 1/3 */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Status</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              form.isPublished
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {form.isPublished ? '● Publicat' : '○ Draft'}
            </div>
          </div>

          {/* Category */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Categorie</h3>
            <select
              value={form.categoryKey}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Read time */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Timp de citire</h3>
            <select
              value={form.readTime}
              onChange={e => setForm(f => ({ ...f, readTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {['1 min', '2 min', '3 min', '4 min', '5 min', '6 min', '8 min', '10 min'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Cover image URL */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Imagine cover
              <span className="text-gray-400 font-normal ml-1">(opțional)</span>
            </h3>
            <input
              type="url"
              value={form.coverImage || ''}
              onChange={e => setForm(f => ({ ...f, coverImage: e.target.value || null }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            {form.coverImage && (
              <img
                src={form.coverImage}
                alt="Cover preview"
                className="mt-2 w-full h-24 object-cover rounded-lg"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
