/** Routes for companies of biztime. */

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

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

        const indResults = await db.query(
            `SELECT industry FROM industries AS i
            LEFT JOIN companies_industries AS ci
            ON i.code = ci.ind_code
            LEFT JOIN companies AS c
            ON ci.comp_code = c.code
            WHERE c.code = $1`,
            [code]
        );
        const industries = indResults.rows;
        company.industries = industries.map((ind) => ind.industry);
        console.log(company.industries);
        return res.send({ company: company });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const code = slugify(name.split(" ")[0], {
            lower: true,
            strict: true,
        });
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
