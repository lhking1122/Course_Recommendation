const db = require('../db');

exports.getReviews = (req, res, next) => {
  const courseId = req.params.courseID;
  db.all(
    `SELECT r.id,
            r.title,
            r.rating,
            r.professor,
            r.mand_attendance,
            r.grade,
            r.desc
     FROM reviews r
     JOIN courses c ON c.id = r.course_id
     WHERE c.id = ?`,
    [courseId],
    (err, reviews) => {
      if (err) return next(err);
      res.json(reviews);
  }
  )
};

exports.createReview = (req, res, next) => {
  const review = req.body;
  db.run(
    `INSERT INTO reviews (title, rating, professor, mand_attendance, grade, desc, user_id, course_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [review.title, review.rating, review.professor, review.attendance, review.grade, review.desc, review.user_id, review.course_id],
    function (err) {
      if (err) return next(err);
      res.status(201).json({ success: true, id: this.lastID });
    }
  )
};

exports.deleteReview = (req, res, next) => {
  const { reviewId } = req.params;
  db.run(
    `DELETE FROM reviews WHERE id = ?`,
    [reviewId],
    function (err) {
      if (err) return next(err);
      if (this.changes === 0) return res.status(404).json({ error: 'Review not found' });
      res.json({ success: true, id: reviewId });
    }
  );
};
