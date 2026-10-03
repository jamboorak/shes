import { FormEvent, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { Pet, SessionUser } from './types'
import './Dashboard.css'

export default function Dashboard({ session, onLogout }: { session: SessionUser; onLogout: () => void }) {
  const [pets, setPets] = useState<Pet[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [breed, setBreed] = useState('')
  const [age, setAge] = useState('')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    void fetchPets()
  }, [])

  async function fetchPets() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', session.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch pets error:', error)
      setErrorMessage(`Unable to load pets: ${error.message}. Create the pets table in Supabase and make sure RLS allows reads.`)
      setPets([])
    } else {
      setPets(data ?? [])
    }

    setLoading(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !type.trim()) return

    setErrorMessage('')

    const petData = {
      name: name.trim(),
      type: type.trim(),
      breed: breed.trim(),
      age: age ? Number(age) : null,
      notes: notes.trim(),
      user_id: session.id,
    }

    if (editingId !== null) {
      const { error } = await supabase.from('pets').update(petData).eq('id', editingId).eq('user_id', session.id)

      if (error) {
        console.error('Update pet error:', error)
        setErrorMessage(`Update failed: ${error.message}. Check your pets table and policies.`)
        return
      }
    } else {
      const { error } = await supabase.from('pets').insert(petData)

      if (error) {
        console.error('Insert pet error:', error)
        setErrorMessage(`Add pet failed: ${error.message}. Make sure the pets table exists and user_id is allowed by your RLS policy.`)
        return
      }
    }

    resetForm()
    void fetchPets()
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from('pets').delete().eq('id', id).eq('user_id', session.id)
    if (!error) void fetchPets()
  }

  function handleEdit(pet: Pet) {
    setEditingId(pet.id)
    setName(pet.name)
    setType(pet.type)
    setBreed(pet.breed || '')
    setAge(pet.age !== undefined && pet.age !== null ? String(pet.age) : '')
    setNotes(pet.notes || '')
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setType('')
    setBreed('')
    setAge('')
    setNotes('')
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1>Your Pets</h1>
            <p>{session.email}</p>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout}>
            Log Out
          </button>
        </header>

        <form className="item-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Pet name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Type (dog, cat, bird...)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Breed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="0"
          />
          <input
            type="text"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="form-actions">
            <button type="submit" className="add-btn">
              {editingId !== null ? 'Update Pet' : '+ Add Pet'}
            </button>
            {editingId !== null && (
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
          {errorMessage && <div className="error-banner">{errorMessage}</div>}
        </form>

        <div className="items-list">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : pets.length === 0 ? (
            <div className="empty-state">No pets yet — add your first pet above.</div>
          ) : (
            pets.map((pet) => (
              <div key={pet.id} className="item-card">
                <div className="item-content">
                  <h3>{pet.name}</h3>
                  <p>
                    {pet.type}
                    {pet.breed ? ` • ${pet.breed}` : ''}
                    {pet.age !== undefined && pet.age !== null ? ` • ${pet.age} years` : ''}
                  </p>
                  {pet.notes && <p>{pet.notes}</p>}
                </div>
                <div className="item-actions">
                  <button type="button" onClick={() => handleEdit(pet)} className="edit-btn">
                    ✏️
                  </button>
                  <button type="button" onClick={() => handleDelete(pet.id)} className="delete-btn">
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
