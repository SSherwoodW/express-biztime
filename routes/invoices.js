const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({ invoices: results.rows });
    } catch (err) {
        return next(err);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        let id = req.params.id;
        let results = await db.query(`SELECT * FROM invoices WHERE id=$1`, [
            id,
        ]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Could not find invoice with id ${id}`, 404);
        } else {
            return res.send({ invoice: results.rows[0] });
        }
    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        let { comp_code, amt } = req.body;
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );
        return res.json({ invoice: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put("/:id", async (req, res, next) => {
    try {
        let id = req.params.id;
        let { amt } = req.body;
        const results = await db.query(
            `UPDATE invoices SET amt=$1
             WHERE id = $2
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, id]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update invoice ${id}`, 404);
        } else {
            return res.json({ invoice: results.rows[0] });
        }
    } catch (err) {
        return next(err);
    }
});

router.delete("/:id", async (req, res, next) => {
    try {
        let id = req.params.id;
        const result = await db.query(
            `DELETE FROM invoices
             WHERE id=$1
             RETURNING id`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`Couldn't locate invoice with id ${id}`);
        } else {
            return res.json({ status: "deleted" });
        }
    } catch (err) {}
});

module.exports = router;
