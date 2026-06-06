const db = require('../db');

exports.getProgress = async (req, res, next) => {
    const userId = Number.parseInt(req.params.userId, 10);
    try {
        const user = await databaseGetProgress(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User does not exist' });

        res.status(200).json({
            userId,
            courseProgress: parseJson(user.course_progress, {}),
            courses: parseJson(user.courses, []),
            success: true
        });
    } catch (err) {
        next(err);
    }
}

exports.setProgress = async (req, res, next) => {
    const { courseProgress, courses } = req.body;
    const userId = Number.parseInt(req.body.userId, 10);
    try {
        const changes = await databaseSetProgress(userId, courseProgress, courses);
        if (changes === 0) return res.status(404).json({ success: false, error: 'User does not exist' });
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
}

exports.deleteProgress = async (req, res, next) => {
    const userId = Number.parseInt(req.params.userId, 10);
    try {
        const changes = await databaseSetProgress(userId, null, null);
        if (changes === 0) return res.status(404).json({ success: false, error: 'User does not exist' });
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
}

function parseJson(value, fallback) {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function databaseSetProgress(userId, courseProgress, courses) {
    const courseProgressStr = courseProgress ? JSON.stringify(courseProgress) : null;
    const coursesStr = courses ? JSON.stringify(courses) : null;

    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE users
             SET course_progress   = ?,
                 courses           = ?
             WHERE id = ?`,
            [
                courseProgresStr,
                coursesStr,
                userId
            ],
            function (err) {
                if (err) {
                    reject(err);
                } else resolve(this.changes);
            }
        );
    });
}

function databaseGetProgress(userId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT course_progress,
                    courses
             FROM users
             WHERE id = ?`,
            [
                userId
            ],
            (err, user) => {
                if (err) {
                    reject(err);
                } else resolve(user);
            }
        );
    });
}
