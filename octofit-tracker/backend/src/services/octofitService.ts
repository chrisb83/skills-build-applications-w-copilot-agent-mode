import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

function plain(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  const input = _input as Record<string, unknown> | null;
  if (!input || !isValidObjectId(input.userId) || !isValidObjectId(input.teamId)) {
    throw httpError(400, 'A valid userId and teamId are required');
  }
  if (typeof input.type !== 'string' || input.type.trim() === '') {
    throw httpError(400, 'Activity type is required');
  }
  if (typeof input.minutes !== 'number' || !Number.isFinite(input.minutes) || input.minutes < 1) {
    throw httpError(400, 'Minutes must be a positive number');
  }
  const [user, team] = await Promise.all([
    User.findById(input.userId),
    Team.findById(input.teamId),
  ]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: input.type.trim(),
    minutes: input.minutes,
    points: input.minutes,
    occurredAt: new Date(),
  });
  return plain(activity.toObject());
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  const input = _input as Record<string, unknown> | null;
  if (!input || typeof input.name !== 'string' || input.name.trim() === '') {
    throw httpError(400, 'Team name is required');
  }
  if (typeof input.mascot !== 'string' || input.mascot.trim() === '') {
    throw httpError(400, 'Team mascot is required');
  }
  const members = Array.isArray(input.members) ? input.members : [];
  if (members.some((id) => !isValidObjectId(id))) {
    throw httpError(400, 'Every team member must have a valid ID');
  }
  if (members.length > 0) {
    const existing = await User.countDocuments({ _id: { $in: members } });
    if (existing !== members.length) throw httpError(404, 'One or more team members were not found');
  }
  const team = await Team.create({
    name: input.name.trim(),
    mascot: input.mascot.trim(),
    members,
  });
  return plain(team.toObject());
}

export async function getLeaderboard() {
  const teams = await Team.find().lean();
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const totalByTeam = new Map(totals.map((entry) => [entry._id.toString(), entry.totalPoints as number]));
  const entries = teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName));
  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  let decodedEmail: string;
  try {
    decodedEmail = decodeURIComponent(userEmail).toLowerCase().trim();
  } catch {
    throw httpError(400, 'Invalid email');
  }
  const user = await User.findOne({ email: decodedEmail }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recent = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus = recent?.type === 'run' || recent?.type === 'cycle'
    ? 'endurance'
    : recent?.type === 'strength'
      ? 'strength'
      : undefined;
  const focus = activityFocus ?? user.fitnessGoal;
  const allWorkouts = await Workout.find().lean();
  const matching = allWorkouts.find((workout) => workout.focus.toLowerCase() === focus.toLowerCase());
  const workout = matching ?? allWorkouts[0];
  if (!workout) return [];

  const reason = recent
    ? `Matches ${recent.type} activity and ${focus} focus`
    : `Matches your ${focus} fitness goal`;
  return [{ ...workout, reason }];
}

export { User };
