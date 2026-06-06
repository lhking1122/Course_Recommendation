const db = require('../db');

exports.getDetails = (req, res, next) => {
  db.all(
    `SELECT * FROM courses`,
    (err, courses) => {
      if (err) return next(err);
      res.json(courses);
  }
  )
};

exports.getAvg = (req, res, next) => {
  const courseId = req.params.courseId;
  db.get(
    `SELECT AVG(r.rating) AS avg
     FROM courses c
     JOIN reviews r ON c.id = r.course_id
     WHERE c.id = ?`,
    [courseId],
    (err, rating) => {
      if (err) return next(err);
      res.json(rating);
  }
  )
}
    
