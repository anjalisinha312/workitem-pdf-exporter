const SDK = require("azure-devops-extension-sdk");

// Settings storage using Azure DevOps extension data service
async function getSettings() {
    try {
        const dataService = await SDK.getService("ms.vss-features.extension-data-service");
        const dataManager = await dataService.getExtensionDataManager(
            SDK.getExtensionContext().id,
            await SDK.getAccessToken()
        );
        
        const settings = await dataManager.getValue("exportSettings", { scopeType: "User" });
        return settings || getDefaultSettings();
    } catch (error) {
        console.warn("Could not load settings:", error);
        return getDefaultSettings();
    }
}

async function saveSettings(settings) {
    try {
        const dataService = await SDK.getService("ms.vss-features.extension-data-service");
        const dataManager = await dataService.getExtensionDataManager(
            SDK.getExtensionContext().id,
            await SDK.getAccessToken()
        );
        
        await dataManager.setValue("exportSettings", settings, { scopeType: "User" });
        return true;
    } catch (error) {
        console.error("Could not save settings:", error);
        return false;
    }
}

function getDefaultSettings() {
    return {
        companyName: "",
        companyLogo: null, // Base64 encoded image
        primaryColor: "#0078d4",
        includeDescription: true,
        includeComments: true,
        includeHistory: true,
        includeAttachments: true,
        includeLinks: true,
        defaultFormat: "pdf" // pdf, word, excel
    };
}

module.exports = { getSettings, saveSettings, getDefaultSettings };