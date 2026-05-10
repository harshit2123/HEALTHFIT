import { useState, type CSSProperties } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  workoutApi,
  type Exercise,
  type WorkoutType,
  type Intensity,
  type LogWorkoutData,
} from '../../../lib/clientApi'
import { ExerciseCard } from '../../../components/ui/ExerciseCard'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

interface DraftSet {
  reps?: number
  weightKg?: number
  distanceKm?: number
  timeSeconds?: number
  isWarmup?: boolean
}

interface DraftEntry {
  exerciseId: string
  exerciseName: string
  category: Exercise['category']
  primaryMuscles: string[]
  defaultUnit: Exercise['defaultUnit']
  sets: DraftSet[]
}

export function LogWorkoutDialog({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'PICK' | 'LOG'>('PICK')
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState<DraftEntry[]>([])
  const [meta, setMeta] = useState<{
    workoutType: WorkoutType
    durationMin: number
    intensity: Intensity
  }>({ workoutType: 'STRENGTH', durationMin: 45, intensity: 'MODERATE' })

  const { data: searchResults } = useQuery({
    queryKey: ['exercise-search', search],
    queryFn: () => workoutApi.searchExercises(search, 30),
    enabled: step === 'PICK',
  })

  const { data: frequent } = useQuery({
    queryKey: ['exercise-frequent'],
    queryFn: () => workoutApi.getFrequentExercises(8),
    enabled: step === 'PICK',
  })

  const aiLookupMutation = useMutation({
    mutationFn: workoutApi.lookupExercise,
    onSuccess: (data) => addEntry(data.exercise),
  })

  const saveMutation = useMutation({
    mutationFn: (data: LogWorkoutData) => workoutApi.log(data),
    onSuccess,
  })

  async function addEntry(exercise: Exercise) {
    let firstSet: DraftSet = {}
    try {
      const last = await workoutApi.getLastSet(exercise.id)
      if (last) {
        firstSet = {
          reps: last.reps ?? undefined,
          weightKg: last.weightKg ? Number(last.weightKg) : undefined,
          distanceKm: last.distanceKm ? Number(last.distanceKm) : undefined,
          timeSeconds: last.timeSeconds ?? undefined,
        }
      }
    } catch {
      // no last set
    }

    setEntries((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: exercise.category,
        primaryMuscles: exercise.primaryMuscles ?? [],
        defaultUnit: exercise.defaultUnit,
        sets: [firstSet],
      },
    ])
  }

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateSet(entryIdx: number, setIdx: number, field: keyof DraftSet, value: number | boolean | undefined) {
    setEntries((prev) =>
      prev.map((e, i) => {
        if (i !== entryIdx) return e
        return { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)) }
      })
    )
  }

  function addSet(entryIdx: number) {
    setEntries((prev) =>
      prev.map((e, i) => {
        if (i !== entryIdx) return e
        const last = e.sets[e.sets.length - 1] ?? {}
        return { ...e, sets: [...e.sets, { ...last, isWarmup: false }] }
      })
    )
  }

  function handleSave() {
    if (entries.length === 0) return
    saveMutation.mutate({
      workoutType: meta.workoutType,
      durationMin: meta.durationMin,
      intensity: meta.intensity,
      entries: entries.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        sets: e.sets.filter((s) => Object.keys(s).length > 0),
      })),
    })
  }

  const noResults = searchResults && searchResults.length === 0 && search.trim()

  return (
    <div style={overlay} onClick={onClose}>
      <div style={dialog} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header style={dialogHeader}>
          <h2 style={dialogTitle}>
            {step === 'PICK' ? 'Pick Exercises' : 'Log Sets'}
          </h2>
          <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        </header>

        {/* Body */}
        <div style={dialogBody}>
          {step === 'PICK' && (
            <PickStep
              search={search}
              setSearch={setSearch}
              entries={entries}
              searchResults={searchResults}
              frequent={frequent}
              noResults={!!noResults}
              aiPending={aiLookupMutation.isPending}
              onAdd={addEntry}
              onRemove={removeEntry}
              onAILookup={() => { if (search.trim()) aiLookupMutation.mutate(search.trim()) }}
            />
          )}

          {step === 'LOG' && (
            <LogStep
              entries={entries}
              meta={meta}
              onMetaChange={(field, value) => setMeta({ ...meta, [field]: value })}
              onWeightChange={(eIdx, v) => updateSet(eIdx, 0, 'weightKg', v)}
              onRepsChange={(eIdx, v) => updateSet(eIdx, 0, 'reps', v)}
              onAddSet={addSet}
              onRemoveEntry={removeEntry}
            />
          )}
        </div>

        {/* Footer */}
        <footer style={dialogFooter}>
          {step === 'PICK' && (
            <button
              onClick={() => setStep('LOG')}
              disabled={entries.length === 0}
              className="sf-btn-primary"
              style={footerBtn}
            >
              Continue ({entries.length})
            </button>
          )}
          {step === 'LOG' && (
            <>
              <button onClick={() => setStep('PICK')} className="sf-btn-ghost" style={footerBtn}>
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="sf-btn-primary"
                style={footerBtn}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Workout'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}

// ─── Pick step ───────────────────────────────────────────────────────────

function PickStep({
  search,
  setSearch,
  entries,
  searchResults,
  frequent,
  noResults,
  aiPending,
  onAdd,
  onRemove,
  onAILookup,
}: {
  search: string
  setSearch: (v: string) => void
  entries: DraftEntry[]
  searchResults: Exercise[] | undefined
  frequent: (Exercise & { frequency?: number })[] | undefined
  noResults: boolean
  aiPending: boolean
  onAdd: (ex: Exercise) => void
  onRemove: (idx: number) => void
  onAILookup: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input
        type="search"
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        style={searchInput}
      />

      {entries.length > 0 && (
        <div style={selectedPile}>
          <p style={selectedLabel}>Selected ({entries.length})</p>
          <div style={pillRow}>
            {entries.map((e, idx) => (
              <button key={idx} onClick={() => onRemove(idx)} style={selectedPill}>
                {e.exerciseName} ×
              </button>
            ))}
          </div>
        </div>
      )}

      {!search.trim() && frequent && frequent.length > 0 && (
        <div>
          <p style={groupLabel}>Most logged</p>
          <div style={pillRow}>
            {frequent.map((ex) => (
              <button key={ex.id} onClick={() => onAdd(ex)} style={frequentPill}>
                {ex.name} <span style={{ opacity: 0.5 }}>×{ex.frequency ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {noResults ? (
        <div style={aiPrompt}>
          <p style={aiPromptText}>Not in our database. Let AI estimate it.</p>
          <button onClick={onAILookup} disabled={aiPending} className="sf-btn-primary">
            {aiPending ? 'Estimating…' : `✦ Estimate "${search}"`}
          </button>
        </div>
      ) : searchResults && searchResults.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {searchResults.map((ex) => {
            const isSelected = entries.some((e) => e.exerciseId === ex.id)
            return (
              <li key={ex.id}>
                <button
                  onClick={() => !isSelected && onAdd(ex)}
                  disabled={isSelected}
                  style={exRow(isSelected)}
                >
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.875rem', color: isSelected ? 'var(--neon)' : 'var(--text-primary)' }}>
                    {ex.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                    {ex.equipment ?? ex.category} {isSelected && '· ✓'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

// ─── Log step ────────────────────────────────────────────────────────────

function LogStep({
  entries,
  meta,
  onMetaChange,
  onWeightChange,
  onRepsChange,
  onAddSet,
  onRemoveEntry,
}: {
  entries: DraftEntry[]
  meta: { workoutType: WorkoutType; durationMin: number; intensity: Intensity }
  onMetaChange: (field: 'durationMin' | 'intensity', value: number | Intensity) => void
  onWeightChange: (entryIdx: number, v: number) => void
  onRepsChange: (entryIdx: number, v: number) => void
  onAddSet: (entryIdx: number) => void
  onRemoveEntry: (entryIdx: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Meta row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <label style={metaLabel}>
          <span style={metaLabelText}>Duration (min)</span>
          <input
            type="number"
            min={1}
            value={meta.durationMin}
            onChange={(e) => onMetaChange('durationMin', Number(e.target.value) || 0)}
            style={metaInput}
          />
        </label>
        <label style={metaLabel}>
          <span style={metaLabelText}>Intensity</span>
          <select
            value={meta.intensity}
            onChange={(e) => onMetaChange('intensity', e.target.value as Intensity)}
            style={metaInput}
          >
            <option value="LIGHT">Light</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High</option>
          </select>
        </label>
      </div>

      {entries.map((entry, eIdx) => (
        <ExerciseCard
          key={eIdx}
          exerciseName={entry.exerciseName}
          category={entry.category}
          primaryMuscles={entry.primaryMuscles}
          weightKg={entry.sets[0]?.weightKg}
          reps={entry.sets[0]?.reps}
          sets={entry.sets.length}
          onWeightChange={(v) => onWeightChange(eIdx, v)}
          onRepsChange={(v) => onRepsChange(eIdx, v)}
          onAddSet={() => onAddSet(eIdx)}
          onRemove={() => onRemoveEntry(eIdx)}
        />
      ))}
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}

const dialog: CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-lg)',
  width: '100%',
  maxWidth: '520px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const dialogHeader: CSSProperties = {
  padding: '1rem 1.25rem',
  borderBottom: '1px solid var(--neon-border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'var(--bg-card)',
}

const dialogTitle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '1.25rem',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
}

const closeBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  lineHeight: 1,
  padding: '0',
}

const dialogBody: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '1.25rem',
}

const dialogFooter: CSSProperties = {
  padding: '1rem 1.25rem',
  borderTop: '1px solid var(--neon-border)',
  display: 'flex',
  gap: '0.5rem',
  background: 'var(--bg-card)',
}

const footerBtn: CSSProperties = { flex: 1 }

const searchInput: CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'var(--bg-muted)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectedPile: CSSProperties = {
  padding: '0.75rem',
  background: 'var(--neon-dim)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-md)',
}

const selectedLabel: CSSProperties = {
  margin: '0 0 0.5rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-neon)',
}

const pillRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.375rem',
}

const selectedPill: CSSProperties = {
  padding: '0.25rem 0.625rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: '100px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '0.75rem',
  color: 'var(--neon)',
}

const groupLabel: CSSProperties = {
  margin: '0 0 0.375rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const frequentPill: CSSProperties = {
  padding: '0.375rem 0.625rem',
  background: 'var(--bg-muted)',
  border: '1px solid var(--neon-border)',
  borderRadius: '100px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
}

const aiPrompt: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1.5rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-md)',
}

const aiPromptText: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  textAlign: 'center',
}

function exRow(isSelected: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '0.625rem 0.875rem',
    background: isSelected ? 'var(--neon-dim)' : 'var(--bg-card)',
    border: `1px solid ${isSelected ? 'var(--neon-border-md)' : 'var(--neon-border)'}`,
    borderRadius: 'var(--radius-sm)',
    cursor: isSelected ? 'default' : 'pointer',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
}

const metaLabel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const metaLabelText: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const metaInput: CSSProperties = {
  padding: '0.5rem 0.625rem',
  background: 'var(--bg-muted)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  colorScheme: 'dark',
}
