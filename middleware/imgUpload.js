const {Storage} = require('@google-cloud/storage')
const fs = require('fs')
const path = require('path');

const pathKey = path.resolve('./serviceaccountkey.json')

// TODO: Sesuaikan konfigurasi Storage
const gcs = new Storage({
    projectId: 'capstone-project-424713',
    keyFilename: pathKey
})

// TODO: Tambahkan nama bucket yang digunakan
const bucketName = 'sostainable'
const bucket = gcs.bucket(bucketName)

function getPublicUrl(filename) {
    return 'https://storage.googleapis.com/' + bucketName + '/' + filename;
}

let ImgUpload = {}

ImgUpload.uploadToGcs = (id_event) => {
    return (req, res, next) => {
        if (!req.files || req.files.length === 0) return next();

        const folderPath = `images/${id_event}`;

        // Array to store promises for each file upload
        const uploadPromises = [];

        req.files.forEach((file, index) => {
            const gcsname = `${folderPath}/event-${index}`;
            const fileUpload = bucket.file(gcsname);

            // Create a promise for each file upload
            const uploadPromise = new Promise((resolve, reject) => {
                const stream = fileUpload.createWriteStream({
                    metadata: {
                        contentType: file.mimetype
                    }
                });

                stream.on('error', (err) => {
                    file.cloudStorageError = err;
                    reject(err);
                });

                stream.on('finish', () => {
                    file.cloudStorageObject = gcsname;
                    file.cloudStoragePublicUrl = getPublicUrl(gcsname);
                    resolve();
                });

                stream.end(file.buffer);
            });

            uploadPromises.push(uploadPromise);
        });

        // Wait for all file uploads to complete before proceeding
        Promise.all(uploadPromises)
            .then(() => {
                next();
            })
            .catch((err) => {
                next(err);
            });
    };
};

ImgUpload.uploadToGcsDocumentation = (id_event) => {
    return (req, res, next) => {
        if (!req.files || req.files.length === 0) return next();

        const folderPath = `images/${id_event}`;

        // Array to store promises for each file upload
        const uploadPromises = [];

        req.files.forEach((file, index) => {
            const gcsname = `${folderPath}/documentation-${index}`;
            const fileUpload = bucket.file(gcsname);

            // Create a promise for each file upload
            const uploadPromise = new Promise((resolve, reject) => {
                const stream = fileUpload.createWriteStream({
                    metadata: {
                        contentType: file.mimetype
                    }
                });

                stream.on('error', (err) => {
                    file.cloudStorageError = err;
                    reject(err);
                });

                stream.on('finish', () => {
                    file.cloudStorageObject = gcsname;
                    file.cloudStoragePublicUrl = getPublicUrl(gcsname);
                    resolve();
                });

                stream.end(file.buffer);
            });

            uploadPromises.push(uploadPromise);
        });

        // Wait for all file uploads to complete before proceeding
        Promise.all(uploadPromises)
            .then(() => {
                next();
            })
            .catch((err) => {
                next(err);
            });
    };
};

ImgUpload.uploadToGcsSingle = (username) => {
    return (req, res, next) => {
        if (!req.file) return next();

        const gcsname = `images/${username}/profile`;
        const file = bucket.file(gcsname);

        // Check if the file exists and delete it if it does
        file.exists()
            .then(data => {
                const exists = data[0];
                if (exists) {
                    return file.delete();
                }
            })
            .then(() => {
                const stream = file.createWriteStream({
                    metadata: {
                        contentType: req.file.mimetype
                    }
                });

                stream.on('error', (err) => {
                    req.file.cloudStorageError = err;
                    next(err);
                });

                stream.on('finish', () => {
                    req.file.cloudStorageObject = gcsname;
                    req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
                    next();
                });

                stream.end(req.file.buffer);
            })
            .catch(err => {
                req.file.cloudStorageError = err;
                next(err);
            });
    };
};

module.exports = ImgUpload