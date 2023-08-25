/** Routes for industries of biztime. */

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

/** GET industries with company codes for industry
 *  --> {
	"industries": {
		"Technology": [
			"apple",
			"ibm"
		],
		"Retail": [
			"target",
			"ikea"
		]
	}
}
 */
router.get("/", async (req, res, next) => {
    try {
        const indResults = await db.query(`SELECT * FROM industries`);
        let industries = indResults.rows;

        const compResults = await db.query(
            `SELECT i.industry, c.code
            FROM companies_industries AS ci
            JOIN companies AS c ON ci.comp_code = c.code
            JOIN industries AS i ON ci.ind_code = i.code
             `
        );

        const companies = compResults.rows;

        const industryMap = {};
        industries.forEach((industry) => {
            if (!industryMap[industry.industry]) {
                industryMap[industry.industry] = [];
            }
            companies.forEach((company) => {
                if (company.industry === industry.industry) {
                    industryMap[industry.industry].push(company.code);
                }
            });
        });
        return res.send({ industries: industryMap });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        const results = await db.query(
            `INSERT INTO industries (code, industry)
            VALUES ( $1, $2 )
            RETURNING code, industry`,
            [code, industry]
        );
        return res.status(201).json({ industry: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.post("/:industryCode/:companyCode", async (req, res, next) => {
    try {
        const { companyCode, industryCode } = req.params;

        const compResult = await db.query(
            `SELECT code FROM companies
            WHERE code = $1`,
            [companyCode]
        );

        const indResult = await db.query(
            `SELECT code FROM industries
            WHERE code = $1`,
            [industryCode]
        );

        if (compResult.rows.length === 0 || indResult.rows.length === 0) {
            throw new ExpressError("Industry or company not found.", 404);
        }

        const assocExists = await db.query(
            `SELECT * FROM companies_industries
             WHERE comp_code = $1 AND ind_code = $2`,
            [companyCode, industryCode]
        );

        if (assocExists.rows.length > 0) {
            throw new ExpressError("Association already exists", 400);
        }

        const result = db.query(
            `INSERT INTO companies_industries (comp_code, ind_code)
            VALUES ($1, $2)`,
            [companyCode, industryCode]
        );

        return res.status(201).json({ message: "Association created." });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
