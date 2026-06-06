require('dotenv').config();
const db = require('../db');
const { GoogleGenAI, Type } = require('@google/genai');
const completeCourseList = require('../../src/Services/course-details-page/complete_course_list.json');

const { GEMINI_API_KEY } = process.env;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const courseListJson = JSON.stringify(completeCourseList);

exports.getRecommendations = async (req, res, next) => {
    const { userInterests } = req.body;
    const userId = Number.parseInt(req.body.userId, 10);

    try {
        const user = await databaseGetCourses(userId);
        if (!user) return res.status(404).json({ success: false, error: 'Could not find courses for user' });

        const courses = parseJson(user.courses, []);
        const prompt = getPrompt(courses, userInterests);
        const response = await queryLLM(prompt);

        res.status(200).json({ response, success: true });
    } catch (err) {
        next(err);
    }
};

function getPrompt(courses, userInterests) {
    return "Given the following courses taken, interests, and course description list, construct a list of 4-6 recommended courses for this student, along with a short reasoning. Make sure to check course prerequisites, if mentioned.\n" +
    `Courses taken: ${courses.join(', ')}\n` +
    `Interests: ${userInterests || 'None provided'}\n` +
    "Course descriptions: ATTACHED BELOW\n" +
    "IMPORTANT NOTE: Responses are timed, so limit prose and stick to only the absolutely crucial analysis.\n\n" +
    "COMPLETE COURSE LIST: \n" +
    courseListJson;
}

async function queryLLM(prompt) {
    const config = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommended_courses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  course_name: {
                    type: Type.STRING,
                  },
                  reasoning: {
                    type: Type.STRING,
                  },
                },
              },
            },
          },
        },
      };

    const model = 'gemini-2.5-flash-preview-04-17';
    const response = await ai.models.generateContent({ model, config, contents: prompt });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function databaseGetCourses(userId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT courses
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

function parseJson(value, fallback) {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}
