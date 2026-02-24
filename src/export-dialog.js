const SDK = require("azure-devops-extension-sdk");
const { getClient } = require("azure-devops-extension-api");
const { WorkItemTrackingRestClient } = require("azure-devops-extension-api/WorkItemTracking");
const { generateWorkItemPDF } = require("./exporters/pdf-generator");

let workItemId = null;
let workItemData = null;

SDK.init();

SDK.ready().then(async () => {
    console.log("Export dialog initialized");
    
    try {
        // Get work item ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        workItemId = urlParams.get('workItemId');
        
        console.log("Work Item ID from URL:", workItemId);
        
        if (!workItemId) {
            // Try getting from configuration as fallback
            const config = SDK.getConfiguration();
            console.log("Dialog config:", config);
            workItemId = config.workItemId || 
                         (config.configuration && config.configuration.workItemId);
        }
        
        console.log("Final Work Item ID:", workItemId);
        
        if (!workItemId) {
            throw new Error("Work item ID not found");
        }
        
        // Load work item data
        await loadWorkItemData();
        
        // Setup event listeners
        document.getElementById('exportBtn').addEventListener('click', handleExport);
        document.getElementById('cancelBtn').addEventListener('click', handleCancel);
        
        SDK.notifyLoadSucceeded();
        
    } catch (error) {
        console.error("Error initializing dialog:", error);
        showStatus('error', 'Failed to initialize: ' + error.message);
    }
});

async function loadWorkItemData() {
    try {
        console.log("Loading work item:", workItemId);
        
        const client = getClient(WorkItemTrackingRestClient);
        
        // Get work item - make sure ID is a number
        const id = parseInt(workItemId, 10);
        console.log("Parsed work item ID:", id);
        
        workItemData = await client.getWorkItem(
            id,         // work item ID as number
            undefined,  // project
            undefined,  // fields
            undefined,  // asOf
            "All"       // expand
        );
        
        console.log("Work item loaded successfully:", workItemData);
        
        const workItemType = workItemData.fields["System.WorkItemType"];
        const workItemTitle = workItemData.fields["System.Title"];
        
        document.getElementById('workItemInfo').innerHTML = 
            `${workItemType} #${workItemData.id}: ${workItemTitle}`;
        
    } catch (error) {
        console.error("Error loading work item:", error);
        console.error("Error details:", {
            workItemId: workItemId,
            parsedId: parseInt(workItemId, 10),
            error: error.message
        });
        showStatus('error', 'Failed to load work item: ' + error.message);
        throw error;
    }
}

async function handleExport() {
    const exportBtn = document.getElementById('exportBtn');
    
    try {
        exportBtn.disabled = true;
        showStatus('loading', '📄 Generating PDF...');
        
        // Get selected options
        const options = {
            includeDescription: document.getElementById('includeDescription').checked,
            includeComments: document.getElementById('includeComments').checked,
            includeHistory: document.getElementById('includeHistory').checked,
            includeAttachments: document.getElementById('includeAttachments').checked,
            includeLinks: document.getElementById('includeLinks').checked,
            includeAcceptanceCriteria: document.getElementById('includeAcceptanceCriteria').checked
        };
        
        console.log("Export options:", options);
        
        const client = getClient(WorkItemTrackingRestClient);
        const id = parseInt(workItemId, 10);
        
        // Load additional data based on options
        if (options.includeComments) {
            try {
                options.comments = await client.getComments(id);
                console.log("Comments loaded:", options.comments?.comments?.length || 0);
            } catch (err) {
                console.warn("Could not load comments:", err);
            }
        }
        
        if (options.includeHistory) {
            try {
                options.updates = await client.getUpdates(id);
                console.log("Updates loaded:", options.updates?.length || 0);
            } catch (err) {
                console.warn("Could not load history:", err);
            }
        }
        
        // Generate filename
        const workItemType = workItemData.fields["System.WorkItemType"];
        const fileName = `WorkItem_${workItemId}_${workItemType}.pdf`;
        options.fileName = fileName;
        
        console.log("Generating PDF with filename:", fileName);
        
        // Generate PDF
        await generateWorkItemPDF(workItemData, options);
        
        console.log("PDF generated successfully");
        showStatus('success', '✓ PDF generated and downloaded successfully!');
        
        // Close panel after 1.5 seconds
        setTimeout(() => {
            window.close();
        }, 1500);
        
    } catch (error) {
        console.error("Error exporting:", error);
        showStatus('error', '✗ Export failed: ' + error.message);
        exportBtn.disabled = false;
    }
}

function handleCancel() {
    window.close();
}

function showStatus(type, message) {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status-${type}`;
    statusDiv.innerHTML = message;
    statusDiv.style.display = 'block';
}