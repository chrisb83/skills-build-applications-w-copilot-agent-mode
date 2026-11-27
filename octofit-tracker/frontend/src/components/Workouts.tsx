import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; focus?: string; reason: string; minutes?: number; difficulty?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        {loading && <p role="status">Loading workout suggestions...</p>}
        {error && <p role="alert">Unable to load workout suggestions</p>}
        {!loading && !error && suggestions.length === 0 && <p>No workout suggestions found.</p>}
        {!loading && !error && suggestions.length > 0 && (
          <ul className="list-group">
            {suggestions.map((workout, index) => (
              <li className="list-group-item" key={`${workout.title}-${index}`}>
                <strong>{workout.title}</strong>
                {workout.reason ? ` - ${workout.reason}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
