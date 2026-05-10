import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  workoutApi,
  type Exercise,
  type WorkoutType,
  type Intensity,
  type LogWorkoutData,
} from '../../../lib/clientApi'

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
  defaultUnit: Exercise['defaultUnit']
  sets: DraftSet[]
}

/**
 * Strong/Hevy-style logger.
 * Step 1: pick exercises (search/AI lookup, recent pills surfaced first)
 * Step 2: log sets per exercise (pre-fills last weights/reps)
 * Step 3: confirm & save
 */
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
    // Pre-fill: fetch last set
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
      // No last set, blank first set
    }

    setEntries((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: exercise.category,
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
        return {
          ...e,
          sets: e.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)),
        }
      })
    )
  }

  function addSet(entryIdx: number) {
    setEntries((prev) =>
      prev.map((e, i) => {
        if (i !== entryIdx) return e
        const last = e.sets[e.sets.length - 1] ?? {}
        // Pre-fill from previous set in same exercise
        return { ...e, sets: [...e.sets, { ...last, isWarmup: false }] }
      })
    )
  }

  function removeSet(entryIdx: number, setIdx: number) {
    setEntries((prev) =>
      prev.map((e, i) => {
        if (i !== entryIdx) return e
        return { ...e, sets: e.sets.filter((_, j) => j !== setIdx) }
      })
    )
  }

  function handleAILookup() {
    if (!search.trim()) return
    aiLookupMutation.mutate(search.trim())
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
        <header style={header}>
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
            {step === 'PICK' ? 'Pick exercises' : 'Log sets'}
          </h2>
          <button onClick={onClose} style={closeBtn}>
            ×
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {step === 'PICK' && (
            <>
              <input
                type="search"
                placeholder="Search exercises…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={input}
              />

              {/* Selected pile */}
              {entries.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#ecfdf5', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.625rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 600 }}>
                    Selected ({entries.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {entries.map((e, idx) => (
                      <button
                        key={idx}
                        onClick={() => removeEntry(idx)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'white',
                          border: '1px solid #a7f3d0',
                          borderRadius: '999px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: '#065f46',
                        }}
                      >
                        {e.exerciseName} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Frequent (self-improving signal) */}
              {!search.trim() && frequent && frequent.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ margin: '0 0 0.375rem', fontSize: '0.625rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
                    Most logged
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {frequent.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => addEntry(ex)}
                        style={{
                          padding: '0.375rem 0.625rem',
                          background: '#eef2ff',
                          border: '1px solid #c7d2fe',
                          borderRadius: '999px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: '#3730a3',
                          fontWeight: 500,
                        }}
                      >
                        {ex.name} <span style={{ opacity: 0.6 }}>×{ex.frequency ?? 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {noResults ? (
                <div style={{ marginTop: '1rem', textAlign: 'center', padding: '1.5rem' }}>
                  <p style={{ color: '#9ca3af', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                    Not in our DB. Let AI estimate it.
                  </p>
                  <button
                    onClick={handleAILookup}
                    disabled={aiLookupMutation.isPending}
                    style={{
                      padding: '0.625rem 1rem',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {aiLookupMutation.isPending ? 'Estimating…' : `✨ Estimate "${search}"`}
                  </button>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0' }}>
                  {searchResults.map((ex) => {
                    const isSelected = entries.some((e) => e.exerciseId === ex.id)
                    return (
                      <li key={ex.id}>
                        <button
                          onClick={() => !isSelected && addEntry(ex)}
                          disabled={isSelected}
                          style={{
                            width: '100%',
                            padding: '0.625rem 0.875rem',
                            background: isSelected ? '#ecfdf5' : 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: isSelected ? 'default' : 'pointer',
                            textAlign: 'left',
                            marginBottom: '0.375rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ex.name}</span>
                            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>
                              {ex.equipment ?? ex.category} {isSelected && '· ✓'}
                            </span>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </>
          )}

          {step === 'LOG' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Workout meta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <Field label="Duration (min)">
                  <input
                    type="number"
                    min={1}
                    value={meta.durationMin}
                    onChange={(e) => setMeta({ ...meta, durationMin: Number(e.target.value) || 0 })}
                    style={input}
                  />
                </Field>
                <Field label="Intensity">
                  <select
                    value={meta.intensity}
                    onChange={(e) => setMeta({ ...meta, intensity: e.target.value as Intensity })}
                    style={input}
                  >
                    <option value="LIGHT">Light</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="HIGH">High</option>
                  </select>
                </Field>
              </div>

              {entries.map((entry, eIdx) => (
                <div
                  key={eIdx}
                  style={{
                    padding: '0.875rem',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.875rem' }}>{entry.exerciseName}</strong>
                    <button
                      onClick={() => removeEntry(eIdx)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Remove
                    </button>
                  </div>

                  {/* Set rows */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th style={th}>Set</th>
                        {entry.defaultUnit === 'REPS' && <th style={th}>kg</th>}
                        {entry.defaultUnit === 'REPS' && <th style={th}>reps</th>}
                        {entry.defaultUnit === 'TIME' && <th style={th}>sec</th>}
                        {entry.defaultUnit === 'DISTANCE' && <th style={th}>km</th>}
                        <th style={th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.sets.map((set, sIdx) => (
                        <tr key={sIdx}>
                          <td style={td}>
                            <span style={{ fontWeight: 600 }}>{sIdx + 1}</span>
                          </td>
                          {entry.defaultUnit === 'REPS' && (
                            <>
                              <td style={td}>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={set.weightKg ?? ''}
                                  onChange={(e) =>
                                    updateSet(eIdx, sIdx, 'weightKg', e.target.value ? Number(e.target.value) : undefined)
                                  }
                                  style={smallInput}
                                />
                              </td>
                              <td style={td}>
                                <input
                                  type="number"
                                  value={set.reps ?? ''}
                                  onChange={(e) =>
                                    updateSet(eIdx, sIdx, 'reps', e.target.value ? Number(e.target.value) : undefined)
                                  }
                                  style={smallInput}
                                />
                              </td>
                            </>
                          )}
                          {entry.defaultUnit === 'TIME' && (
                            <td style={td}>
                              <input
                                type="number"
                                value={set.timeSeconds ?? ''}
                                onChange={(e) =>
                                  updateSet(eIdx, sIdx, 'timeSeconds', e.target.value ? Number(e.target.value) : undefined)
                                }
                                style={smallInput}
                              />
                            </td>
                          )}
                          {entry.defaultUnit === 'DISTANCE' && (
                            <td style={td}>
                              <input
                                type="number"
                                step="0.1"
                                value={set.distanceKm ?? ''}
                                onChange={(e) =>
                                  updateSet(eIdx, sIdx, 'distanceKm', e.target.value ? Number(e.target.value) : undefined)
                                }
                                style={smallInput}
                              />
                            </td>
                          )}
                          <td style={td}>
                            {entry.sets.length > 1 && (
                              <button
                                onClick={() => removeSet(eIdx, sIdx)}
                                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem' }}
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button
                    onClick={() => addSet(eIdx)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    + Add set
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <footer
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '0.5rem',
            background: 'white',
          }}
        >
          {step === 'PICK' && (
            <button
              onClick={() => setStep('LOG')}
              disabled={entries.length === 0}
              style={primaryBtn}
            >
              Continue ({entries.length})
            </button>
          )}
          {step === 'LOG' && (
            <>
              <button
                onClick={() => setStep('PICK')}
                style={{ ...primaryBtn, background: '#f3f4f6', color: '#374151' }}
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                style={primaryBtn}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save workout'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151' }}>{label}</span>
      {children}
    </label>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}

const dialog: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '520px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const header: React.CSSProperties = {
  padding: '1rem 1.25rem',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#6b7280',
}

const input: React.CSSProperties = {
  padding: '0.625rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '0.875rem',
}

const smallInput: React.CSSProperties = {
  padding: '0.4rem',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  width: '60px',
  fontSize: '0.75rem',
}

const th: React.CSSProperties = {
  padding: '0.25rem',
  textAlign: 'left',
  fontSize: '0.625rem',
  textTransform: 'uppercase',
  color: '#9ca3af',
  fontWeight: 600,
}

const td: React.CSSProperties = {
  padding: '0.25rem',
}

const primaryBtn: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  background: '#10b981',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
}
