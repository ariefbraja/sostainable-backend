const tf = require('@tensorflow/tfjs-node');

async function loadModelNSFW() {
    return tf.loadGraphModel(process.env.NSFW_MODEL);
}

async function loadModelWaste() {
    return tf.loadGraphModel(process.env.WASTE_MODEL);
}

module.exports = { loadModelNSFW, loadModelWaste };