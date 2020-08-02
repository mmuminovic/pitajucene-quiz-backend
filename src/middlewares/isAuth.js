const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization;
        // console.log(token);
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded;
        // console.log(req.userData);
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Niste prijavljeni i zato ovaj zahtev nije obrađen.",
        });
    }
}