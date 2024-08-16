import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import sql from "mssql";
import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Use environment variables for sensitive data
});

const config = {
    user: process.env.USER,
    password: process.env.PASSWORD,
    server: process.env.SERVER,
    database: process.env.DATABASE,
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        enableArithAbort: true,
        trustServerCertificate: true // Add this line to trust self-signed certificates
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.log('Database Connection Failed! Bad Config: ', err);
        throw err; // Re-throw to stop the server start process
    });

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello, this is the root of the ChatGPT server.");
});

app.get("/test-db-connection", async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request().query("SELECT 1");
        res.json({ success: true, message: "Database connection successful" });
    } catch (error) {
        console.error("Database connection test failed:", error);
        res.status(500).json({ success: false, message: "Database connection failed", error: error.message });
    }
});

app.post("/", async (req, res) => {
    const { message } = req.body;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: `${message}` }],
            model: "gpt-3.5-turbo",
        });

        res.json({
            completion: completion.choices[0]
        });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Failed to process request" });
    }
});

app.post("/compare", async (req, res) => {
    const { message, model } = req.body;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ 
                role: "system", 
                content: `I have this question: ${message.QuestionTitle}, ${message.QuestionText}. 
                        And I have these three answers from Stack Overflow:
                        1. answer number 1 - ${message.AnswerContent_3},
                        2. answer number 2 - ${message.AnswerContent_2},
                        3. answer number 3 - ${message.AnswerContent_1}.      
                        
                        Read the question carefully, and then the answers that i have provided you and proceed.
                        Tell me which of these three answers best answers the question I provided and explain why. 
                        Also, rate each answer on a scale of 1-10 with a brief explanation for each rating. Ensure that the answer does address the question and not just based on the level of extraction.
                        
                        Respond ONLY in JSON format as follows (do not nest any fields):
                        
                        {
                            "questionId": "${message.QuestionId}",
                            "question": "${message.QuestionTitle}, ${message.QuestionText}",
                            "questionCreationDate": "${message.QuestionCreationDate}",
                            "model": "${model}",
                            "tags": "${message.Tags}",
                            "answer1Id": "${message.AnswerId_3}",
                            "answer1": "${message.AnswerContent_3}",
                            "answer2Id": "${message.AnswerId_2}",
                            "answer2": "${message.AnswerContent_2}",
                            "answer3Id": "${message.AnswerId_1}",
                            "answer3": "${message.AnswerContent_1}",                                                                                         
                            "better_question": "{answer}",
                            "why_better": "{explanation}",
                            "rating_Answer1": "{rating}",
                            "explanation_for_rating1": "{explanation}",
                            "rating_Answer2": "{rating}",
                            "explanation_for_rating2": "{explanation}",
                            "rating_Answer3": "{rating}",
                            "explanation_for_rating3": "{explanation}"                                                               
                        }`
            }],
            model: model, // Use the specified model here
        });

        const rawContent = completion.choices[0].message.content;
            
        if (!isValidJson(rawContent)) {
            throw new SyntaxError("Incomplete JSON response");
        }

        const response = JSON.parse(rawContent);

        const { rating_Answer1, rating_Answer2, rating_Answer3 } = response;

        // Cast to numbers
        const rating1 = parseFloat(rating_Answer1);
        const rating2 = parseFloat(rating_Answer2);
        const rating3 = parseFloat(rating_Answer3);

        if (rating1 >= rating2 && rating2 >= rating3) {
            response.result = "A+";
        } else if (rating1 >= rating3 && rating3 >= rating2) {
            response.result = "A";
        } else if (rating2 >= rating1 && rating1 >= rating3) {
            response.result = "B";
        } else if (rating2 >= rating3 && rating3 >= rating1) {
            response.result = "F"; // This condition covers the scenario where rating2 > rating3 > rating1
        } else if (rating3 >= rating1 && rating1 >= rating2) {
            response.result = "D";
        } else if (rating3 >= rating2 && rating2 >= rating1) {
            response.result = "F";
        }

        

        if (isValidResponseStructure(response)) {
            const exists = await responseExists(response.questionId, response.model);
            if (!exists) {
                await insertPrompt(response);
                res.json({ completion: response });
            } else {
                res.status(409).json({ error: "Response already exists in the database" });
            }
        } else {
            throw new Error("Invalid response structure");
        }
    } catch (error) {
        console.error("Failed to process request:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to process request" });
        }
    }
});

app.post("/check-response", async (req, res) => {
    const { questionId, model } = req.body;
    try {
        const exists = await responseExists(questionId, model);
        res.json({ exists });
    } catch (error) {
        console.error("Error checking if response exists:", error);
        res.status(500).json({ error: "Failed to check if response exists" });
    }
});

app.get("/api/results", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM gpt_responses");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch data", details: error.message });
    }
});

// endpoint to delete a record with a specific questionId
app.delete("/api/delete/:questionId", async (req, res) => {
    const { questionId } = req.params;
    
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('questionId', sql.NVarChar, questionId)
            .query(`DELETE FROM gpt_responses WHERE questionId = @questionId`);
        
        if (result.rowsAffected[0] > 0) {
            res.json({ success: true, message: `Record with questionId ${questionId} deleted successfully` });
        } else {
            res.status(404).json({ success: false, message: `No record found with questionId ${questionId}` });
        }
    } catch (error) {
        console.error("Error deleting data:", error);
        res.status(500).json({ error: "Failed to delete record" });
    }
});


const isValidJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
};

const isValidResponseStructure = (response) => {
    const requiredKeys = [
        "questionId", "questionCreationDate", "model", "question", "answer1Id", "answer1", "answer2Id", "answer2", "answer3Id", 
        "answer3", "better_question", "why_better", "rating_Answer1", "explanation_for_rating1",
        "rating_Answer2", "explanation_for_rating2", "rating_Answer3", "explanation_for_rating3", "tags"
    ];
    return requiredKeys.every(key => key in response);
};

async function responseExists(questionId, model) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('questionId', sql.NVarChar, questionId)
            .input('model', sql.NVarChar, model)
            .query(`
                SELECT 1
                FROM gpt_responses
                WHERE questionId = @questionId AND CAST(model AS NVARCHAR(MAX)) = @model;
            `);
        return result.recordset.length > 0;
    } catch (error) {
        console.error("Error checking if response exists:", error);
        return false;
    }
}

const formatDateForSQL = (dateString) => {
    const [day, month, yearTime] = dateString.split('/');
    const [year, time] = yearTime.split(' ');
    return `${year}-${month}-${day} ${time}`;
};

const formatTagsForSQL = (tagsArray) => {
    if (Array.isArray(tagsArray)) {
        return tagsArray.map(tag => `<${tag}>`).join('');
    }
    return tagsArray;
};

async function insertPrompt(data) {
    try {
        console.log("data for sending", data);

        // Correct the date format
        const formattedDate = formatDateForSQL(data.questionCreationDate);
        // Format the tags
        const formattedTags = formatTagsForSQL(data.tags);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('questionId', sql.NVarChar, data.questionId)
            .input('questionCreationDate', sql.DateTime, new Date(formattedDate))
            .input('model', sql.NVarChar, data.model)
            .input('fullMessage', sql.NVarChar, data.question)
            .input('answer1Id', sql.NVarChar, data.answer1Id)
            .input('answer1', sql.NVarChar, data.answer1)
            .input('ratingAnswer1', sql.Int, data.rating_Answer1)
            .input('explanationForRating1', sql.NVarChar, data.explanation_for_rating1)
            .input('answer2Id', sql.NVarChar, data.answer2Id)
            .input('answer2', sql.NVarChar, data.answer2)
            .input('ratingAnswer2', sql.Int, data.rating_Answer2)
            .input('explanationForRating2', sql.NVarChar, data.explanation_for_rating2)
            .input('answer3Id', sql.NVarChar, data.answer3Id)
            .input('answer3', sql.NVarChar, data.answer3)
            .input('ratingAnswer3', sql.Int, data.rating_Answer3)
            .input('explanationForRating3', sql.NVarChar, data.explanation_for_rating3)
            .input('result', sql.NVarChar, data.result)
            .input('tags', sql.NVarChar, formattedTags)
            .query(`
                INSERT INTO gpt_responses (
                    questionId, questionCreationDate, model, fullMessage, answer1Id, answer1, ratingAnswer1, explanationForRating1,
                    answer2Id, answer2, ratingAnswer2, explanationForRating2, answer3Id, answer3, ratingAnswer3, explanationForRating3, result, tags
                ) VALUES (@questionId, @questionCreationDate, @model, @fullMessage, @answer1Id, @answer1, @ratingAnswer1, @explanationForRating1,
                          @answer2Id, @answer2, @ratingAnswer2, @explanationForRating2, @answer3Id, @answer3, @ratingAnswer3, @explanationForRating3, @result, @tags)
            `);
        console.log(result);
        return result;
    } catch (error) {
        console.error("Error inserting data:", error);
    }
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
