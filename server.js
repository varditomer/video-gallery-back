require('dotenv').config(); // Load .env variables

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000; // Use .env or default to 3000

app.listen(PORT, (error) => {
    if (!error)
        console.log(`Server is running and listening on port ${PORT}`);
    else
        console.log("Error occurred, server can't start", error);
});
