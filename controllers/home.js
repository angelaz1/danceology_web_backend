const poseDetection = require('@tensorflow-models/pose-detection');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-wasm');

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

const models = require('../models');

let detector;

const model = poseDetection.SupportedModels.BlazePose;
const detectorConfig = {
    runtime: 'tfjs',
    enableSmoothing: true,
    modelType: 'full'
};

exports.get = function (req, res) {
    res.json({ message: "Hello from Express!" });
    res.status(200);
}

const { Image, createCanvas } = require('canvas');
const canvas = createCanvas(1080, 1920); // TODO: input width and height
const ctx = canvas.getContext('2d');

async function loadLocalImage (filePath) {
    try {
        var img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.onerror = err => { throw err };
        img.src = filePath;
        let image = tf.tidy(() => tf.browser.fromPixels(canvas));
        fs.unlink(filePath, () => {});
        return image;
    } catch (err) {
        console.log(err);
    }
}

async function performEstimation (filePath, estimationConfig, timestamp) {
    let image = await loadLocalImage(filePath);
    let poseData = await detector.estimatePoses(image, estimationConfig, timestamp);
    image.dispose();
    return poseData;
}

exports.post = async function(req, res) {
    await tf.setBackend('wasm');

    if (!detector) {
        detector = await poseDetection.createDetector(model, detectorConfig);
    }

    const estimationConfig = {flipHorizontal: true};
    const timestamp = performance.now();
    
    let levelName = req.file.originalname.replace(/\.[^/.]+$/, "");
    let screenshotPath = `public/${levelName}`;

    if (!fs.existsSync(screenshotPath)) {
        fs.mkdirSync(screenshotPath);
    }

    let command = child_process.spawn(`${ffmpegInstaller.path}`,
        `-i ${req.file.path.replace(/\\/g, "/")} \"${screenshotPath}/%04d.png\"`.split(" "),
        { shell: true })

    command.on('exit', async () => {
        console.log("done reading video");
        let files = fs.readdirSync(screenshotPath);

        let estimatedPoses = [];
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let filePath = path.join(screenshotPath, file);
            let poseData = await performEstimation(filePath, estimationConfig, timestamp);
            estimatedPoses.push(poseData);

            let p = (i * 100) / files.length;
            console.log(`% Current Progress = ${p.toFixed(2)}`);
        }

        console.log("done!");
        models.Level.findOrCreate({
            where: {
                name: levelName
            },
            defaults: {
                name: levelName,
                description: levelName,
            }
        }).then(([level]) => {
            level.poseData = JSON.stringify(estimatedPoses);
            return level.save();
        }).then((level) => {
            console.log("saved level!");
            res.json(level);
            res.status(200);
        }).catch((err) => {
            console.error(err);
            res.json(err);
            res.status(500);
        });
    });
}
