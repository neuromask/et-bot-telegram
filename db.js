// MySQL
const mysql = require('mysql');
require('dotenv').config();
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

module.exports = {
    query: (sql, params) => {
        return new Promise((resolve, reject) => {
            connection.getConnection(function(cError, c) {
                if (cError) {
                    if (c) c.release();
                    console.error("%s ", JSON.stringify(cError));
                    return reject(cError);
                }

                c.query(sql, params || [], (error, result) => {
                    if (error) {
                        if (c) c.release();
                        console.error("%s ", JSON.stringify(error));
                        return reject(error);
                    }

                    if (c) c.release();
                    return resolve(result);
                });
            });
        });
    }
};
