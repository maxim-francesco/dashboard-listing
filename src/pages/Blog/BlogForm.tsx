import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  CreateBlogPostData,
  generateArticle,
  suggestTopics,
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
  const [topic, setTopic] = useState('')
  const [showTopicInput, setShowTopicInput] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [overwriteConfirm, setOverwriteConfirm] = useState<null | (() => void)>(null)

  const genArticle = useMutation({
    mutationFn: generateArticle,
    onSuccess: (data) => {
      setForm(f => ({
        ...f,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        categoryKey: data.categoryKey,
        readTime: data.readTime,
      }))
      setShowTopicInput(false)
      setTopic('')
      setSuggestions([])
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.error || 'Generarea a eșuat.' })
    },
  })

  const suggestMutation = useMutation({
    mutationFn: suggestTopics,
    onSuccess: (data) => setSuggestions(data.suggestions || []),
    onError: (err: any) => setErrors({ submit: err.response?.data?.error || 'Nu s-au putut genera sugestii.' }),
  })

  const guardOverwrite = (action: () => void) => {
    if (form.content && form.content.trim() !== '<p></p>' && form.content.trim() !== '') {
      setOverwriteConfirm(() => action)
    } else {
      action()
    }
  }

  const handleGenerateClick = (template: string) => {
    if (template === 'subiect_liber') {
      setShowTopicInput(prev => !prev)
      return
    }
    
    setShowTopicInput(false)
    guardOverwrite(() => genArticle.mutate({ template }))
  }

  const handleTopicSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!topic.trim()) return
    guardOverwrite(() => genArticle.mutate({ template: 'subiect_liber', topic }))
  }


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
          {/* AI Panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <h3 className="text-sm font-semibold text-gray-800">Generează cu AI</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleGenerateClick('diesel_vs_benzina')}
                disabled={genArticle.isPending}
                className="px-3.5 py-2 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Diesel vs Benzină
              </button>
              <button
                type="button"
                onClick={() => handleGenerateClick('prima_inmatriculare_de')}
                disabled={genArticle.isPending}
                className="px-3.5 py-2 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Prima înmatriculare (DE)
              </button>
              <button
                type="button"
                onClick={() => handleGenerateClick('top_suv_stoc')}
                disabled={genArticle.isPending}
                className="px-3.5 py-2 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Top 5 SUV-uri din stoc
              </button>
              <button
                type="button"
                onClick={() => handleGenerateClick('subiect_liber')}
                disabled={genArticle.isPending}
                className={`px-3.5 py-2 text-xs font-medium border rounded-lg transition-colors ${
                  showTopicInput 
                    ? 'bg-blue-50 text-blue-700 border-blue-300' 
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                Subiect liber
              </button>
            </div>

            {showTopicInput && (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Scrie ideea ta de articol</label>
                  <textarea
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Ex: Cum aleg primul SUV pentru familie; ce să verific la un diesel cu mulți km..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={genArticle.isPending}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleTopicSubmit()}
                    disabled={!topic.trim() || genArticle.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50 transition-colors"
                  >
                    Generează articol
                  </button>
                  <button
                    type="button"
                    onClick={() => suggestMutation.mutate()}
                    disabled={suggestMutation.isPending}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {suggestMutation.isPending ? 'Se încarcă ideile...' : '💡 Nu știu, dă-mi idei'}
                  </button>
                </div>
                {suggestions.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-gray-200">
                    <p className="text-[11px] text-gray-500 font-medium">Alege o idee, apoi editează dacă vrei și apasă Generează.</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTopic(suggestion)}
                          className="px-3 py-1.5 text-xs text-left bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 rounded-full transition-colors font-medium shadow-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {genArticle.isPending && (
              <div className="mt-4 flex items-center justify-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium animate-pulse">Se generează articolul...</span>
              </div>
            )}
          </div>

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

      {overwriteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Suprascrii articolul curent?</h3>
            <p className="text-sm text-gray-600">Conținutul actual va fi înlocuit de articolul generat.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOverwriteConfirm(null)}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={() => {
                  const a = overwriteConfirm
                  setOverwriteConfirm(null)
                  a && a()
                }}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Suprascrie și generează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
