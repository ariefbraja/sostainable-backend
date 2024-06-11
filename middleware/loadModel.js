const tf = require('@tensorflow/tfjs-node');

async function loadModel() {
    return tf.loadGraphModel(process.env.NSFW_MODEL);
}

module.exports = loadModel;