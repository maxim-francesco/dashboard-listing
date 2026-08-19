import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, Globe } from 'lucide-react'
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  CreateBlogPostData,
  generateArticle,
  suggestTopics,
} from '@/services/api'
import RichTextEditor from '@/components/BlogEditor/RichTextEditor'
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
  const [aiOpen, setAiOpen] = useState(false)

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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <button
          type="button"
          onClick={() => navigate('/blog')}
          aria-label="Înapoi"
          className="w-9 h-9 min-h-[44px] min-w-[44px] border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-medium text-foreground truncate">
            {isEditing ? 'Editează articol' : 'Articol nou'}
          </h1>
          {isEditing && (
            <p className="text-[12px] text-muted-foreground">
              {form.isPublished ? 'Publicat' : 'Draft'}
            </p>
          )}
        </div>
      </div>

      {errors.submit && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — left 2/3 on desktop, 1st on mobile */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Panel — Collapsible toggle */}
          <div>
            <button
              type="button"
              onClick={() => setAiOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-dashed border-primary/40 bg-primary/[0.06] text-primary text-[13px] font-medium min-h-[44px] hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Generează cu AI</span>
              </div>
              {aiOpen ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </button>

            {aiOpen && (
              <div className="mt-3 bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateClick('diesel_vs_benzina')}
                    disabled={genArticle.isPending}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-medium bg-muted text-muted-foreground border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors flex items-center"
                  >
                    Diesel vs Benzină
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateClick('prima_inmatriculare_de')}
                    disabled={genArticle.isPending}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-medium bg-muted text-muted-foreground border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors flex items-center"
                  >
                    Prima înmatriculare (DE)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateClick('top_suv_stoc')}
                    disabled={genArticle.isPending}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-medium bg-muted text-muted-foreground border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors flex items-center"
                  >
                    Top 5 SUV-uri din stoc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateClick('subiect_liber')}
                    disabled={genArticle.isPending}
                    className={`min-h-[44px] px-3.5 py-2 text-xs font-medium border rounded-lg transition-colors flex items-center ${
                      showTopicInput 
                        ? 'bg-primary/10 text-primary border-primary/30' 
                        : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                    } disabled:opacity-50`}
                  >
                    Subiect liber
                  </button>
                </div>

                {showTopicInput && (
                  <div className="p-4 bg-muted border border-border rounded-lg space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Scrie ideea ta de articol</label>
                      <textarea
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="Ex: Cum aleg primul SUV pentru familie; ce să verific la un diesel cu mulți km..."
                        rows={3}
                        className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                        disabled={genArticle.isPending}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTopicSubmit()}
                        disabled={!topic.trim() || genArticle.isPending}
                        className="min-h-[44px] px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-sm disabled:opacity-50 transition-colors"
                      >
                        Generează articol
                      </button>
                      <button
                        type="button"
                        onClick={() => suggestMutation.mutate()}
                        disabled={suggestMutation.isPending}
                        className="min-h-[44px] px-4 py-2 bg-card border border-border text-foreground font-medium rounded-lg text-sm hover:bg-muted disabled:opacity-50 transition-colors"
                      >
                        {suggestMutation.isPending ? 'Se încarcă ideile...' : '💡 Nu știu, dă-mi idei'}
                      </button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <p className="text-[11px] text-muted-foreground font-medium">Alege o idee, apoi editează dacă vrei și apasă Generează.</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setTopic(suggestion)}
                              className="min-h-[36px] px-3 py-1.5 text-xs text-left bg-card border border-border hover:border-primary/40 hover:bg-primary/5 text-foreground rounded-full transition-colors font-medium shadow-sm flex items-center"
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
                  <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium animate-pulse">Se generează articolul...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Titlu *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Titlul articolului..."
              className={`min-h-[44px] w-full px-3 py-2 bg-background text-foreground border rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent ${
                errors.title ? 'border-destructive' : 'border-input'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Rezumat *
              <span className="text-muted-foreground font-normal ml-1">(apare în lista de articole)</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Un scurt rezumat al articolului (2-3 propoziții)..."
              rows={3}
              className={`w-full px-3 py-2 bg-background text-foreground border rounded-lg text-sm resize-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                errors.excerpt ? 'border-destructive' : 'border-input'
              }`}
            />
            {errors.excerpt && <p className="mt-1 text-xs text-destructive">{errors.excerpt}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Conținut *
            </label>
            {errors.content && (
              <p className="mb-1 text-xs text-destructive">{errors.content}</p>
            )}
            <RichTextEditor
              content={form.content}
              onChange={html => setForm(f => ({ ...f, content: html }))}
              placeholder="Scrie conținutul articolului..."
            />
          </div>
        </div>

        {/* Mobile divider */}
        <div className="border-t border-border lg:hidden" />

        {/* Sidebar — right 1/3 on desktop, below divider on mobile */}
        <div className="space-y-4">
          {/* Consolidated "Detalii articol" Card */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3.5">
            <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Detalii articol
            </h3>

            {/* Status row */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-[13px] text-muted-foreground">Status</span>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                form.isPublished
                  ? 'bg-success-light text-success'
                  : 'bg-warning-light text-warning'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {form.isPublished ? 'Publicat' : 'Draft'}
              </div>
            </div>

            {/* Categorie + Timp de citire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Categorie</label>
                <select
                  value={form.categoryKey}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="min-h-[44px] w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Timp de citire</label>
                <select
                  value={form.readTime}
                  onChange={e => setForm(f => ({ ...f, readTime: e.target.value }))}
                  className="min-h-[44px] w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring"
                >
                  {['1 min', '2 min', '3 min', '4 min', '5 min', '6 min', '8 min', '10 min'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Imagine cover row */}
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Imagine cover <span className="font-normal">(opțional)</span>
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-14 h-10 rounded-lg border border-border bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                  {form.coverImage ? (
                    <img
                      src={form.coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <input
                  type="url"
                  value={form.coverImage || ''}
                  onChange={e => setForm(f => ({ ...f, coverImage: e.target.value || null }))}
                  placeholder="https://..."
                  className="min-h-[44px] flex-1 min-w-0 px-3 py-2 bg-background text-foreground border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Save Bar (mobile) / Static bottom (desktop) */}
      <div className="sticky bottom-0 lg:static flex items-center justify-end gap-2 p-3 bg-background border-t border-border mt-6 -mx-4 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:mx-0 lg:p-0 lg:border-t-0 lg:bg-transparent lg:mt-6 z-30">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSaving}
          className="min-h-[44px] px-4 py-2 text-sm font-medium border border-border bg-card text-foreground rounded-lg hover:bg-accent disabled:opacity-50 transition-colors flex items-center justify-center flex-1 sm:flex-initial"
        >
          {isSaving ? 'Se salvează...' : 'Salvează draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isSaving}
          className="min-h-[44px] px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
        >
          <Globe className="w-4 h-4 shrink-0" />
          {isSaving ? 'Se publică...' : 'Publică'}
        </button>
      </div>

      {/* AI Overwrite Confirmation AlertDialog */}
      <AlertDialog open={overwriteConfirm !== null} onOpenChange={(open) => !open && setOverwriteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[17px] font-medium text-foreground">
              Suprascrii articolul curent?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-muted-foreground">
              Conținutul actual va fi înlocuit de articolul generat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="min-h-[44px]">Anulează</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                const action = overwriteConfirm
                setOverwriteConfirm(null)
                if (action) action()
              }}
            >
              Suprascrie și generează
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
