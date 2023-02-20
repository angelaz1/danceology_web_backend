const models = require('../models');

exports.get = function (req, res) {
    models.Level.findAll({
        order: [['id', 'ASC']]
    }).then(levels => {
        res.json({ levels: levels });
        res.status(200);
    });
}

exports.getLevel = function (req, res) {
    let id = req.params.id;

    models.Level.findByPk(id).then(level => {
        if (level == null) {
            res.json({ message: "Level does not exist" });
            res.status(404);
            return;
        }

        res.json({ levelData: level });
        res.status(200);
    });
}

exports.editLevel = function (req, res) {
    let id = req.params.id;

    var name = req.body.name;
    var description = req.body.description;

    models.Level.findByPk(id).then(level => {
        if (level == null) {
            res.json({ message: "Level does not exist" });
            res.status(404);
            return;
        }

        level.name = name;
        level.description = description;
        
        level.save().then(() => {
            res.json({ levelData: level });
            res.status(200);
        });
    });
}

exports.deleteLevel = function (req, res) {
    let id = req.params.id;

    models.Level.findByPk(id).then(level => {
        if (level == null) {
            res.json({ message: "Level does not exist" });
            res.status(404);
            return;
        }

        level.destroy().then(() => {
            res.json({ levelData: level });
            res.status(200);
        });
    });
}
