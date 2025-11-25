// ===== Configuration =====
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// ===== State Management =====
let apiKey = localStorage.getItem('gemini_api_key') || '';
let currentTopic = '';

// ===== DOM Elements =====
const elements = {
    apiKeyModal: document.getElementById('apiKeyModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKey'),
    app: document.getElementById('app'),
    settingsBtn: document.getElementById('settingsBtn'),
    topicInput: document.getElementById('topicInput'),
    generateBtn: document.getElementById('generateBtn'),
    heroSection: document.getElementById('heroSection'),
    loadingSection: document.getElementById('loadingSection'),
    contentSection: document.getElementById('contentSection'),
    loadingMessage: document.getElementById('loadingMessage'),
    progressBar: document.getElementById('progressBar'),
    lessonContent: document.getElementById('lessonContent'),
    newTopicBtn: document.getElementById('newTopicBtn'),
    topicChips: document.querySelectorAll('.topic-chip')
};

// ===== Initialization =====
function init() {
    if (apiKey) {
        showApp();
    } else {
        showApiKeyModal();
    }

    attachEventListeners();
}

function showApiKeyModal() {
    elements.apiKeyModal.classList.remove('hidden');
    elements.app.classList.add('hidden');
}

function showApp() {
    elements.apiKeyModal.classList.add('hidden');
    elements.app.classList.remove('hidden');
}

// ===== Event Listeners =====
function attachEventListeners() {
    // API Key modal
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });

    // Settings button
    elements.settingsBtn.addEventListener('click', () => {
        showApiKeyModal();
        elements.apiKeyInput.value = '';
    });

    // Topic input
    elements.topicInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateLesson();
    });

    // Generate button
    elements.generateBtn.addEventListener('click', generateLesson);

    // New topic button
    elements.newTopicBtn.addEventListener('click', resetToHome);

    // Topic chips
    elements.topicChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const topic = chip.getAttribute('data-topic');
            elements.topicInput.value = topic;
            generateLesson();
        });
    });
}

// ===== API Key Management =====
function saveApiKey() {
    const key = elements.apiKeyInput.value.trim();

    if (!key) {
        alert('Por favor ingresa una API key válida');
        return;
    }

    apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    showApp();
}

// ===== Main Functions =====
async function generateLesson() {
    const topic = elements.topicInput.value.trim();

    if (!topic) {
        alert('Por favor ingresa un tema para aprender');
        return;
    }

    if (!apiKey) {
        alert('Por favor configura tu API key de Gemini primero');
        showApiKeyModal();
        return;
    }

    currentTopic = topic;
    showLoadingState();

    try {
        // Generate lesson content
        updateLoadingMessage('Generando contenido educativo...');
        const lessonData = await generateLessonContent(topic);

        // Generate images
        updateLoadingMessage('Creando imágenes ilustrativas...');
        const images = await generateLessonImages(topic, lessonData.imagePrompts);

        // Display content
        displayLesson(lessonData, images);
        showContentState();

    } catch (error) {
        console.error('Error generating lesson:', error);

        let errorMessage = error.message || 'Hubo un error al generar la lección.';

        if (errorMessage.includes('API Key inválida') || errorMessage.includes('Acceso denegado')) {
            errorMessage += '\n\n¿Necesitas ayuda?\n1. Ve a https://aistudio.google.com/app/apikey\n2. Crea una nueva API key\n3. Cópiala y pégala en la configuración (botón ⚙️)';
        }

        alert(errorMessage);
        resetToHome();
    }
}

async function generateLessonContent(topic) {
    const prompt = `Eres un tutor educativo experto. Crea una lección completa y fácil de entender sobre: "${topic}"

Estructura tu respuesta en formato JSON con la siguiente estructura:
{
    "title": "Título atractivo de la lección",
    "introduction": "Introducción breve y motivadora (2-3 oraciones)",
    "sections": [
        {
            "heading": "Título de la sección",
            "content": "Contenido explicativo detallado",
            "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"]
        }
    ],
    "examples": [
        {
            "title": "Título del ejemplo",
            "description": "Descripción del ejemplo práctico"
        }
    ],
    "summary": "Resumen final de los conceptos clave aprendidos",
    "imagePrompts": ["prompt 1 para generar imagen ilustrativa", "prompt 2 para generar imagen ilustrativa"]
}

IMPORTANTE:
- Usa lenguaje claro y simple
- Incluye analogías y ejemplos cotidianos
- Divide conceptos complejos en partes simples
- Genera 2-3 prompts para imágenes que ayuden a visualizar los conceptos
- Los prompts de imágenes deben ser en inglés y descriptivos
- Responde SOLO con el JSON, sin texto adicional`;

    try {
        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error Response:', errorData);

            if (response.status === 400) {
                throw new Error('API Key inválida o solicitud incorrecta. Por favor verifica tu API key de Gemini.');
            } else if (response.status === 403) {
                throw new Error('Acceso denegado. Verifica que tu API key de Gemini sea válida y tenga los permisos necesarios.');
            } else if (response.status === 429) {
                throw new Error('Has excedido el límite de solicitudes. Por favor espera un momento e intenta de nuevo.');
            } else {
                throw new Error(`Error de API (${response.status}): ${errorData.error?.message || 'Error desconocido'}`);
            }
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Respuesta de API inválida. Por favor intenta de nuevo.');
        }

        const textContent = data.candidates[0].content.parts[0].text;

        // Extract JSON from response (remove markdown code blocks if present)
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', textContent);
            throw new Error('No se pudo extraer el contenido de la respuesta. Por favor intenta de nuevo.');
        }

        return JSON.parse(jsonMatch[0]);

    } catch (error) {
        console.error('Error in generateLessonContent:', error);
        throw error;
    }
}

async function generateLessonImages(topic, imagePrompts) {
    const images = [];

    // Limit to 2 images to avoid too many API calls
    const prompts = imagePrompts.slice(0, 2);

    for (const prompt of prompts) {
        try {
            const imageUrl = await generateImage(prompt);
            images.push({
                url: imageUrl,
                caption: prompt
            });
        } catch (error) {
            console.error('Error generating image:', error);
            // Continue even if image generation fails
        }
    }

    return images;
}

async function generateImage(prompt) {
    try {
        // Use Picsum Photos for placeholder images (works with file:// protocol)
        // Generate a random seed based on the prompt for consistent images
        const seed = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const imageUrl = `https://picsum.photos/seed/${seed}/800/400`;

        return imageUrl;

    } catch (error) {
        console.error('Image generation error:', error);
        // Fallback to a gradient placeholder
        return `https://via.placeholder.com/800x400/667eea/764ba2?text=${encodeURIComponent('Ilustración Educativa')}`;
    }
}

function displayLesson(lessonData, images) {
    let html = `
        <div class="lesson-header">
            <h1 class="lesson-title">${lessonData.title}</h1>
            <p class="lesson-intro">${lessonData.introduction}</p>
        </div>
    `;

    // Add first image if available
    if (images.length > 0) {
        html += `
            <div class="image-container">
                <img src="${images[0].url}" alt="${images[0].caption}" loading="lazy">
                <p class="image-caption">${images[0].caption}</p>
            </div>
        `;
    }

    // Add sections
    lessonData.sections.forEach((section, index) => {
        html += `
            <div class="content-card" style="animation-delay: ${index * 0.1}s">
                <h2>${section.heading}</h2>
                <p>${section.content}</p>
        `;

        if (section.keyPoints && section.keyPoints.length > 0) {
            html += `
                <div class="highlight-box">
                    <h3>💡 Puntos Clave:</h3>
                    <ul>
                        ${section.keyPoints.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        html += `</div>`;
    });

    // Add second image if available
    if (images.length > 1) {
        html += `
            <div class="image-container">
                <img src="${images[1].url}" alt="${images[1].caption}" loading="lazy">
                <p class="image-caption">${images[1].caption}</p>
            </div>
        `;
    }

    // Add examples
    if (lessonData.examples && lessonData.examples.length > 0) {
        html += `
            <div class="content-card">
                <h2>📚 Ejemplos Prácticos</h2>
        `;

        lessonData.examples.forEach(example => {
            html += `
                <div style="margin-bottom: 1.5rem;">
                    <h3>${example.title}</h3>
                    <p>${example.description}</p>
                </div>
            `;
        });

        html += `</div>`;
    }

    // Add summary
    html += `
        <div class="content-card" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);">
            <h2>✨ Resumen</h2>
            <p>${lessonData.summary}</p>
        </div>
    `;

    elements.lessonContent.innerHTML = html;
}

// ===== UI State Management =====
function showLoadingState() {
    elements.heroSection.classList.add('hidden');
    elements.contentSection.classList.add('hidden');
    elements.loadingSection.classList.remove('hidden');
    elements.generateBtn.disabled = true;
}

function showContentState() {
    elements.heroSection.classList.add('hidden');
    elements.loadingSection.classList.add('hidden');
    elements.contentSection.classList.remove('hidden');
    elements.generateBtn.disabled = false;

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetToHome() {
    elements.contentSection.classList.add('hidden');
    elements.loadingSection.classList.add('hidden');
    elements.heroSection.classList.remove('hidden');
    elements.topicInput.value = '';
    elements.generateBtn.disabled = false;
    currentTopic = '';

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateLoadingMessage(message) {
    elements.loadingMessage.textContent = message;
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', init);
