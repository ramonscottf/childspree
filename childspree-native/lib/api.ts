const BASE = 'https://childspree.org';

async function req(path: string, opts: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((opts.headers as Record<string, string>) || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// Nominations
export const getNominations = (email?: string, token?: string) =>
  req(
    `/api/nominations${email ? `?email=${encodeURIComponent(email)}` : ''}`,
    {},
    token
  );

export const createNomination = (data: object, token?: string) =>
  req('/api/nominations', { method: 'POST', body: JSON.stringify(data) }, token);

export const updateNomination = (id: string, data: object, token?: string) =>
  req(
    `/api/nominations/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    token
  );

// Intake
export const getIntake = (tokenStr: string) =>
  req(`/api/intake/${tokenStr}`);

export const submitIntake = (tokenStr: string, data: object) =>
  req(`/api/intake/${tokenStr}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Video upload URL (multipart handled separately with expo-file-system)
export const getUploadUrl = (tokenStr: string) =>
  `${BASE}/api/upload/${tokenStr}`;

// Volunteers
export const createVolunteer = (data: object) =>
  req('/api/volunteers', { method: 'POST', body: JSON.stringify(data) });

export const getVolunteers = (token?: string) =>
  req('/api/volunteers', {}, token);

export const updateVolunteer = (
  id: string,
  data: object,
  token?: string
) =>
  req(`/api/volunteers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token);

export const sendVolunteerMessage = (data: object, token?: string) =>
  req('/api/volunteers/message', { method: 'POST', body: JSON.stringify(data) }, token);

// Stats
export const getStats = (token?: string) => req('/api/stats', {}, token);

// Role check
export const getUserRole = async (
  email: string
): Promise<'fa' | 'admin' | 'unknown'> => {
  const data = await req(
    `/api/auth/role?email=${encodeURIComponent(email)}`
  );
  return data.role;
};
