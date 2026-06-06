const db = require('../db');

exports.getProfile = (req, res, next) => {
    const uid = req.user.id;
    db.get(
        `SELECT name,
                email,
                phone,
                graduation_year,
                interests,
                preferred_contact
         FROM users
         WHERE id = ?`,
        [uid],
        (err, user) => {
            if (err) return next(err);
            if (!user) return res.status(404).json({ error: 'Profile not found' });

            try {
                user.interests = JSON.parse(user.interests || '[]');
            } catch {
                user.interests = [];
            }
            res.json({ user });
        }
    );
};

exports.updateProfile = (req, res, next) => {
    const uid = req.user.id;
    const {
        name,
        email,
        phone,
        gradYear,
        interests,
        contact,
    } = req.body;

    // 1) update user (now writing into `name`)
    db.run(
        `UPDATE users
         SET name              = ?,
             email             = ?,
             phone             = ?,
             graduation_year   = ?,
             interests         = ?,
             preferred_contact = ?
         WHERE id = ?`,
        [
            name,
            email,
            phone,
            gradYear,
            JSON.stringify(interests || []),
            contact,
            uid
        ],
        function (err) {
            if (err) return next(err);
            res.json({ success: true });
        }
    );
};
