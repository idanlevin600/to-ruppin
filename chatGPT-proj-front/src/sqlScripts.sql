-- creating a table for the responses from GPT

CREATE TABLE gpt_responses (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    questionId INTEGER NOT NULL,
    fullMessage TEXT NOT NULL,
    answer1 TEXT NOT NULL,
    ratingAnswer1 INTEGER NOT NULL,
    explanationForRating1 TEXT NOT NULL,
    answer2 TEXT NOT NULL,
    ratingAnswer2 INTEGER NOT NULL,
    explanationForRating2 TEXT NOT NULL,
    answer3 TEXT NOT NULL,
    ratingAnswer3 INTEGER NOT NULL,
    explanationForRating3 TEXT NOT NULL
);

--for ssms

CREATE TABLE [dbo].[gpt_responses](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[model] [text] NOT NULL,
	[questionId] [int] NOT NULL,
	[fullMessage] [text] NOT NULL,
	[answer1Id] [int] NOT NULL,
	[answer1] [text] NOT NULL,
	[ratingAnswer1] [int] NOT NULL,
	[explanationForRating1] [text] NOT NULL,
	[answer2Id] [int] NOT NULL,
	[answer2] [text] NOT NULL,
	[ratingAnswer2] [int] NOT NULL,
	[explanationForRating2] [text] NOT NULL,
	[answer3Id] [int] NOT NULL,
	[answer3] [text] NOT NULL,
	[ratingAnswer3] [int] NOT NULL,
	[explanationForRating3] [text] NOT NULL,
	[result] [text] NOT NULL,
	[tags] [text] NOT NULL,
	[questionCreationDate] [datetime] NOT NULL
) 