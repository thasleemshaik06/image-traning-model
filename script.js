
const imageUpload = document.getElementById("imageUpload");
const preview = document.getElementById("preview");
const result = document.getElementById("result");
const confidence = document.getElementById("confidence");
const confidenceBar = document.getElementById("confidenceBar");
const status = document.getElementById("status");
const modelURL = "./";

let model;
let currentImageURL;

function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
}

async function loadModel() {
    try {
        if (!window.tmImage) {
            throw new Error("The Teachable Machine library could not be loaded.");
        }

        model = await tmImage.load(`${modelURL}model.json`, `${modelURL}metadata.json`);
        setStatus("Model ready. Upload an image to analyze.");
    } catch (error) {
        console.error("Unable to load the coral health model:", error);
        setStatus("The model could not be loaded. Check the model files and reload the page.", true);
    }
}

function displayPrediction(prediction) {
    const healthy = prediction.className.toLowerCase().includes("healthy");
    const percent = (prediction.probability * 100).toFixed(1);

    result.textContent = healthy ? "Healthy Coral" : "Bleached Coral";
    result.classList.toggle("healthy", healthy);
    result.classList.toggle("bleached", !healthy);
    confidence.textContent = `${percent}% confidence`;
    confidenceBar.style.width = `${Math.max(0, Math.min(100, prediction.probability * 100))}%`;
    confidenceBar.classList.toggle("bleached", !healthy);
}

async function classifyImage() {
    if (!model) {
        setStatus("The model is not ready yet. Please try again shortly.", true);
        return;
    }

    setStatus("Analyzing image…");
    try {
        const predictions = await model.predict(preview);
        const bestPrediction = predictions.reduce((best, current) =>
            current.probability > best.probability ? current : best
        );
        displayPrediction(bestPrediction);
        setStatus("Analysis complete.");
    } catch (error) {
        console.error("Unable to analyze the coral image:", error);
        setStatus("The image could not be analyzed. Please try another image.", true);
    }
}

imageUpload.addEventListener("change", function () {
    const file = imageUpload.files[0];

    if (file) {
        if (currentImageURL) {
            URL.revokeObjectURL(currentImageURL);
        }
        currentImageURL = URL.createObjectURL(file);
        preview.onload = classifyImage;
        preview.onerror = function () {
            setStatus("This image could not be opened. Please choose another file.", true);
        };
        preview.src = currentImageURL;
        preview.style.display = "block";
        result.textContent = "Analyzing…";
        result.classList.remove("healthy", "bleached");
        confidence.textContent = "";
        confidenceBar.style.width = "0";
    }
});

loadModel();
