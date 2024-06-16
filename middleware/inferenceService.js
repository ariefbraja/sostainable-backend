const tf = require('@tensorflow/tfjs-node');

async function predictNSFWClassification(model, image) {
    try {
        const tensor = tf.node
            .decodeImage(image)
            .resizeNearestNeighbor([218, 218])
            .div(255.0)
            .expandDims()
            .slice([0, 0, 0, 0], [1, 218, 218, 3]);

        const prediction = model.predict(tensor);
        const classes = ['drug', 'gore', 'nude', 'safe'];

        const classResult = tf.argMax(prediction, 1).dataSync()[0];
        const label = classes[classResult];

        let explanation;
        if (label === 'drug') {
            explanation = "terdeteksi mengandung unsur Narkoba!";
        } else if (label === 'gore') {
            explanation = "terdeteksi mengandung unsur Kekerasan!";
        } else if (label === 'nude') {
            explanation = "terdeteksi mengandung unsur Pornografi!";
        } else {
            explanation = "Gambar sudah terverifikasi!";
        }
    
        return { label, explanation };
    } catch (err) {
        throw new Error(err.message);
    }
}

async function predictWasteClassification(model, image) {
    try {
        const tensor = tf.node
            .decodeImage(image)
            .resizeNearestNeighbor([218, 218]) // Resize to 218x218
            .div(255.0)
            .expandDims(); // Add batch dimension

        const prediction = model.predict(tensor);
        const score = await prediction.data();
        const confidenceScore = Math.max(...score) * 100;

        // TODO
        if (confidenceScore > 50) {
            result = 'kotor';
        } else {
            result = 'bersih';
        }
    
        return { result, confidenceScore };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports =  { predictNSFWClassification, predictWasteClassification };