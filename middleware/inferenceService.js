const tf = require('@tensorflow/tfjs-node');

async function predictNSFWClassification(model, image) {
    try {
        const tensor = tf.node
            .decodeImage(image)
            .resizeNearestNeighbor([218, 218])
            .div(255.0)
            .expandDims()
            .toFloat();

        const prediction = model.predict(tensor);
        const classes = ['drug', 'gore', 'nude', 'safe'];

        const classResult = tf.argMax(prediction, 1).dataSync()[0];
        const label = classes[classResult];

        let explanation;
        if (label === 'drug') {
            explanation = "Gambar mengandung unsur Narkoba!";
        } else if (label === 'gore') {
            explanation = "Gambar mengandung unsur Kekerasan!";
        } else if (label === 'safe') {
            explanation = "Gambar mengandung unsur Pornografi!";
        } else {
            explanation = "Gambar sudah terverifikasi!";
        }
    
        return { label, explanation };
    } catch (error) {
        console.error(err.message);
        return res.status(500).json({status: 500, message: err.message});
    }
}

module.exports = predictNSFWClassification;