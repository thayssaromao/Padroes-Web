document.addEventListener("DOMContentLoaded", () => {
    const appContainer = document.getElementById("app");

    if (appContainer) {
        appContainer.innerHTML = `
            <main style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                <h1>Hello World</h1>
                <p>Renderizado dinamicamente via main.js (ES Modules)!</p>
            </main>
        `;
    }
});