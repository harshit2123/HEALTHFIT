import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { calorieApi, type FoodItem, type MealType } from '../../../lib/clientApi'

interface Props {
  mealType: MealType
  loggedDate: string // YYYY-MM-DD
  onClose: () => void
  onSuccess: () => void
}

type Step = 'SEARCH' | 'CONFIRM' | 'CUSTOM' | 'BULK'

export function LogMealDialog({ mealType, loggedDate, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('SEARCH')
  const [search, setSearch] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [foodSource, setFoodSource] = useState<'DB' | 'AI' | null>(null)
  const [multiplier, setMultiplier] = useState('1')

  const [bulkText, setBulkText] = useState('')
  const [bulkResults, setBulkResults] = useState<
    Array<{ food: FoodItem; source: 'DB' | 'AI'; selected: boolean }>
  >([])

  const [customForm, setCustomForm] = useState({
    foodName: '',
    servingSize: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    fiberG: '',
  })

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: calorieApi.getAIStatus,
  })

  const { data: foods, isLoading } = useQuery({
    queryKey: ['food-search', search],
    queryFn: () => calorieApi.searchFoods(search, 30),
    enabled: step === 'SEARCH',
  })

  // Personalized suggestions: shown when search is empty
  const { data: suggestions } = useQuery({
    queryKey: ['food-suggestions'],
    queryFn: () => calorieApi.getSuggestions(8),
    enabled: step === 'SEARCH',
  })

  // AI single lookup (when search returns no exact match)
  const aiLookupMutation = useMutation({
    mutationFn: calorieApi.lookupFood,
    onSuccess: (data) => {
      setSelectedFood(data.food)
      setFoodSource(data.source)
      setMultiplier('1')
      setStep('CONFIRM')
    },
  })

  // AI bulk parse
  const bulkParseMutation = useMutation({
    mutationFn: calorieApi.parseMeal,
    onSuccess: (data) => {
      setBulkResults(data.items.map((item) => ({ ...item, selected: true })))
    },
  })

  const logMutation = useMutation({
    mutationFn: calorieApi.logCalorie,
    onSuccess,
  })

  // Log multiple foods sequentially (used after bulk parse confirmation)
  const bulkLogMutation = useMutation({
    mutationFn: async (items: typeof bulkResults) => {
      for (const item of items) {
        if (!item.selected) continue
        await calorieApi.logCalorie({
          mealType,
          foodName: item.food.name,
          servingSize: item.food.servingSize,
          foodId: item.food.id,
          servingMultiplier: 1,
          loggedDate: new Date(`${loggedDate}T12:00:00`).toISOString(),
        })
      }
    },
    onSuccess,
  })

  function handleSelectFood(food: FoodItem) {
    setSelectedFood(food)
    setFoodSource('DB')
    setMultiplier('1')
    setStep('CONFIRM')
  }

  function handleAILookup() {
    if (!search.trim()) return
    aiLookupMutation.mutate(search.trim())
  }

  function handleConfirm() {
    if (!selectedFood) return
    const mult = Number(multiplier) || 1
    logMutation.mutate({
      mealType,
      foodName: selectedFood.name,
      servingSize: selectedFood.servingSize,
      foodId: selectedFood.id,
      servingMultiplier: mult,
      loggedDate: new Date(`${loggedDate}T12:00:00`).toISOString(),
    })
  }

  function handleBulkParse() {
    if (!bulkText.trim()) return
    bulkParseMutation.mutate(bulkText.trim())
  }

  function handleBulkLog() {
    bulkLogMutation.mutate(bulkResults)
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault()
    logMutation.mutate({
      mealType,
      foodName: customForm.foodName,
      servingSize: customForm.servingSize,
      calories: Number(customForm.calories),
      proteinG: Number(customForm.proteinG) || 0,
      carbsG: Number(customForm.carbsG) || 0,
      fatG: Number(customForm.fatG) || 0,
      fiberG: customForm.fiberG ? Number(customForm.fiberG) : undefined,
      loggedDate: new Date(`${loggedDate}T12:00:00`).toISOString(),
    })
  }

  // Calculated macros for preview
  const previewCalories = selectedFood
    ? Math.round(Number(selectedFood.caloriesPer100g) * (Number(multiplier) || 1))
    : 0

  const aiAvailable = aiStatus?.aiAvailable ?? false
  const noResults = !isLoading && foods && foods.length === 0 && search.trim()

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
            Add to {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </header>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Mode tabs */}
          {step !== 'CONFIRM' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <ModeTab active={step === 'SEARCH'} onClick={() => setStep('SEARCH')}>Search</ModeTab>
              {aiAvailable && (
                <ModeTab active={step === 'BULK'} onClick={() => setStep('BULK')} badge="AI">
                  Type meal
                </ModeTab>
              )}
              <ModeTab active={step === 'CUSTOM'} onClick={() => setStep('CUSTOM')}>Manual</ModeTab>
            </div>
          )}

          {step === 'SEARCH' && (
            <>
              <input
                type="search"
                placeholder="Search Indian foods…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box', marginBottom: '1rem' }}
              />

              {/* Personalized suggestions: only when no search query */}
              {!search.trim() && suggestions && (suggestions.recent.length > 0 || suggestions.frequent.length > 0) && (
                <div style={{ marginBottom: '1rem' }}>
                  {suggestions.recent.length > 0 && (
                    <SuggestionRow
                      title="Recent"
                      foods={suggestions.recent}
                      onSelect={handleSelectFood}
                    />
                  )}
                  {suggestions.frequent.length > 0 && (
                    <SuggestionRow
                      title="Most logged"
                      foods={suggestions.frequent}
                      onSelect={handleSelectFood}
                    />
                  )}
                  <hr style={{ border: 0, borderTop: '1px solid #f3f4f6', margin: '0.75rem 0' }} />
                </div>
              )}

              {isLoading ? (
                <p>Loading foods…</p>
              ) : noResults ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
                    No exact match for &ldquo;{search}&rdquo;
                  </p>
                  {aiAvailable ? (
                    <button
                      onClick={handleAILookup}
                      disabled={aiLookupMutation.isPending}
                      style={{
                        padding: '0.625rem 1.25rem',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {aiLookupMutation.isPending ? 'Estimating…' : `✨ Estimate with AI`}
                    </button>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      AI estimation not configured. Try manual entry.
                    </p>
                  )}
                  {aiLookupMutation.isError && (
                    <p style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.75rem' }}>
                      {(aiLookupMutation.error as { response?: { data?: { error?: string } } })
                        ?.response?.data?.error ?? 'AI lookup failed'}
                    </p>
                  )}
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {foods?.map((food) => (
                    <li key={food.id}>
                      <button
                        onClick={() => handleSelectFood(food)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>
                              {food.name}
                              {food.nameLocal && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>{food.nameLocal}</span>
                              )}
                            </p>
                            <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                              {food.servingSize}
                              {food.category ? ` · ${food.category}` : ''}
                            </p>
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#10b981' }}>
                            {Math.round(Number(food.caloriesPer100g))} kcal
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === 'BULK' && (
            <div>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Type what you ate. AI parses it.
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="e.g. 2 rotis with dal tadka, half cup rice, glass of buttermilk"
                rows={3}
                autoFocus
                style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }}
              />

              {bulkResults.length === 0 && (
                <button
                  onClick={handleBulkParse}
                  disabled={bulkParseMutation.isPending || !bulkText.trim()}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {bulkParseMutation.isPending ? 'Parsing…' : '✨ Parse with AI'}
                </button>
              )}

              {bulkParseMutation.isError && (
                <p style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.75rem' }}>
                  AI parsing failed. Try simpler description.
                </p>
              )}

              {bulkResults.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                    {bulkResults.length} item{bulkResults.length === 1 ? '' : 's'} parsed:
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {bulkResults.map((item, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          background: item.selected ? 'white' : '#f9fafb',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => {
                            const next = [...bulkResults]
                            next[idx] = { ...next[idx]!, selected: e.target.checked }
                            setBulkResults(next)
                          }}
                          style={{ marginRight: '0.625rem' }}
                        />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
                            {item.food.name}
                            {item.source === 'AI' && (
                              <span style={{ marginLeft: '0.5rem', padding: '0.0625rem 0.375rem', background: '#eef2ff', color: '#6366f1', borderRadius: '999px', fontSize: '0.625rem', fontWeight: 600 }}>
                                AI
                              </span>
                            )}
                          </p>
                          <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                            {item.food.servingSize} · {Math.round(Number(item.food.caloriesPer100g))} kcal
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleBulkLog}
                    disabled={bulkLogMutation.isPending || bulkResults.every((i) => !i.selected)}
                    style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {bulkLogMutation.isPending
                      ? 'Adding…'
                      : `Add ${bulkResults.filter((i) => i.selected).length} item${bulkResults.filter((i) => i.selected).length === 1 ? '' : 's'}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'CONFIRM' && selectedFood && (
            <div>
              <button onClick={() => setStep('SEARCH')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}>
                ← Back
              </button>

              <div style={{ marginTop: '1rem', padding: '1rem', background: '#ecfdf5', borderRadius: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedFood.name}
                  {foodSource === 'AI' && (
                    <span style={{ padding: '0.125rem 0.5rem', background: '#eef2ff', color: '#6366f1', borderRadius: '999px', fontSize: '0.625rem', fontWeight: 600 }}>
                      AI estimate
                    </span>
                  )}
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  Per {selectedFood.servingSize}: {Math.round(Number(selectedFood.caloriesPer100g))} kcal · P {Number(selectedFood.proteinG)}g · C {Number(selectedFood.carbsG)}g · F {Number(selectedFood.fatG)}g
                </p>
                {foodSource === 'AI' && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.625rem', color: '#9ca3af' }}>
                    AI-estimated from your input. Edit values if inaccurate.
                  </p>
                )}
              </div>

              <label style={{ display: 'block', marginTop: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                How many servings?
                <input
                  type="number"
                  step="0.5"
                  min="0.25"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  style={{ display: 'block', width: '100%', padding: '0.625rem', marginTop: '0.25rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </label>

              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                Total: <strong>{previewCalories} kcal</strong>
              </p>

              {logMutation.isError && (
                <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>Failed to log</p>
              )}

              <button
                onClick={handleConfirm}
                disabled={logMutation.isPending}
                style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                {logMutation.isPending ? 'Adding…' : 'Add to meal'}
              </button>
            </div>
          )}

          {step === 'CUSTOM' && (
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input style={inputStyle} placeholder="Food name (e.g. 'Restaurant biryani')" value={customForm.foodName} onChange={(e) => setCustomForm({ ...customForm, foodName: e.target.value })} required minLength={2} />
              <input style={inputStyle} placeholder="Serving size (e.g. '1 plate')" value={customForm.servingSize} onChange={(e) => setCustomForm({ ...customForm, servingSize: e.target.value })} required />
              <input style={inputStyle} type="number" min={0} placeholder="Calories" value={customForm.calories} onChange={(e) => setCustomForm({ ...customForm, calories: e.target.value })} required />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <input style={inputStyle} type="number" step="0.1" min={0} placeholder="Protein g" value={customForm.proteinG} onChange={(e) => setCustomForm({ ...customForm, proteinG: e.target.value })} />
                <input style={inputStyle} type="number" step="0.1" min={0} placeholder="Carbs g" value={customForm.carbsG} onChange={(e) => setCustomForm({ ...customForm, carbsG: e.target.value })} />
                <input style={inputStyle} type="number" step="0.1" min={0} placeholder="Fat g" value={customForm.fatG} onChange={(e) => setCustomForm({ ...customForm, fatG: e.target.value })} />
              </div>
              <button type="submit" disabled={logMutation.isPending} style={{ padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                {logMutation.isPending ? 'Adding…' : 'Add manual entry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function SuggestionRow({
  title,
  foods,
  onSelect,
}: {
  title: string
  foods: FoodItem[]
  onSelect: (f: FoodItem) => void
}) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <p style={{ margin: '0 0 0.375rem', fontSize: '0.625rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {foods.slice(0, 6).map((food) => (
          <button
            key={food.id}
            onClick={() => onSelect(food)}
            style={{
              padding: '0.375rem 0.625rem',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: '#065f46',
              fontWeight: 500,
            }}
          >
            {food.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function ModeTab({ active, onClick, children, badge }: { active: boolean; onClick: () => void; children: React.ReactNode; badge?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.4rem 0.75rem',
        background: active ? '#6366f1' : '#f3f4f6',
        color: active ? 'white' : '#374151',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
      }}
    >
      {children}
      {badge && (
        <span style={{ padding: '0.0625rem 0.375rem', background: active ? 'rgba(255,255,255,0.25)' : '#eef2ff', color: active ? 'white' : '#6366f1', borderRadius: '999px', fontSize: '0.625rem' }}>
          {badge}
        </span>
      )}
    </button>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: '1rem',
}

const dialogStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '480px',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const inputStyle: React.CSSProperties = {
  padding: '0.625rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  width: '100%',
  boxSizing: 'border-box',
}
