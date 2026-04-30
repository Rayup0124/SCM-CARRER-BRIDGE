import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

type Internship = {
  _id: string;
  title: string;
  description: string;
};

const ApiTestPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [programme, setProgramme] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const apiBase = 'http://localhost:4000/api';

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage('Confirm password does not match.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/register/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          studentId,
          programme,
          skills: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`Register failed: ${data.message ?? 'Unknown error'}`);
        return;
      }

      setMessage('Student registered successfully. Check MongoDB collection.');
    } catch (error) {
      setMessage('Network error while registering student.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchInternships = async () => {
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/internships`);
      const data = await res.json();

      if (!res.ok) {
        setMessage(`Fetch failed: ${data.message ?? 'Unknown error'}`);
        return;
      }

      setInternships(data);
    } catch (error) {
      setMessage('Network error while fetching internships.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: 24 }}>
      <header style={{ marginBottom: 12 }}>
        <Link to="/" style={{ color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' }}>
          SCM CAREER BRIDGE
        </Link>
      </header>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>API Test Page</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <section style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>1. Student Registration Test</h2>
          <form onSubmit={handleRegister} style={{ display: 'grid', gap: 8 }}>
            <label>
              <div>Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%' }} />
            </label>
            <label>
              <div>Email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </label>
            <label>
              <div>Password</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{ padding: '4px 8px' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            <label>
              <div>Confirm Password</div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </label>
            <label>
              <div>Student ID</div>
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </label>
            <label>
              <div>Programme</div>
              <select
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                required
                style={{ width: '100%' }}
              >
                <option value="">Select a programme</option>
                <option value="Bachelor of Computer Science (Hons)">
                  Bachelor of Computer Science (Hons)
                </option>
                <option value="Bachelor of Arts in Industrial Design (Hons)">
                  Bachelor of Arts in Industrial Design (Hons)
                </option>
                <option value="Bachelor of Arts (Hons) in Creative Digital Media">
                  Bachelor of Arts (Hons) in Creative Digital Media
                </option>
                <option value="Bachelor of Mobile Game Development (Hons)">
                  Bachelor of Mobile Game Development (Hons)
                </option>
              </select>
            </label>
            <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Submitting...' : 'Register Student'}
            </button>
          </form>
        </section>

        <section style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>2. Internships List Test</h2>
          <button type="button" onClick={handleFetchInternships} disabled={loading} style={{ marginBottom: 12 }}>
            {loading ? 'Loading...' : 'Fetch Internships'}
          </button>

          {internships.length > 0 && (
            <ul>
              {internships.map((item) => (
                <li key={item._id}>
                  <strong>{item.title}</strong> - {item.description}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {message && (
        <p style={{ marginTop: 16, color: '#b91c1c' }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default ApiTestPage;


