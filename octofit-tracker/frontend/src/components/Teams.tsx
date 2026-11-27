import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError('Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        {loading && <p role="status">Loading teams...</p>}
        {error && <p role="alert">Unable to load teams</p>}
        {!loading && !error && teams.length === 0 && <p>No teams found.</p>}
        {!loading && !error && teams.length > 0 && (
          <ul className="list-group">
            {teams.map((team, index) => (
              <li className="list-group-item" key={`${team.name}-${index}`}>
                <strong>{team.name}</strong>
                {team.mascot ? ` - ${team.mascot}` : ''}
                {team.members.length > 0 ? ` - ${team.members.length} members` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
