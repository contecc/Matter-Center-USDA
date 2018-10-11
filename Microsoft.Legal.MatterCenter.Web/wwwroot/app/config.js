﻿var configs =
{
  "uri": {
    "SPOsiteURL": "https://mattercenterusda.sharepoint.com",
    "tenant": "mattercenterusda.onmicrosoft.com",
    "MainURL": "http://www.microsoft.com/mattercenter"
  },
  "ADAL": {
    "clientId": "2d5b12b8-3fd7-45f3-8e5a-dfae04afe737",
    "authUserEmail": ""
  },
  "appInsights": {
    "instrumentationKey": "698c5061-ca01-4469-959d-16617d3d2a48",
    "appType": ""
  },
  "global": {
    "repositoryUrl": "https://mattercenterusda.sharepoint.com/sites/catalog",
    "isDevMode": true,
    "isBackwardCompatible": false,
    "isClientMappedWithHierachy": false,
    "overwriteDupliacteFileNameWithDateTimeFor": "Email Only"
  },
  "matter": {
    "SpecialCharacterExpressionContentType": "[@\\/:*?#%<>{}|~&\"]",
    "SpecialCharacterExpressionMatterDescription": "[A-Za-z0-9_]+[-A-Za-z0-9_, . �]*",
    "SpecialCharacterExpressionMatterId": "[A-Za-z0-9_]+[-A-Za-z0-9_, .]*",
    "SpecialCharacterExpressionMatterTitle": "[A-Za-z0-9_]+[-A-Za-z0-9_, . '() �]*",
    "StampedPropertyBlockedUploadUsers": "BlockedUploadUsers",
    "StampedPropertyBlockedUsers": "BlockedUsers",
    "StampedPropertyClientID": "ClientID",
    "StampedPropertyClientName": "ClientName",
    "StampedPropertyConflictCheckBy": "MatterConflictCheckBy",
    "StampedPropertyConflictCheckDate": "MatterConflictCheckDate",
    "StampedPropertyDefaultContentType": "MatterCenterDefaultContentType",
    "StampedPropertyDocumentTemplateCount": "DocumentTemplateCount",
    "StampedPropertyIsConflictIdentified": "IsConflictIdentified",
    "StampedPropertyIsMatter": "IsMatter",
    "StampedPropertyMatterCenterPermissions": "MatterCenterPermissions",
    "StampedPropertyMatterCenterRoles": "MatterCenterRoles",
    "StampedPropertyMatterCenterUserEmails": "MatterCenterUserEmails",
    "StampedPropertyMatterCenterUsers": "MatterCenterUsers",
    "StampedPropertyMatterDescription": "MatterDescription",
    "StampedPropertyMatterGUID": "MatterGUID",
    "StampedPropertyMatterID": "MatterID",
    "StampedPropertyMatterName": "MatterName",
    "StampedPropertyOpenDate": "OpenDate",
    "StampedPropertyResponsibleAttorney": "ResponsibleAttorney",
    "StampedPropertyResponsibleAttorneyEmail": "ResponsibleAttorneyEmail",
    "StampedPropertySecureMatter": "SecureMatter",
    "StampedPropertySuccess": "Success",
    "StampedPropertyTeamMembers": "TeamMembers"
  },
  "taxonomy": {
    "levels": "3",
    "practiceGroupTermSetName": "Practice Groups",
    "termGroup": "MatterCenterTerms",
    "clientTermSetName": "Clients",
    "clientCustomPropertiesURL": "ClientURL",
    "clientCustomPropertiesId": "ClientID",
    "subAreaOfLawCustomContentTypeProperty": "ContentTypeName",
    "subAreaOfLawDocumentContentTypeProperty": "DocumentTemplates",
    "matterProvisionExtraPropertiesContentType": "MatterProvisionExtraPropertiesContentType"
  },
  "search": {
    "Schema": "MatterCenter",
    "ManagedPropertyAreaOfLaw": "MCAreaofLaw",
    "ManagedPropertyAuthor": "MSITOfficeAuthor",
    "ManagedPropertyBlockedUploadUsers": "MCBlockedUploadUser",
    "ManagedPropertyCheckOutByUser": "CheckoutUserOWSUSER",
    "ManagedPropertyClientID": "MCClientID",
    "ManagedPropertyClientName": "MCClientName",
    "ManagedPropertyCreated": "Created",
    "ManagedPropertyCustomTitle": "RefinableString10",
    "ManagedPropertyDescription": "Description",
    "ManagedPropertyDocumentCheckOutUser": "MCCheckoutUser",
    "ManagedPropertyDocumentClientId": "MCDocumentClientID",
    "ManagedPropertyDocumentClientName": "MCDocumentClientName",
    "ManagedPropertyDocumentId": "dlcDocIdOWSText",
    "ManagedPropertyDocumentLastModifiedTime": "MCModifiedDate",
    "ManagedPropertyDocumentMatterId": "RefinableString12",
    "ManagedPropertyDocumentMatterName": "RefinableString13",
    "ManagedPropertyDocumentVersion": "MCVersionNumber",
    "ManagedPropertyExtension": "MC",
    "ManagedPropertyFileExtension": "FileExtension",
    "ManagedPropertyFileName": "FileName",
    "ManagedPropertyIsDocument": "IsDocument",
    "ManagedPropertyIsMatter": "MCIsMatter",
    "ManagedPropertyLastModifiedTime": "LastModifiedTime",
    "ManagedPropertyMatterDefaultContentType": "MCMatterDefaultContentType",
    "ManagedPropertyMatterGuid": "MatterCenterMatterGUID",
    "ManagedPropertyMatterGuidLogging": "",
    "ManagedPropertyMatterId": "MCMatterID",
    "ManagedPropertyMatterName": "MCMatterName",
    "ManagedPropertyName": "Name",
    "ManagedPropertyOpenDate": "MCOpenDate",
    "ManagedPropertyPath": "Path",
    "ManagedPropertyPracticeGroup": "MCPracticeGroup",
    "ManagedPropertyResponsibleAttorney": "MCResponsibleAttorney",
    "ManagedPropertyServerRelativeUrl": "ServerRelativeURL",
    "ManagedPropertySiteName": "SiteName",
    "ManagedPropertySiteTitle": "SiteTitle",
    "ManagedPropertySPWebUrl": "SPWebUrl",
    "ManagedPropertySubAreaOfLaw": "MCSubAreaofLaw",
    "ManagedPropertySubAreaOfLaw1": "MCSubareaoflaw1",
    "ManagedPropertySubAreaOfLaw2": "MCSubareaoflaw2",
    "ManagedPropertyTeamMembers": "MCTeamMembers",
    "ManagedPropertyTitle": "Title",
    "ManagedPropertyUIVersionStringOWSTEXT": "UIVersionStringOWSTEXT",
    "searchColumnsUIPickerForMatter": {
      "hideUpload": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "gridclass",
        "dashboardcellTemplate": "",
        "dashboardHeaderCellClass": "gridclass",
        "dashboardwidth": "210",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn13Header",
        "enableColumnMenu": true,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "hideUpload",
        "position": -1,
        "width": "210"
      },
      "matterAreaOfLaw": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterAreaOfLaw==\"\"?\"NA\":row.entity.matterAreaOfLaw}}>{{row.entity.matterAreaOfLaw==\"\"?\"NA\":row.entity.matterAreaOfLaw}}</div>",
        "dashboardCellClass": "matterTeamTypeClass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterAreaOfLaw==\"\"?\"NA\":row.entity.matterAreaOfLaw}}>{{row.entity.matterAreaOfLaw==\"\"?\"NA\":row.entity.matterAreaOfLaw}}</div>",
        "dashboardHeaderCellClass": "matterTeamTypeClass",
        "dashboardwidth": "210",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn3Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/matter/MatterTemplates/AreaofLawHeaderTemplate.html",
        "keyName": "matterAreaOfLaw",
        "position": -1,
        "width": "210"
      },
      "matterClient": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterClient==\"\"?\"NA\":row.entity.matterClient}}>{{row.entity.matterClient==\"\"?\"NA\":row.entity.matterClient}}</div>",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterClient==\"\"?\"NA\":row.entity.matterClient}}>{{row.entity.matterClient==\"\"?\"NA\":row.entity.matterClient}}</div>",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "150",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn3Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/matter/MatterTemplates/ClientHeaderTemplate.html",
        "keyName": "matterClient",
        "position": 3,
        "width": "200"
      },
      "matterClientId": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title='{{row.entity.matterClientId}}.{{row.entity.matterID}}'>{{row.entity.matterClientId}}.{{row.entity.matterID}}</div>",
        "dashboardCellClass": "matterGridClientClass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterClientId}}.{{row.entity.matterID}}</div>{{row.entity.matterClientId}}.{{row.entity.matterID}}</div>",
        "dashboardHeaderCellClass": "matterGridClientClass",
        "dashboardwidth": "200",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn2Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "Custom",
        "keyName": "matterClientId",
        "position": 2,
        "width": "150"
      },
      "matterClientUrl": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterClientUrl==\"\"?\"NA\":row.entity.matterClientUrl}}>{{row.entity.matterClientUrl==\"\"?\"NA\":row.entity.matterClientUrl}}</div>",
        "dashboardCellClass": "gridclass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterClientUrl==\"\"?\"NA\":row.entity.matterClientUrl}}>{{row.entity.matterClientUrl==\"\"?\"NA\":row.entity.matterClientUrl}}</div>",
        "dashboardHeaderCellClass": "gridclass",
        "dashboardwidth": "210",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn10Header",
        "enableColumnMenu": true,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "matterClientUrl",
        "position": -1,
        "width": "210"
      },
      "matterCreatedDate": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" datefilter date=\"{{row.entity.matterCreatedDate}}\"></div>",
        "dashboardCellClass": "matterCreatedDateClass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" datefilter date=\"{{row.entity.matterCreatedDate}}\"></div>",
        "dashboardHeaderCellClass": "matterCreatedDateClass",
        "dashboardwidth": "170",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": true,
        "displayName": "GridColumn7Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/matter/MatterTemplates/OpenDateTemplate.html",
        "keyName": "matterCreatedDate",
        "position": 7,
        "width": "170"
      },
      "matterDefaultContentType": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "gridclass",
        "dashboardcellTemplate": "",
        "dashboardHeaderCellClass": "gridclass",
        "dashboardwidth": "210",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn13Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "matterDefaultContentType",
        "position": -1,
        "width": "210"
      },
      "matterDescription": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterDescription==\"\"?\"NA\":row.entity.matterDescription}}>{{row.entity.matterDescription==\"\"?\"NA\":row.entity.matterDescription}}</div>",
        "dashboardCellClass": "gridclass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterDescription==\"\"?\"NA\":row.entity.matterDescription}}>{{row.entity.matterDescription==\"\"?\"NA\":row.entity.matterDescription}}</div>",
        "dashboardHeaderCellClass": "gridclass",
        "dashboardwidth": "210",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn8Header",
        "enableColumnMenu": true,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "matterDescription",
        "position": -1,
        "width": "275"
      },
      "matterGuid": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterGuid==\"\"?\"NA\":row.entity.matterGuid}}>{{row.entity.matterGuid==\"\"?\"NA\":row.entity.matterGuid}}</div>",
        "dashboardCellClass": "gridclass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterGuid==\"\"?\"NA\":row.entity.matterGuid}}>{{row.entity.matterGuid==\"\"?\"NA\":row.entity.matterGuid}}</div>",
        "dashboardHeaderCellClass": "gridclass",
        "dashboardwidth": "210",
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn14Header",
        "enableColumnMenu": true,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "matterGuid",
        "position": -1,
        "width": "210"
      },
      "matterID": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterID==\"\"?\"NA\":row.entity.matterID}}>{{row.entity.matterID==\"\"?\"NA\":row.entity.matterID}}</div>",
        "dashboardCellClass": "gridclass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterID==\"\"?\"NA\":row.entity.matterID}}>{{row.entity.matterID==\"\"?\"NA\":row.entity.matterID}}</div>",
        "dashboardHeaderCellClass": "gridclass",
        "dashboardwidth": "210",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn6Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/matter/MatterTemplates/ProjectIDHeaderTemplate.html",
        "keyName": "matterID",
        "position": -1,
        "width": "210"
      },
      "matterModifiedDate": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\"  datefilter date=\"{{row.entity.matterModifiedDate}}\"></div>",
        "dashboardCellClass": "matterGridModDateClass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\"  datefilter date=\"{{row.entity.matterModifiedDate}}\"></div>",
        "dashboardHeaderCellClass": "matterGridModDateClass",
        "dashboardwidth": "200",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": false,
        "displayInUI": true,
        "displayName": "GridColumn4Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/matter/MatterTemplates/ModifiedDateTemplate.html",
        "keyName": "matterModifiedDate",
        "position": 4,
        "width": "195"
      },
      "matterName": {
        "cellClass": "",
        "cellTemplate": "../app/matter/MatterTemplates/MatterCellTemplate.html",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "../app/dashboard/MatterDashboardCellTemplate.html",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "230",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn1Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "",
        "headerCellTemplate": "../app/matter/MatterTemplates/MatterHeaderTemplate.html",
        "keyName": "matterName",
        "position": 1,
        "width": "275"
      },
      "matterPracticeGroup": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterPracticeGroup==\"\"?\"NA\":row.entity.matterPracticeGroup}}>{{row.entity.matterPracticeGroup==\"\"?\"NA\":row.entity.matterPracticeGroup}}</div>",
        "dashboardCellClass": "gridclass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterPracticeGroup==\"\"?\"NA\":row.entity.matterPracticeGroup}}>{{row.entity.matterPracticeGroup==\"\"?\"NA\":row.entity.matterPracticeGroup}}</div>",
        "dashboardHeaderCellClass": "gridclass",
        "dashboardwidth": "210",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn2Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/matter/MatterTemplates/PracticeGroupHeaderTemplate.html",
        "keyName": "matterPracticeGroup",
        "position": -1,
        "width": "210"
      },
      "matterResponsibleAttorney": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterResponsibleAttorney==\"\"?\"NA\":row.entity.matterResponsibleAttorney}}>{{row.entity.matterResponsibleAttorney==\"\"?\"NA\":row.entity.matterResponsibleAttorney}}</div>",
        "dashboardCellClass": "matterGridAttorClass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterResponsibleAttorney==\"\"?\"NA\":row.entity.matterResponsibleAttorney}}>{{row.entity.matterResponsibleAttorney==\"\"?\"NA\":row.entity.matterResponsibleAttorney}}</div>",
        "dashboardHeaderCellClass": "matterGridAttorClass",
        "dashboardwidth": "175",
        "defaultVisibleInGrid": false,
        "displayInDashboard": true,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn5Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/matter/MatterTemplates/ResponsibleAttorneyHeaderTemplate.html",
        "keyName": "matterResponsibleAttorney",
        "position": 5,
        "width": "250"
      },
      "matterSubAreaOfLaw": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterSubAreaOfLaw==\"\"?\"NA\":row.entity.matterSubAreaOfLaw}}>{{row.entity.matterSubAreaOfLaw==\"\"?\"NA\":row.entity.matterSubAreaOfLaw}}</div>",
        "dashboardCellClass": "matterProjectTypeClass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.matterSubAreaOfLaw==\"\"?\"NA\":row.entity.matterSubAreaOfLaw}}>{{row.entity.matterSubAreaOfLaw==\"\"?\"NA\":row.entity.matterSubAreaOfLaw}}</div>",
        "dashboardHeaderCellClass": "matterProjectTypeClass",
        "dashboardwidth": "210",
        "defaultVisibleInGrid": true,
        "displayInDashboard": false,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn6Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/matter/MatterTemplates/SubAreaofLawHeaderTemplate.html",
        "keyName": "matterSubAreaOfLaw",
        "position": 6,
        "width": "210"
      },
      "matterUrl": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "gridclass",
        "dashboardcellTemplate": "",
        "dashboardHeaderCellClass": "gridclass",
        "dashboardwidth": "210",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn9Header",
        "enableColumnMenu": true,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "matterUrl",
        "position": -1,
        "width": "275"
      }
    },
    "searchColumnsUIPickerForDocument": {
      "docId": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "",
        "dashboardHeaderCellClass": "",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn20Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "docId",
        "position": -1,
        "width": "170"
      },
      "documentCheckoutUser": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentCheckoutUser==\"\"?\"NA\":row.entity.documentCheckoutUser}}>{{row.entity.documentCheckoutUser==\"\"?\"NA\":row.entity.documentCheckoutUser}}</div>",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentCheckoutUser==\"\"?\"NA\":row.entity.documentCheckoutUser}}>{{row.entity.documentCheckoutUser==\"\"?\"NA\":row.entity.documentCheckoutUser}}</div>",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": true,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": true,
        "displayName": "GridColumn7Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/document/DocumentTemplates/CheckOutHeaderTemplate.html",
        "keyName": "documentCheckoutUser",
        "position": 7,
        "width": "180"
      },
      "documentClient": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentClient==\"\"?\"NA\":row.entity.documentClient}}>{{row.entity.documentClient==\"\"?\"NA\":row.entity.documentClient}}</div>",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentClient==\"\"?\"NA\":row.entity.documentClient}}>{{row.entity.documentClient==\"\"?\"NA\":row.entity.documentClient}}</div>",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "150",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn2Header",
        "enableColumnMenu": false,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/document/DocumentTemplates/ClientHeaderTemplate.html",
        "keyName": "documentClient",
        "position": 2,
        "width": "150"
      },
      "documentClientId": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentClientId==\"\"?\"NA\":row.entity.documentClientId}}.{{row.entity.documentMatterId==\"\"?\"NA\":row.entity.documentMatterId}} >{{row.entity.documentClientId==\"\"?\"NA\":row.entity.documentClientId}}.{{row.entity.documentMatterId==\"\"?\"NA\":row.entity.documentMatterId}}</div>",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentClientId==\"\"?\"NA\":row.entity.documentClientId}}.{{row.entity.documentMatterId==\"\"?\"NA\":row.entity.documentMatterId}}>{{row.entity.documentClientId==\"\"?\"NA\":row.entity.documentClientId}}.{{row.entity.documentMatterId==\"\"?\"NA\":row.entity.documentMatterId}}</div>",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "150",
        "defaultVisibleInGrid": true,
        "displayInDashboard": false,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn3Header",
        "enableColumnMenu": false,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "Custom",
        "keyName": "documentClientId",
        "position": 3,
        "width": "180"
      },
      "documentCreatedDate": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" datefilter date=\"{{row.entity.documentCreatedDate}}\"></div>",
        "dashboardCellClass": "docCreatedDateTypeClass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" datefilter date=\"{{row.entity.documentCreatedDate}}\"></div>",
        "dashboardHeaderCellClass": "docCreatedDateTypeClass",
        "dashboardwidth": "150",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": true,
        "displayName": "GridColumn8Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/document/DocumentTemplates/CreatedDateHeaderTemplate.html",
        "keyName": "documentCreatedDate",
        "position": 8,
        "width": "150"
      },
      "documentExtension": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentExtension==\"\"?\"NA\":row.entity.documentExtension}}>{{row.entity.documentExtension==\"\"?\"NA\":row.entity.documentExtension}}</div>",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentExtension==\"\"?\"NA\":row.entity.documentExtension}}>{{row.entity.documentExtension==\"\"?\"NA\":row.entity.documentExtension}}</div>",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn12Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "documentExtension",
        "position": -1,
        "width": "170"
      },
      "documentIconUrl": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn13Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "documentIconUrl",
        "position": -1,
        "width": "170"
      },
      "documentID": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentID==\"\"?\"NA\":row.entity.documentID}}>{{row.entity.documentID==\"\"?\"NA\":row.entity.documentID}}</div>",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentID==\"\"?\"NA\":row.entity.documentID}}>{{row.entity.documentID==\"\"?\"NA\":row.entity.documentID}}</div>",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn14Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "documentID",
        "position": -1,
        "width": "170"
      },
      "documentMatterId": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentMatterId==\"\"?\"NA\":row.entity.documentMatterId}}>{{row.entity.documentMatterId==\"\"?\"NA\":row.entity.documentMatterId}}</div>",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentMatterId==\"\"?\"NA\":row.entity.documentMatterId}}>{{row.entity.documentMatterId==\"\"?\"NA\":row.entity.documentMatterId}}</div>",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn11Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "documentMatterId",
        "position": -1,
        "width": "170"
      },
      "documentMatterName": {
        "cellClass": "gridclass",
        "cellTemplate": "\"<div class=\\\"ui-grid-cell-contents\\\" title={{row.entity.documentMatterName==\\\"\\\"?\\\"NA\\\":row.entity.documentMatterName}} ng-bind-html=\"COL_FIELD\"></div>\"",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "\"<div class=\\\"ui-grid-cell-contents\\\" title={{row.entity.documentMatterName==\\\"\\\"?\\\"NA\\\":row.entity.documentMatterName}} ng-bind-html=\"COL_FIELD\"></div>\"",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn3Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/document/DocumentTemplates/ProjectNameHeaderTemplate.html",
        "keyName": "documentMatterName",
        "position": -1,
        "width": "200"
      },
      "documentMatterUrl": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn18Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "documentMatterUrl",
        "position": -1,
        "width": "170"
      },
      "documentModifiedDate": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\"  datefilter date=\"{{row.entity.documentModifiedDate}}\"></div>",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\"  datefilter date=\"{{row.entity.documentModifiedDate}}\"></div>",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "150",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn4Header",
        "enableColumnMenu": false,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/document/DocumentTemplates/ModifiedDateHeaderTemplate.html",
        "keyName": "documentModifiedDate",
        "position": 4,
        "width": "195"
      },
      "documentName": {
        "cellClass": "",
        "cellTemplate": "../app/document/DocumentTemplates/DocumentCellTemplate.html",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "../app/dashboard/DocumentDashboardCellTemplate.html",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "300",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": false,
        "displayInUI": true,
        "displayName": "GridColumn1Header",
        "enableColumnMenu": true,
        "enableHiding": false,
        "headerCellClass": "",
        "headerCellTemplate": "../app/document/DocumentTemplates/DocumentHeaderTemplate.html",
        "keyName": "documentName",
        "position": 1,
        "width": "278"
      },
      "documentOWAUrl": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn15Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "documentOWAUrl",
        "position": -1,
        "width": "170"
      },
      "documentOwner": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentOwner==\"\"?\"NA\":row.entity.documentOwner}}>{{row.entity.documentOwner==\"\"?\"NA\":row.entity.documentOwner}}</div>",
        "dashboardCellClass": "docOwnerGridClass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentOwner==\"\"?\"NA\":row.entity.documentOwner}}>{{row.entity.documentOwner==\"\"?\"NA\":row.entity.documentOwner}}</div>",
        "dashboardHeaderCellClass": "docOwnerGridClass",
        "dashboardwidth": "150",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn5Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/document/DocumentTemplates/AuthorHeaderTemplate.html",
        "keyName": "documentOwner",
        "position": 5,
        "width": "150"
      },
      "documentParentUrl": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn17Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "documentParentUrl",
        "position": -1,
        "width": "170"
      },
      "documentPracticeGroup": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentPracticeGroup==\"\"?\"NA\":row.entity.documentPracticeGroup}}>{{row.entity.documentPracticeGroup==\"\"?\"NA\":row.entity.documentPracticeGroup}}</div>",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentPracticeGroup==\"\"?\"NA\":row.entity.documentPracticeGroup}}>{{row.entity.documentPracticeGroup==\"\"?\"NA\":row.entity.documentPracticeGroup}}</div>",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn6Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "../app/document/DocumentTemplates/PracticeGroupHeaderTemplate.html",
        "keyName": "documentPracticeGroup",
        "position": -1,
        "width": "200"
      },
      "documentUrl": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn16Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "documentUrl",
        "position": -1,
        "width": "170"
      },
      "documentVersion": {
        "cellClass": "gridclass",
        "cellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentVersion==\"\"?\"NA\":row.entity.documentVersion}}>{{row.entity.documentVersion==\"\"?\"NA\":row.entity.documentVersion}}</div>",
        "dashboardCellClass": "docGridVerClass",
        "dashboardcellTemplate": "<div class=\"ui-grid-cell-contents\" title={{row.entity.documentVersion==\"\"?\"NA\":row.entity.documentVersion}}>{{row.entity.documentVersion==\"\"?\"NA\":row.entity.documentVersion}}</div>",
        "dashboardHeaderCellClass": "docGridVerClass",
        "dashboardwidth": "80",
        "defaultVisibleInGrid": true,
        "displayInDashboard": true,
        "displayInFlyOut": true,
        "displayInUI": true,
        "displayName": "GridColumn6Header",
        "enableColumnMenu": true,
        "enableHiding": true,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "Custom",
        "keyName": "documentVersion",
        "position": 6,
        "width": "100"
      },
      "sitename": {
        "cellClass": "gridclass",
        "cellTemplate": "",
        "dashboardCellClass": "",
        "dashboardcellTemplate": "",
        "dashboardHeaderCellClass": "",
        "dashboardwidth": "250",
        "defaultVisibleInGrid": false,
        "displayInDashboard": false,
        "displayInFlyOut": false,
        "displayInUI": false,
        "displayName": "GridColumn9Header",
        "enableColumnMenu": false,
        "enableHiding": false,
        "headerCellClass": "gridclass",
        "headerCellTemplate": "",
        "keyName": "sitename",
        "position": -1,
        "width": "170"
      }
    }
  },
  "contentTypes": {
    "managedColumns": {
      "ColumnName1": "PracticeGroup",
      "ColumnName2": "AreaOfLaw",
      "ColumnName3": "SubareaOfLaw",
      "ColumnName4": "SubareaOfLaw1",
      "ColumnName5": "SubareaOfLaw2"
    },
    "managedStampedColumns": {
      "ColumnName1": "PracticeGroup",
      "ColumnName2": "AreaOfLaw",
      "ColumnName3": "SubareaOfLaw",
      "ColumnName4": "SubareaOfLaw1",
      "ColumnName5": "SubareaOfLaw2"
    }
  }
}