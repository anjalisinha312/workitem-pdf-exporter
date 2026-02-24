# Privacy Policy - Work Item Exporter

**Last Updated:** February 2026

## Overview

Work Item Exporter ("the Extension") is committed to protecting your privacy. This privacy policy explains how the Extension handles data when you use it to export work items from Azure DevOps.

## Data Collection

### What Data We DO NOT Collect

The Extension does NOT collect, transmit, store, or share any of your data:

- ❌ **No work item data** - Your work items never leave your browser
- ❌ **No personal information** - We don't collect names, emails, or user IDs
- ❌ **No usage analytics** - We don't track how you use the extension
- ❌ **No telemetry** - We don't send any data to our servers
- ❌ **No cookies** - We don't set any cookies or tracking mechanisms
- ❌ **No third-party services** - We don't use any external analytics or tracking services

### How the Extension Works

The Extension operates entirely within your web browser:

1. **Data Access**: When you click "Export to PDF", the Extension uses the official Azure DevOps REST API to fetch work item data
2. **Processing**: All data processing happens locally in your browser using JavaScript
3. **PDF Generation**: PDFs are generated client-side using the jsPDF library
4. **Download**: The PDF is downloaded directly to your device
5. **No Transmission**: No data is ever sent to external servers or third parties

## Data Access Permissions

The Extension requires the following Azure DevOps permissions:

### `vso.work` (Read)
- **Purpose**: Read work item data, fields, comments, and history
- **Scope**: Only work items you have permission to view
- **Usage**: To fetch work item details for PDF generation

### `vso.work_write` (Write)
- **Purpose**: Read comments and change history
- **Scope**: Only work items you have permission to access
- **Usage**: To include comments and history in exported PDFs
- **Note**: Despite the "write" name, the Extension only reads data and never modifies work items

## Your Data Rights

Since the Extension doesn't collect or store any data:

- ✅ **You control your data** - All data remains in your Azure DevOps organization
- ✅ **No data retention** - Nothing is stored by the Extension
- ✅ **No data deletion needed** - There's nothing to delete
- ✅ **Complete transparency** - The Extension is open source (view the code on GitHub)

## Security

### Client-Side Processing

All operations occur within your browser:
- Work items are fetched using your authenticated Azure DevOps session
- PDF generation happens locally using JavaScript libraries
- No data is transmitted outside your browser except to Azure DevOps APIs (which you're already authenticated with)

### Access Control

The Extension:
- Only accesses work items you have permission to view
- Respects your organization's security policies
- Cannot bypass Azure DevOps permissions
- Cannot access work items from projects you don't have access to

### Open Source

The Extension's source code is publicly available on GitHub:
- You can review exactly what the Extension does
- Security researchers can audit the code
- Community contributions are welcome
- No hidden functionality

## Third-Party Services

### Azure DevOps

The Extension communicates with Azure DevOps REST APIs to:
- Fetch work item data
- Retrieve comments and history
- Access related work items

This communication:
- Uses your existing authenticated session
- Follows Azure DevOps security policies
- Does not create new connections or expose credentials

### jsPDF Library

The Extension uses jsPDF (open-source library) to generate PDFs:
- Runs entirely in your browser
- Does not send data to external servers
- No telemetry or tracking
- GitHub: https://github.com/parallax/jsPDF

## Data Storage

The Extension does NOT store any data:

- ❌ No local storage
- ❌ No session storage
- ❌ No cookies
- ❌ No cache
- ❌ No IndexedDB
- ❌ No browser storage of any kind

The only data that persists is the PDF file you download, which is stored locally on your device (like any downloaded file).

## Children's Privacy

The Extension does not knowingly collect data from anyone, including children under 13. Since we don't collect any data at all, there are no special considerations for children's privacy.

## International Data Transfers

Since the Extension doesn't collect or transmit data to our servers:
- No international data transfers occur
- All processing happens in your local browser
- Data remains within your Azure DevOps organization's region

## Changes to This Privacy Policy

We may update this privacy policy from time to time. We will notify users of any material changes by:
- Updating the "Last Updated" date
- Publishing changes on GitHub
- Updating the policy in the extension package

## Compliance

### GDPR (General Data Protection Regulation)

The Extension is GDPR-compliant because:
- We don't process personal data
- We don't store or transmit user data
- Users maintain full control of their data
- No consent is required (as we don't collect data)

### CCPA (California Consumer Privacy Act)

The Extension complies with CCPA because:
- We don't sell personal information (we don't collect it)
- We don't share data with third parties
- Users have complete control over their data

### SOC 2 / ISO 27001

Organizations using the Extension can maintain their compliance certifications as:
- The Extension doesn't introduce data storage or transmission risks
- All data remains within your Azure DevOps environment
- Client-side processing doesn't impact compliance posture

## Contact Information

If you have questions about this privacy policy:

- **Email**: [anjalisinha312@outlook.com]
- **GitHub Issues**: https://github.com/yourusername/workitem-exporter/issues
- **GitHub Discussions**: https://github.com/yourusername/workitem-exporter/discussions

## Your Consent

By using the Extension, you acknowledge that:
- You have read this privacy policy
- You understand that the Extension processes data locally in your browser
- You understand that no data is collected or transmitted to external servers
- You are responsible for the PDFs you generate and download

## Transparency Promise

We commit to:
- ✅ Keeping the Extension open source
- ✅ Never collecting user data without explicit notice
- ✅ Never introducing tracking or analytics without disclosure
- ✅ Maintaining transparency about how the Extension works
- ✅ Promptly addressing privacy concerns

---

## Summary

**In plain English:**

When you use this Extension to export work items:
1. Your browser fetches work item data from Azure DevOps
2. Your browser generates a PDF locally
3. The PDF downloads to your computer
4. **Nothing is sent to us or anyone else**
5. **We never see your data**

It's that simple. Your data is yours, and it stays yours.

---

**Questions?** Open an issue on GitHub or contact us at [anjalisinha312@outlook.com]

**Last Updated:** February 2026