/** Routes for companies of biztime. */

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
    try {
        console.log("This is / route");
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: results.rows });
    } catch (err) {
        return next(err);
    }
});

router.get("/:code", async (req, res, next) => {
    try {
        let code = req.params.code;
        console.log(code);
        const compResult = await db.query(
            `SELECT code, name, description
           FROM companies
           WHERE code = $1`,
            [code]
        );

        const invResults = await db.query(
            `SELECT id FROM invoices WHERE comp_code=$1`,
            [code]
        );
        if (compResult.rows.length === 0) {
            throw new ExpressError(
                `Can't find company with code of ${code}`,
                404
            );
        }
        const company = compResult.rows[0];
        const invoices = invResults.rows;

        company.invoices = invoices.map((inv) => inv.id);
        return res.send({ company: company });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        console.log(req.body);
        const results = await db.query(
            "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
            [code, name, description]
        );
        return res.status(201).json({ company: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put("/:code", async (req, res, next) => {
    try {
        let code = req.params.code;
        let { name, description } = req.body;
        const results = await db.query(
            "UPDATE companies SET name=$1, description=$2 WHERE code = $3 RETURNING code, name, description",
            [name, description, code]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update company ${code}`, 404);
        } else {
            return res.json({ company: results.rows[0] });
        }
    } catch (err) {
        return next(err);
    }
});

router.delete("/:code", async (req, res, next) => {
    try {
        let code = req.params.code;
        const results = await db.query(
            `DELETE FROM companies 
             WHERE code=$1
             RETURNING code`,
            [code]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404);
        } else {
            return res.send({ status: "deleted" });
        }
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
