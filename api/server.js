require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/course_profile');
const detailsRouter = require('./routes/course_details');
const progressRouter = require('./routes/course_progress');
const reviewsRouter = require('./routes/course_reviews');
const recommendationsRouter = require('./routes/recommendations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'your-super-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use('/api/auth', authRoutes);
app.use('/api/course_profile', profileRoutes);

app.use(
    express.static(path.join(__dirname, '../src'), {
        index: 'login.html'
    })
);

app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    db.get(`SELECT 1 FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            console.error('Signup SELECT error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (row) {
            return res.status(400).json({ success: false, message: 'Username already taken.' });
        }

        bcrypt.hash(password, 10)
            .then(hash => {
                db.run(
                    `INSERT INTO users (username, password_hash) VALUES (?, ?)`,
                    [username, hash],
                    function(err) {
                        if (err) {
                            console.error('Signup INSERT error:', err);
                            return res.status(500).json({ success: false, message: 'Could not create account.' });
                        }
                        res.status(201).json({ success: true, message: 'Account created.' });
                    }
                );
            })
            .catch(e => {
                console.error('Signup bcrypt error:', e);
                res.status(500).json({ success: false, message: 'Encryption error.' });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get(
        `SELECT id, password_hash AS password FROM users WHERE username = ?`,
        [username],
        async (err, row) => {
            if (err) {
                console.error('Login SELECT error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            if (!row) {
                return res.status(400).json({ success: false, message: 'User not found.' });
            }

            try {
                const match = await bcrypt.compare(password, row.password);
                if (!match) {
                    return res.status(400).json({ success: false, message: 'Invalid password.' });
                }

                // ← store both id and username in session
                req.session.user = { id: row.id, username };
                res.json({ success: true, userId: row.id });
            } catch (e) {
                console.error('Login bcrypt compare error:', e);
                res.status(500).json({ success: false, message: 'Authentication error.' });
            }
        }
    );
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.clearCookie('sid');
        res.json({ success: true });
    });
});

app.use('/course-details', detailsRouter);
app.use('/course-progress', progressRouter);
app.use('/course-reviews', reviewsRouter);
app.use('/course-profile', profileRoutes);
app.use('/recommendations', recommendationsRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;
