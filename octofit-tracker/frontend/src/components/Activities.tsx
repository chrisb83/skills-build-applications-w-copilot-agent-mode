import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch(() => setError('Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        {loading && <p role="status">Loading activities...</p>}
        {error && <p role="alert">Unable to load activities</p>}
        {!loading && !error && activities.length === 0 && <p>No activities found.</p>}
        {!loading && !error && activities.length > 0 && (
          <ul className="list-group">
            {activities.map((activity, index) => (
              <li className="list-group-item" key={`${activity.type}-${index}`}>
                <strong>{activity.type}</strong> - {activity.minutes} minutes - {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
