const KEY = "ai-teacher-profile";

const empty = () => ({
  topicsStudied: [],
  scores: [], // [{ topic, score, date }]
  strongConcepts: [],
  weakConcepts: [],
});

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : empty();
  } catch {
    return empty();
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // localStorage unavailable — profile just won't persist this session.
  }
}

export function recordAssessment(topic, score, strongAreas = [], weakAreas = []) {
  const profile = loadProfile();
  profile.topicsStudied.push(topic);
  profile.scores.push({ topic, score, date: Date.now() });
  strongAreas.forEach((a) => {
    if (!profile.strongConcepts.includes(a)) profile.strongConcepts.push(a);
  });
  weakAreas.forEach((a) => {
    if (!profile.weakConcepts.includes(a)) profile.weakConcepts.push(a);
  });
  saveProfile(profile);
  return profile;
}
